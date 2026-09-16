"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createTask, updateTaskStatus } from "@/lib/data/tasks";
import type { TaskPriority, TaskStatus } from "@/lib/data/types";

export async function createTaskAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  await createTask({
    title: String(formData.get("title") ?? ""),
    brief: String(formData.get("brief") ?? ""),
    siteId: String(formData.get("siteId") ?? ""),
    assigneeId: String(formData.get("assigneeId") ?? ""),
    createdBy: session.user.id,
    priority: (String(formData.get("priority") ?? "normal") as TaskPriority),
    deadline: String(formData.get("deadline") ?? ""),
    proofRequired: formData.get("proofRequired") === "on",
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/site");
}

export async function updateTaskStatusAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  await updateTaskStatus({
    taskId: String(formData.get("taskId") ?? ""),
    toStatus: String(formData.get("toStatus") ?? "") as TaskStatus,
    changedBy: session.user.id,
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/site");
}
