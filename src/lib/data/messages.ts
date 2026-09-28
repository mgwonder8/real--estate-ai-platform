import { appendRow, readTable } from "@/lib/google/sheet-table";
import { getSheetsClient } from "@/lib/google/clients";
import { env } from "@/lib/env";
import { newId } from "@/lib/ids";

const TAB = "Messages";
const HEADERS = ["id", "from_id", "to_id", "message", "created_at", "read_at"];

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  message: string;
  createdAt: string;
  readAt: string;
}

function toMessage(data: Record<string, string>): Message {
  return {
    id: data.id,
    fromId: data.from_id,
    toId: data.to_id,
    message: data.message,
    createdAt: data.created_at,
    readAt: data.read_at ?? "",
  };
}

/** Creates the Messages sheet tab with headers if it doesn't exist. */
async function ensureTab(): Promise<void> {
  const sheets = getSheetsClient();
  try {
    await sheets.spreadsheets.values.get({
      spreadsheetId: env.spreadsheetId,
      range: `${TAB}!1:1`,
    });
  } catch {
    // Tab doesn't exist — create it
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: env.spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: TAB } } }] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: env.spreadsheetId,
      range: `${TAB}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [HEADERS] },
    });
  }
}

/** Safe readTable — returns empty if tab doesn't exist yet. */
async function safeRead() {
  try {
    return await readTable(TAB);
  } catch {
    return { headers: HEADERS, rows: [] };
  }
}

export async function listMessagesBetween(staffIdA: string, staffIdB: string): Promise<Message[]> {
  const { rows } = await safeRead();
  return rows
    .map((r) => toMessage(r.data))
    .filter(
      (m) =>
        (m.fromId === staffIdA && m.toId === staffIdB) ||
        (m.fromId === staffIdB && m.toId === staffIdA)
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function listMessagesAfter(staffIdA: string, staffIdB: string, after: string): Promise<Message[]> {
  const all = await listMessagesBetween(staffIdA, staffIdB);
  return all.filter((m) => m.createdAt > after);
}

/** Returns the most recent message per conversation partner for the chat list. */
export async function listConversations(myStaffId: string): Promise<{ partnerId: string; last: Message; unread: number }[]> {
  const { rows } = await safeRead();
  const all = rows.map((r) => toMessage(r.data)).filter((m) => m.fromId === myStaffId || m.toId === myStaffId);
  const byPartner = new Map<string, Message[]>();
  for (const m of all) {
    const partner = m.fromId === myStaffId ? m.toId : m.fromId;
    if (!byPartner.has(partner)) byPartner.set(partner, []);
    byPartner.get(partner)!.push(m);
  }
  return Array.from(byPartner.entries())
    .map(([partnerId, msgs]) => {
      const sorted = [...msgs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const unread = msgs.filter((m) => m.toId === myStaffId && !m.readAt).length;
      return { partnerId, last: sorted[0], unread };
    })
    .sort((a, b) => b.last.createdAt.localeCompare(a.last.createdAt));
}

export async function countUnread(myStaffId: string): Promise<number> {
  const { rows } = await safeRead();
  return rows
    .map((r) => toMessage(r.data))
    .filter((m) => m.toId === myStaffId && !m.readAt).length;
}

export async function sendMessage(fromId: string, toId: string, message: string): Promise<Message> {
  await ensureTab();
  const msg: Message = {
    id: newId("msg"),
    fromId,
    toId,
    message,
    createdAt: new Date().toISOString(),
    readAt: "",
  };
  await appendRow(TAB, {
    id: msg.id,
    from_id: msg.fromId,
    to_id: msg.toId,
    message: msg.message,
    created_at: msg.createdAt,
    read_at: "",
  });
  return msg;
}

export async function markConversationRead(myStaffId: string, partnerStaffId: string): Promise<void> {
  let rows;
  try {
    ({ rows } = await readTable(TAB));
  } catch {
    return;
  }
  const sheets = getSheetsClient();
  const now = new Date().toISOString();
  const unread = rows.filter(
    (r) => r.data.from_id === partnerStaffId && r.data.to_id === myStaffId && !r.data.read_at
  );
  await Promise.all(
    unread.map((r) =>
      sheets.spreadsheets.values.update({
        spreadsheetId: env.spreadsheetId,
        range: `${TAB}!F${r.rowNumber}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[now]] },
      })
    )
  );
}
