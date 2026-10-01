"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { auth } from "@/auth";
import { createPersonalTask, deletePersonalTask, togglePersonalTask } from "@/lib/data/personal-tasks";
import { getStaff } from "@/lib/data/staff";
import { notifyManyStaff } from "@/lib/push/send";
import { PRIORITY_OPTIONS } from "@/lib/task-meta";
import type { TaskPriority } from "@/lib/data/types";

async function me() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  return session.user.id;
}

export async function addPersonalTaskAction(formData: FormData): Promise<void> {
  const fromId = await me();
  const partnerId = String(formData.get("partnerId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const remark = String(formData.get("remark") ?? "").trim();
  const priorityRaw = String(formData.get("priority") ?? "normal") as TaskPriority;
  const priority = PRIORITY_OPTIONS.includes(priorityRaw) ? priorityRaw : "normal";
  const forId = formData.get("for") === "me" ? fromId : partnerId;

  if (!title) throw new Error("Add a task name");
  if (!partnerId || partnerId === fromId) throw new Error("Pick who this is with");
  const partner = await getStaff(partnerId);
  if (!partner) throw new Error("Person not found");

  await createPersonalTask({ fromId, toId: partnerId, forId, title, remark, priority });
  revalidatePath("/personal", "layout");

  after(async () => {
    const sender = await getStaff(fromId);
    await notifyManyStaff([partnerId], {
      title: `Private task from ${sender?.name ?? "someone"}`,
      body: title,
      url: `/personal/${fromId}`,
    });
  });
}

export async function togglePersonalTaskAction(id: string): Promise<void> {
  await togglePersonalTask(id, await me());
  revalidatePath("/personal", "layout");
}

export async function deletePersonalTaskAction(id: string): Promise<void> {
  await deletePersonalTask(id, await me());
  revalidatePath("/personal", "layout");
}
