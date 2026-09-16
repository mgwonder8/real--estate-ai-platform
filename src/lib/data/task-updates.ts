import { appendRow, readTable } from "@/lib/google/sheet-table";
import { newId } from "@/lib/ids";
import type { TaskUpdate } from "@/lib/data/types";

const TAB = "TaskUpdates";

function toTaskUpdate(data: Record<string, string>): TaskUpdate {
  return {
    id: data.id,
    taskId: data.task_id,
    fromStatus: data.from_status,
    toStatus: data.to_status,
    changedBy: data.changed_by,
    note: data.note,
    changedAt: data.changed_at,
  };
}

export async function listAllTaskUpdates(): Promise<TaskUpdate[]> {
  const { rows } = await readTable(TAB);
  return rows.map((r) => toTaskUpdate(r.data)).sort((a, b) => a.changedAt.localeCompare(b.changedAt));
}

export async function listTaskUpdatesForTask(taskId: string): Promise<TaskUpdate[]> {
  const all = await listAllTaskUpdates();
  return all.filter((u) => u.taskId === taskId);
}

export async function addTaskUpdate(input: {
  taskId: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  note?: string;
}): Promise<void> {
  await appendRow(TAB, {
    id: newId("upd"),
    task_id: input.taskId,
    from_status: input.fromStatus,
    to_status: input.toStatus,
    changed_by: input.changedBy,
    note: input.note ?? "",
    changed_at: new Date().toISOString(),
  });
}
