import { appendRow, readTable, ensureTable, invalidateTable } from "@/lib/google/sheet-table";
import { getSheetsClient } from "@/lib/google/clients";
import { env } from "@/lib/env";
import { newId } from "@/lib/ids";

const TAB = "Messages";
const HEADERS = [
  "id",
  "from_id",
  "to_id",
  "message",
  "attachment_url",
  "attachment_name",
  "attachment_type",
  "created_at",
  "read_at",
  "task_id",
];

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  message: string;
  attachmentUrl: string;
  attachmentName: string;
  attachmentType: string;
  createdAt: string;
  readAt: string;
  taskId: string;
}

function toMessage(data: Record<string, string>): Message {
  return {
    id: data.id,
    fromId: data.from_id,
    toId: data.to_id,
    message: data.message ?? "",
    attachmentUrl: data.attachment_url ?? "",
    attachmentName: data.attachment_name ?? "",
    attachmentType: data.attachment_type ?? "",
    createdAt: data.created_at,
    readAt: data.read_at ?? "",
    taskId: data.task_id ?? "",
  };
}

function ensureTab(): Promise<void> {
  return ensureTable(TAB, HEADERS);
}

async function readMessages(): Promise<{ headers: string[]; rows: { rowNumber: number; data: Record<string, string> }[] }> {
  try {
    await ensureTab();
    return await readTable(TAB);
  } catch {
    return { headers: HEADERS, rows: [] };
  }
}

export async function listMessagesBetween(staffIdA: string, staffIdB: string): Promise<Message[]> {
  const { rows } = await readMessages();
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

export async function listConversations(myStaffId: string): Promise<{ partnerId: string; last: Message; unread: number }[]> {
  const { rows } = await readMessages();
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
  const { rows } = await readMessages();
  return rows.filter((r) => r.data.to_id === myStaffId && !r.data.read_at).length;
}

export async function sendMessage(
  fromId: string,
  toId: string,
  message: string,
  attachment?: { url: string; name: string; type: string },
  taskId?: string
): Promise<Message> {
  await ensureTab();
  const msg: Message = {
    id: newId("msg"),
    fromId,
    toId,
    message,
    attachmentUrl: attachment?.url ?? "",
    attachmentName: attachment?.name ?? "",
    attachmentType: attachment?.type ?? "",
    createdAt: new Date().toISOString(),
    readAt: "",
    taskId: taskId ?? "",
  };
  await appendRow(TAB, {
    id: msg.id,
    from_id: msg.fromId,
    to_id: msg.toId,
    message: msg.message,
    attachment_url: msg.attachmentUrl,
    attachment_name: msg.attachmentName,
    attachment_type: msg.attachmentType,
    created_at: msg.createdAt,
    read_at: "",
    task_id: msg.taskId,
  });
  return msg;
}

export async function markConversationRead(myStaffId: string, partnerStaffId: string): Promise<void> {
  const { headers, rows } = await readMessages();
  const unread = rows.filter(
    (r) => r.data.from_id === partnerStaffId && r.data.to_id === myStaffId && !r.data.read_at
  );
  const readAtIdx = headers.indexOf("read_at");
  if (unread.length === 0 || readAtIdx < 0) return;

  const sheets = getSheetsClient();
  const col = columnLetter(readAtIdx + 1);
  const now = new Date().toISOString();
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: env.spreadsheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: unread.map((r) => ({ range: `${TAB}!${col}${r.rowNumber}`, values: [[now]] })),
    },
  });
  invalidateTable(TAB);
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
