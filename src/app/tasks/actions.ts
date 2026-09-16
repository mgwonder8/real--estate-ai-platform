"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createTask, updateTaskStatus, approveTask, requestTaskChanges } from "@/lib/data/tasks";
import { addTaskComment } from "@/lib/data/task-comments";
import { saveProofFile } from "@/lib/storage/upload";
import type { TaskPriority, TaskStatus } from "@/lib/data/types";

function revalidateTaskPaths() {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/site");
  revalidatePath("/insights");
}

export async function createTaskAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  let resourceFileUrl = "";
  let resourceFileName = "";
  const file = formData.get("resourceFile") as File | null;
  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await saveProofFile({ name: file.name, buffer });
    resourceFileUrl = uploaded.url;
    resourceFileName = file.name;
  }

  await createTask({
    title: String(formData.get("title") ?? ""),
    brief: String(formData.get("brief") ?? ""),
    siteId: String(formData.get("siteId") ?? ""),
    assigneeId: String(formData.get("assigneeId") ?? ""),
    createdBy: session.user.id,
    priority: (String(formData.get("priority") ?? "normal") as TaskPriority),
    deadline: String(formData.get("deadline") ?? ""),
    proofRequired: formData.get("proofRequired") === "on",
    resourceLink: String(formData.get("resourceLink") ?? ""),
    resourceFileUrl,
    resourceFileName,
  });

  revalidateTaskPaths();
}

export async function updateTaskStatusAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  await updateTaskStatus({
    taskId: String(formData.get("taskId") ?? ""),
    toStatus: String(formData.get("toStatus") ?? "") as TaskStatus,
    changedBy: session.user.id,
  });

  revalidateTaskPaths();
}

export async function approveTaskAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  await approveTask({
    taskId: String(formData.get("taskId") ?? ""),
    approvedBy: session.user.id,
    approverRole: session.user.role as "owner" | "office_staff" | "site_staff",
    comment: String(formData.get("comment") ?? "") || undefined,
  });

  revalidateTaskPaths();
}

export async function requestTaskChangesAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const comment = String(formData.get("comment") ?? "").trim();
  if (!comment) throw new Error("A comment is required when requesting changes");

  await requestTaskChanges({
    taskId: String(formData.get("taskId") ?? ""),
    requestedBy: session.user.id,
    requesterRole: session.user.role as "owner" | "office_staff" | "site_staff",
    comment,
  });

  revalidateTaskPaths();
}

export async function addTaskCommentAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const message = String(formData.get("message") ?? "").trim();
  if (!message) return;

  await addTaskComment({
    taskId: String(formData.get("taskId") ?? ""),
    authorId: session.user.id,
    authorRole: session.user.role as "owner" | "office_staff" | "site_staff",
    message,
  });

  revalidateTaskPaths();
}
