import { appendRow, ensureTable, readTable } from "@/lib/google/sheet-table";
import { newId } from "@/lib/ids";

const TAB = "TaskReferences";
const HEADERS = ["id", "task_id", "uploaded_by", "url", "name", "type", "source", "created_at"];

export interface TaskReference {
  id: string;
  taskId: string;
  uploadedBy: string;
  url: string;
  name: string;
  type: string;
  source: string;
  createdAt: string;
}

function toReference(data: Record<string, string>): TaskReference {
  return {
    id: data.id,
    taskId: data.task_id,
    uploadedBy: data.uploaded_by,
    url: data.url,
    name: data.name ?? "",
    type: data.type ?? "",
    source: data.source ?? "",
    createdAt: data.created_at,
  };
}

export async function listAllTaskReferences(): Promise<TaskReference[]> {
  try {
    await ensureTable(TAB, HEADERS);
    const { rows } = await readTable(TAB);
    return rows.map((r) => toReference(r.data)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } catch {
    return [];
  }
}

export async function listReferencesForTask(taskId: string): Promise<TaskReference[]> {
  const all = await listAllTaskReferences();
  return all.filter((r) => r.taskId === taskId);
}

export async function addTaskReference(input: {
  taskId: string;
  uploadedBy: string;
  url: string;
  name: string;
  type: string;
  source: "chat" | "task";
}): Promise<TaskReference> {
  await ensureTable(TAB, HEADERS);
  const ref: TaskReference = { id: newId("ref"), ...input, createdAt: new Date().toISOString() };
  await appendRow(TAB, {
    id: ref.id,
    task_id: ref.taskId,
    uploaded_by: ref.uploadedBy,
    url: ref.url,
    name: ref.name,
    type: ref.type,
    source: ref.source,
    created_at: ref.createdAt,
  });
  return ref;
}
