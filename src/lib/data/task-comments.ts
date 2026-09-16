import { appendRow, readTable } from "@/lib/google/sheet-table";
import { newId } from "@/lib/ids";
import type { Role, TaskComment } from "@/lib/data/types";

const TAB = "TaskComments";

function toComment(data: Record<string, string>): TaskComment {
  return {
    id: data.id,
    taskId: data.task_id,
    authorId: data.author_id,
    authorRole: (data.author_role as Role) || "site_staff",
    message: data.message,
    createdAt: data.created_at,
  };
}

export async function listAllTaskComments(): Promise<TaskComment[]> {
  const { rows } = await readTable(TAB);
  return rows.map((r) => toComment(r.data)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function listCommentsForTask(taskId: string): Promise<TaskComment[]> {
  const all = await listAllTaskComments();
  return all.filter((c) => c.taskId === taskId);
}

export async function addTaskComment(input: {
  taskId: string;
  authorId: string;
  authorRole: Role;
  message: string;
}): Promise<TaskComment> {
  const comment: TaskComment = {
    id: newId("cmt"),
    taskId: input.taskId,
    authorId: input.authorId,
    authorRole: input.authorRole,
    message: input.message,
    createdAt: new Date().toISOString(),
  };
  await appendRow(TAB, {
    id: comment.id,
    task_id: comment.taskId,
    author_id: comment.authorId,
    author_role: comment.authorRole,
    message: comment.message,
    created_at: comment.createdAt,
  });
  return comment;
}
