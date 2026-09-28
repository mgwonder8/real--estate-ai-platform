import { appendRow, readTable, updateRow, findRowById } from "@/lib/google/sheet-table";
import { newId } from "@/lib/ids";

const TAB = "Messages";

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

export async function listMessagesBetween(staffIdA: string, staffIdB: string): Promise<Message[]> {
  const { rows } = await readTable(TAB);
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

/** Returns the most recent message per conversation partner, for the chat list. */
export async function listConversations(myStaffId: string): Promise<{ partnerId: string; last: Message; unread: number }[]> {
  const { rows } = await readTable(TAB);
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
  const { rows } = await readTable(TAB);
  return rows
    .map((r) => toMessage(r.data))
    .filter((m) => m.toId === myStaffId && !m.readAt).length;
}

export async function sendMessage(fromId: string, toId: string, message: string): Promise<Message> {
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
  const { rows } = await readTable(TAB);
  const unread = rows.filter(
    (r) => r.data.from_id === partnerStaffId && r.data.to_id === myStaffId && !r.data.read_at
  );
  const now = new Date().toISOString();
  await Promise.all(unread.map((r) => updateRow(TAB, r.rowNumber, { ...r.data, read_at: now })));
}
