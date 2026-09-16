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
export async function readTable(tab: string): Promise<{ headers: string[]; rows: { rowNumber: number; data: SheetRow }[] }> {
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
