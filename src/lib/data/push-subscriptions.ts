import { appendRow, readTable, deleteRowById } from "@/lib/google/sheet-table";
import { newId } from "@/lib/ids";

const TAB = "PushSubscriptions";

export interface PushSubscriptionRecord {
  id: string;
  staffId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
}

function toRecord(data: Record<string, string>): PushSubscriptionRecord {
  return {
    id: data.id,
    staffId: data.staff_id,
    endpoint: data.endpoint,
    p256dh: data.p256dh,
    auth: data.auth,
    createdAt: data.created_at,
  };
}

export async function listAllPushSubscriptions(): Promise<PushSubscriptionRecord[]> {
  const { rows } = await readTable(TAB);
  return rows.map((r) => toRecord(r.data));
}

export async function listPushSubscriptionsForStaff(staffId: string): Promise<PushSubscriptionRecord[]> {
  const all = await listAllPushSubscriptions();
  return all.filter((s) => s.staffId === staffId);
}

export async function savePushSubscription(input: {
  staffId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<void> {
  const existing = await listAllPushSubscriptions();
  const dupe = existing.find((s) => s.endpoint === input.endpoint);
  if (dupe) return;

  await appendRow(TAB, {
    id: newId("push"),
    staff_id: input.staffId,
    endpoint: input.endpoint,
    p256dh: input.p256dh,
    auth: input.auth,
    created_at: new Date().toISOString(),
  });
}

export async function removePushSubscriptionByEndpoint(endpoint: string): Promise<void> {
  const existing = await listAllPushSubscriptions();
  const match = existing.find((s) => s.endpoint === endpoint);
  if (match) await deleteRowById(TAB, match.id);
}
