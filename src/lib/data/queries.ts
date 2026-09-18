import { appendRow, readTable, updateRow, findRowById } from "@/lib/google/sheet-table";
import { newId } from "@/lib/ids";
import type { Query, QueryStatus } from "@/lib/data/types";

const TAB = "Queries";

function toQuery(data: Record<string, string>): Query {
  return {
    id: data.id,
    raisedBy: data.raised_by,
    siteId: data.site_id,
    taskId: data.task_id,
    message: data.message,
    status: (data.status as QueryStatus) || "open",
    reply: data.reply ?? "",
    repliedBy: data.replied_by ?? "",
    createdAt: data.created_at,
    repliedAt: data.replied_at ?? "",
    gpsLat: data.gps_lat ?? "",
    gpsLng: data.gps_lng ?? "",
  };
}

export async function listAllQueries(): Promise<Query[]> {
  const { rows } = await readTable(TAB);
  return rows.map((r) => toQuery(r.data)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listQueriesRaisedBy(staffId: string): Promise<Query[]> {
  const all = await listAllQueries();
  return all.filter((q) => q.raisedBy === staffId);
}

export async function raiseQuery(input: {
  raisedBy: string;
  siteId?: string;
  taskId?: string;
  message: string;
  gpsLat?: string;
  gpsLng?: string;
}): Promise<Query> {
  const query: Query = {
    id: newId("qry"),
    raisedBy: input.raisedBy,
    siteId: input.siteId ?? "",
    taskId: input.taskId ?? "",
    message: input.message,
    status: "open",
    reply: "",
    repliedBy: "",
    createdAt: new Date().toISOString(),
    repliedAt: "",
    gpsLat: input.gpsLat ?? "",
    gpsLng: input.gpsLng ?? "",
  };
  await appendRow(TAB, {
    id: query.id,
    raised_by: query.raisedBy,
    site_id: query.siteId,
    task_id: query.taskId,
    message: query.message,
    status: query.status,
    reply: "",
    replied_by: "",
    created_at: query.createdAt,
    replied_at: "",
    gps_lat: query.gpsLat,
    gps_lng: query.gpsLng,
  });
  return query;
}

export async function replyToQuery(input: { queryId: string; reply: string; repliedBy: string }): Promise<void> {
  const row = await findRowById(TAB, input.queryId);
  if (!row) throw new Error(`Query not found: ${input.queryId}`);
  await updateRow(TAB, row.rowNumber, {
    ...row.data,
    status: "answered",
    reply: input.reply,
    replied_by: input.repliedBy,
    replied_at: new Date().toISOString(),
  });
}
