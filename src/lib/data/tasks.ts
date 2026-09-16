import { appendRow, readTable, updateRow, findRowById } from "@/lib/google/sheet-table";
import { newId } from "@/lib/ids";
import { addTaskUpdate } from "@/lib/data/task-updates";
import type { Task, TaskPriority, TaskStatus } from "@/lib/data/types";

const TAB = "Tasks";

function toTask(data: Record<string, string>): Task {
  return {
    id: data.id,
    title: data.title,
    brief: data.brief,
    siteId: data.site_id,
    assigneeId: data.assignee_id,
    createdBy: data.created_by,
    priority: (data.priority as TaskPriority) || "normal",
    deadline: data.deadline,
    status: (data.status as TaskStatus) || "pending",
    proofRequired: data.proof_required === "TRUE" || data.proof_required === "true",
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function listTasks(): Promise<Task[]> {
  const { rows } = await readTable(TAB);
  return rows.map((r) => toTask(r.data)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getTask(id: string): Promise<Task | null> {
  const row = await findRowById(TAB, id);
  return row ? toTask(row.data) : null;
}

export async function listTasksForAssignee(assigneeId: string): Promise<Task[]> {
  const all = await listTasks();
  return all.filter((t) => t.assigneeId === assigneeId);
}

export async function listTasksForSite(siteId: string): Promise<Task[]> {
  const all = await listTasks();
  return all.filter((t) => t.siteId === siteId);
}

export async function createTask(input: {
  title: string;
  brief: string;
  siteId: string;
  assigneeId: string;
  createdBy: string;
  priority: TaskPriority;
  deadline: string;
  proofRequired: boolean;
}): Promise<Task> {
  const now = new Date().toISOString();
  const task: Task = {
    id: newId("task"),
    title: input.title,
    brief: input.brief,
    siteId: input.siteId,
    assigneeId: input.assigneeId,
    createdBy: input.createdBy,
    priority: input.priority,
    deadline: input.deadline,
    status: "pending",
    proofRequired: input.proofRequired,
    createdAt: now,
    updatedAt: now,
  };
  await appendRow(TAB, {
    id: task.id,
    title: task.title,
    brief: task.brief,
    site_id: task.siteId,
    assignee_id: task.assigneeId,
    created_by: task.createdBy,
    priority: task.priority,
    deadline: task.deadline,
    status: task.status,
    proof_required: task.proofRequired ? "TRUE" : "FALSE",
    created_at: task.createdAt,
    updated_at: task.updatedAt,
  });
  return task;
}

export async function updateTaskStatus(input: {
  taskId: string;
  toStatus: TaskStatus;
  changedBy: string;
  note?: string;
}): Promise<void> {
  const row = await findRowById(TAB, input.taskId);
  if (!row) throw new Error(`Task not found: ${input.taskId}`);
  const fromStatus = row.data.status || "pending";
  const updatedAt = new Date().toISOString();
  await updateRow(TAB, row.rowNumber, { ...row.data, status: input.toStatus, updated_at: updatedAt });
  await addTaskUpdate({
    taskId: input.taskId,
    fromStatus,
    toStatus: input.toStatus,
    changedBy: input.changedBy,
    note: input.note ?? "",
  });
}
