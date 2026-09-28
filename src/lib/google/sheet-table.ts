import { getSheetsClient } from "@/lib/google/clients";
import { env } from "@/lib/env";

export type SheetRow = Record<string, string>;

const headerCache = new Map<string, string[]>();

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  const maxAttempts = 5;
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      const status = (err as { code?: number; status?: number })?.code ?? (err as { status?: number })?.status;
      attempt += 1;
      if (status !== 429 || attempt >= maxAttempts) throw err;
      const delayMs = 1000 * 2 ** attempt + Math.random() * 500;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

type Table = { headers: string[]; rows: { rowNumber: number; data: SheetRow }[] };

// Short-lived per-instance cache: one page render reads the same tabs many times
// (listStaff, getStaff, findRowById...), and chat polling reads Messages every few seconds.
// Writes clear the cache instantly on this instance; the TTL only bounds staleness across instances.
const DEFAULT_TTL_MS = 15000;
const TTL_MS: Record<string, number> = { Messages: 2500 };
const tableCache = new Map<string, { at: number; promise: Promise<Table> }>();

export function invalidateTable(tab?: string): void {
  if (tab) tableCache.delete(tab);
  else tableCache.clear();
}

export function invalidateHeaderCache(tab?: string): void {
  if (tab) headerCache.delete(tab);
  else headerCache.clear();
  invalidateTable(tab);
}

const ensured = new Map<string, Promise<void>>();

/** Creates the tab if it doesn't exist and appends any missing header columns. Runs once per tab per instance. */
export function ensureTable(tab: string, headers: string[]): Promise<void> {
  let ready = ensured.get(tab);
  if (!ready) {
    ready = createOrUpgradeTable(tab, headers).catch((err) => {
      ensured.delete(tab);
      throw err;
    });
    ensured.set(tab, ready);
  }
  return ready;
}

async function createOrUpgradeTable(tab: string, headers: string[]): Promise<void> {
  const sheets = getSheetsClient();
  let existing: string[] | null;
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: env.spreadsheetId, range: `${tab}!1:1` });
    existing = (res.data.values?.[0] ?? []).map((h) => String(h));
  } catch {
    existing = null;
  }

  if (existing === null) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: env.spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: tab } } }] },
    });
    existing = [];
  }

  const missing = headers.filter((h) => !existing!.includes(h));
  if (missing.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: env.spreadsheetId,
      range: `${tab}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[...existing, ...missing]] },
    });
    invalidateHeaderCache(tab);
  }
}

async function getHeaders(sheets: ReturnType<typeof getSheetsClient>, tab: string): Promise<string[]> {
  const cached = headerCache.get(tab);
  if (cached) return cached;
  const res = await withRetry(() =>
    sheets.spreadsheets.values.get({ spreadsheetId: env.spreadsheetId, range: `${tab}!1:1` })
  );
  const headers = (res.data.values?.[0] ?? []).map((h) => String(h));
  headerCache.set(tab, headers);
  return headers;
}

function rowArrayToObject(headers: string[], row: string[]): SheetRow {
  const obj: SheetRow = {};
  headers.forEach((header, i) => {
    obj[header] = row[i] ?? "";
  });
  return obj;
}

function objectToRowArray(headers: string[], obj: SheetRow): string[] {
  return headers.map((h) => obj[h] ?? "");
}

/** Reads every data row of a tab. rowNumber is the 1-indexed sheet row (data starts at 2). */
export function readTable(tab: string): Promise<Table> {
  const hit = tableCache.get(tab);
  if (hit && Date.now() - hit.at < (TTL_MS[tab] ?? DEFAULT_TTL_MS)) return hit.promise;
  const promise = fetchTable(tab);
  tableCache.set(tab, { at: Date.now(), promise });
  promise.catch(() => tableCache.delete(tab));
  return promise;
}

async function fetchTable(tab: string): Promise<Table> {
  const sheets = getSheetsClient();
  const headers = await getHeaders(sheets, tab);
  const res = await withRetry(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId: env.spreadsheetId,
      range: `${tab}!A2:${columnLetter(headers.length)}`,
    })
  );
  const values = res.data.values ?? [];
  const rows = values
    .map((row, i) => ({ rowNumber: i + 2, data: rowArrayToObject(headers, row as string[]) }))
    .filter((r) => Object.values(r.data).some((v) => v !== ""));
  return { headers, rows };
}

export async function appendRow(tab: string, obj: SheetRow): Promise<void> {
  const sheets = getSheetsClient();
  const headers = await getHeaders(sheets, tab);
  await withRetry(() =>
    sheets.spreadsheets.values.append({
      spreadsheetId: env.spreadsheetId,
      range: `${tab}!A:A`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [objectToRowArray(headers, obj)] },
    })
  );
  invalidateTable(tab);
}

export async function updateRow(tab: string, rowNumber: number, obj: SheetRow): Promise<void> {
  const sheets = getSheetsClient();
  const headers = await getHeaders(sheets, tab);
  await withRetry(() =>
    sheets.spreadsheets.values.update({
      spreadsheetId: env.spreadsheetId,
      range: `${tab}!A${rowNumber}:${columnLetter(headers.length)}${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [objectToRowArray(headers, obj)] },
    })
  );
  invalidateTable(tab);
}

export async function findRowById(tab: string, id: string): Promise<{ rowNumber: number; data: SheetRow } | null> {
  const { rows } = await readTable(tab);
  return rows.find((r) => r.data.id === id) ?? null;
}

/** Blanks out a row so it's excluded from future reads, without shifting other rows. */
export async function clearRow(tab: string, rowNumber: number): Promise<void> {
  const sheets = getSheetsClient();
  const headers = await getHeaders(sheets, tab);
  await withRetry(() =>
    sheets.spreadsheets.values.clear({
      spreadsheetId: env.spreadsheetId,
      range: `${tab}!A${rowNumber}:${columnLetter(headers.length)}${rowNumber}`,
    })
  );
  invalidateTable(tab);
}

export async function deleteRowById(tab: string, id: string): Promise<boolean> {
  const row = await findRowById(tab, id);
  if (!row) return false;
  await clearRow(tab, row.rowNumber);
  return true;
}

function columnLetter(count: number): string {
  let n = count;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters || "A";
}
