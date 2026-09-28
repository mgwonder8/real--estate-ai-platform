"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createTask, updateTaskStatus, approveTask, requestTaskChanges, getTask } from "@/lib/data/tasks";
import { addTaskComment } from "@/lib/data/task-comments";
import { saveProofFile } from "@/lib/storage/upload";
import { listOfficeAndOwnerStaffIds } from "@/lib/data/staff";
import { notifyManyStaff } from "@/lib/push/send";
import type { TaskPriority, TaskStatus } from "@/lib/data/types";

function revalidateTaskPaths() {
  revalidatePath("/tasks", "layout");
  revalidatePath("/sites", "layout");
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

  const title = String(formData.get("title") ?? "");
  const assigneeIds = formData.getAll("assigneeIds").map(String).filter(Boolean);
  if (assigneeIds.length === 0) throw new Error("Select at least one staff member to assign this task to");

  await createTask({
    title,
    brief: String(formData.get("brief") ?? ""),
    siteId: String(formData.get("siteId") ?? ""),
    assigneeIds,
    createdBy: session.user.id,
    priority: (String(formData.get("priority") ?? "normal") as TaskPriority),
    deadline: String(formData.get("deadline") ?? ""),
    proofRequired: formData.get("proofRequired") === "on",
    resourceLink: String(formData.get("resourceLink") ?? ""),
    resourceFileUrl,
    resourceFileName,
  });

  revalidateTaskPaths();

  await notifyManyStaff(assigneeIds, {
    title: "New task assigned",
    body: title,
    url: "/site",
  });
}

export async function updateTaskStatusAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const taskId = String(formData.get("taskId") ?? "");
  const toStatus = String(formData.get("toStatus") ?? "") as TaskStatus;

  await updateTaskStatus({ taskId, toStatus, changedBy: session.user.id });

  revalidateTaskPaths();

  if (toStatus === "completed") {
    const task = await getTask(taskId);
    if (task) {
      const recipients = await listOfficeAndOwnerStaffIds();
      await notifyManyStaff(recipients, {
        title: "Task awaiting approval",
        body: task.title,
        url: `/tasks/${taskId}`,
      });
    }
  }
}

export async function approveTaskAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const taskId = String(formData.get("taskId") ?? "");

  await approveTask({
    taskId,
    approvedBy: session.user.id,
    approverRole: session.user.role as "owner" | "office_staff" | "site_staff",
    comment: String(formData.get("comment") ?? "") || undefined,
  });

  revalidateTaskPaths();

  const task = await getTask(taskId);
  if (task) {
    await notifyManyStaff(task.assigneeIds, {
      title: "Task approved",
      body: task.title,
      url: "/site",
    });
  }
}

export async function requestTaskChangesAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const comment = String(formData.get("comment") ?? "").trim();
  if (!comment) throw new Error("A comment is required when requesting changes");

  const taskId = String(formData.get("taskId") ?? "");

  await requestTaskChanges({
    taskId,
    requestedBy: session.user.id,
    requesterRole: session.user.role as "owner" | "office_staff" | "site_staff",
    comment,
  });

  revalidateTaskPaths();

  const task = await getTask(taskId);
  if (task) {
    await notifyManyStaff(task.assigneeIds, {
      title: "Changes requested on your task",
      body: task.title,
      url: "/site",
    });
  }
}

export async function addTaskCommentAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const message = String(formData.get("message") ?? "").trim();
  if (!message) return;

  const taskId = String(formData.get("taskId") ?? "");
  const authorRole = session.user.role as "owner" | "office_staff" | "site_staff";

  await addTaskComment({
    taskId,
    authorId: session.user.id,
    authorRole,
    message,
  });

  revalidateTaskPaths();

  const task = await getTask(taskId);
  if (task) {
    if (authorRole === "site_staff") {
      const recipients = await listOfficeAndOwnerStaffIds();
      await notifyManyStaff(recipients, { title: "New comment", body: message, url: `/tasks/${taskId}` });
    } else {
      await notifyManyStaff(task.assigneeIds, { title: "New comment on your task", body: message, url: "/site" });
    }
  }
}
