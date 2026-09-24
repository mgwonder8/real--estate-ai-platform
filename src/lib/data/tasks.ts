import { appendRow, readTable, updateRow, findRowById } from "@/lib/google/sheet-table";
import { newId } from "@/lib/ids";
import { addTaskUpdate } from "@/lib/data/task-updates";
import { addTaskComment } from "@/lib/data/task-comments";
import type { Role, Task, TaskPriority, TaskStatus } from "@/lib/data/types";

const TAB = "Tasks";

function toTask(data: Record<string, string>): Task {
  return {
    id: data.id,
    title: data.title,
    brief: data.brief,
    siteId: data.site_id,
    assigneeIds: (data.assignee_id ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    createdBy: data.created_by,
    priority: (data.priority as TaskPriority) || "normal",
    deadline: data.deadline,
    status: (data.status as TaskStatus) || "pending",
    proofRequired: data.proof_required === "TRUE" || data.proof_required === "true",
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    resourceLink: data.resource_link ?? "",
    resourceFileUrl: data.resource_file_url ?? "",
    resourceFileName: data.resource_file_name ?? "",
    approvedBy: data.approved_by ?? "",
    approvedAt: data.approved_at ?? "",
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
  return all.filter((t) => t.assigneeIds.includes(assigneeId));
}

export async function listTasksForSite(siteId: string): Promise<Task[]> {
  const all = await listTasks();
  return all.filter((t) => t.siteId === siteId);
}

export async function createTask(input: {
  title: string;
  brief: string;
  siteId: string;
  assigneeIds: string[];
  createdBy: string;
  priority: TaskPriority;
  deadline: string;
  proofRequired: boolean;
  resourceLink?: string;
  resourceFileUrl?: string;
  resourceFileName?: string;
}): Promise<Task> {
  const now = new Date().toISOString();
  const task: Task = {
    id: newId("task"),
    title: input.title,
    brief: input.brief,
    siteId: input.siteId,
    assigneeIds: input.assigneeIds.filter(Boolean),
    createdBy: input.createdBy,
    priority: input.priority,
    deadline: input.deadline,
    status: "pending",
    proofRequired: input.proofRequired,
    createdAt: now,
    updatedAt: now,
    resourceLink: input.resourceLink ?? "",
    resourceFileUrl: input.resourceFileUrl ?? "",
    resourceFileName: input.resourceFileName ?? "",
    approvedBy: "",
    approvedAt: "",
  };
  await appendRow(TAB, {
    id: task.id,
    title: task.title,
    brief: task.brief,
    site_id: task.siteId,
    assignee_id: task.assigneeIds.join(","),
    created_by: task.createdBy,
    priority: task.priority,
    deadline: task.deadline,
    status: task.status,
    proof_required: task.proofRequired ? "TRUE" : "FALSE",
    created_at: task.createdAt,
    updated_at: task.updatedAt,
    resource_link: task.resourceLink,
    resource_file_url: task.resourceFileUrl,
    resource_file_name: task.resourceFileName,
    approved_by: "",
    approved_at: "",
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

/** Owner/office approves a completed task, marking it final. */
export async function approveTask(input: {
  taskId: string;
  approvedBy: string;
  approverRole: Role;
  comment?: string;
}): Promise<void> {
  const row = await findRowById(TAB, input.taskId);
  if (!row) throw new Error(`Task not found: ${input.taskId}`);
  const now = new Date().toISOString();
  await updateRow(TAB, row.rowNumber, {
    ...row.data,
    status: "approved",
    updated_at: now,
    approved_by: input.approvedBy,
    approved_at: now,
  });
  await addTaskUpdate({
    taskId: input.taskId,
    fromStatus: row.data.status || "completed",
    toStatus: "approved",
    changedBy: input.approvedBy,
    note: input.comment ?? "",
  });
  if (input.comment) {
    await addTaskComment({
      taskId: input.taskId,
      authorId: input.approvedBy,
      authorRole: input.approverRole,
      message: input.comment,
    });
  }
}

/** Owner/office sends completed work back for rework, with required feedback. */
export async function requestTaskChanges(input: {
  taskId: string;
  requestedBy: string;
  requesterRole: Role;
  comment: string;
}): Promise<void> {
  const row = await findRowById(TAB, input.taskId);
  if (!row) throw new Error(`Task not found: ${input.taskId}`);
  const now = new Date().toISOString();
  await updateRow(TAB, row.rowNumber, { ...row.data, status: "in_progress", updated_at: now });
  await addTaskUpdate({
    taskId: input.taskId,
    fromStatus: row.data.status || "completed",
    toStatus: "in_progress",
    changedBy: input.requestedBy,
    note: input.comment,
  });
  await addTaskComment({
    taskId: input.taskId,
    authorId: input.requestedBy,
    authorRole: input.requesterRole,
    message: input.comment,
  });
}
