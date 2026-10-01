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
  "channel",
];

/** "personal" threads are private between two people and kept apart from team chat. */
export type Channel = "team" | "personal";

export function parseChannel(value: unknown): Channel {
  return value === "personal" ? "personal" : "team";
}

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
  channel: Channel;
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
    channel: parseChannel(data.channel),
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

export async function listMessagesBetween(staffIdA: string, staffIdB: string, channel: Channel = "team"): Promise<Message[]> {
  const { rows } = await readMessages();
  return rows
    .map((r) => toMessage(r.data))
    .filter(
      (m) =>
        m.channel === channel &&
        ((m.fromId === staffIdA && m.toId === staffIdB) || (m.fromId === staffIdB && m.toId === staffIdA))
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function listMessagesAfter(staffIdA: string, staffIdB: string, after: string, channel: Channel = "team"): Promise<Message[]> {
  const all = await listMessagesBetween(staffIdA, staffIdB, channel);
  return all.filter((m) => m.createdAt > after);
}

export async function listConversations(
  myStaffId: string,
  channel: Channel = "team"
): Promise<{ partnerId: string; last: Message; unread: number }[]> {
  const { rows } = await readMessages();
  const all = rows
    .map((r) => toMessage(r.data))
    .filter((m) => m.channel === channel && (m.fromId === myStaffId || m.toId === myStaffId));
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

export async function countUnread(myStaffId: string): Promise<Record<Channel, number>> {
  const { rows } = await readMessages();
  const counts: Record<Channel, number> = { team: 0, personal: 0 };
  for (const r of rows) {
    if (r.data.to_id === myStaffId && !r.data.read_at) counts[parseChannel(r.data.channel)] += 1;
  }
  return counts;
}

export async function sendMessage(
  fromId: string,
  toId: string,
  message: string,
  attachment?: { url: string; name: string; type: string },
  taskId?: string,
  channel: Channel = "team"
): Promise<Message> {
  await ensureTab();
  if (channel === "personal") {
    const { headers } = await readTable(TAB);
    // Without the column a private message would be stored as a team message.
    if (!headers.includes("channel")) throw new Error("Private chat is not ready yet, please try again");
  }
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
    channel,
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
    channel: msg.channel === "personal" ? "personal" : "",
  });
  return msg;
}

export async function markConversationRead(myStaffId: string, partnerStaffId: string, channel: Channel = "team"): Promise<void> {
  const { headers, rows } = await readMessages();
  const unread = rows.filter(
    (r) =>
      r.data.from_id === partnerStaffId &&
      r.data.to_id === myStaffId &&
      !r.data.read_at &&
      parseChannel(r.data.channel) === channel
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
