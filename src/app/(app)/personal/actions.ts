"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { auth } from "@/auth";
import { PersonalTaskError, createPersonalTask, deletePersonalTask, togglePersonalTask } from "@/lib/data/personal-tasks";
import { getT } from "@/lib/i18n/server";
import { getStaff } from "@/lib/data/staff";
import { notifyManyStaff } from "@/lib/push/send";
import { PRIORITY_OPTIONS } from "@/lib/task-meta";
import type { TaskPriority } from "@/lib/data/types";

async function me() {
  const session = await auth();
  if (!session?.user) throw new Error((await getT())("common.notAuthenticated"));
  return session.user.id;
}

async function explain(err: unknown): Promise<never> {
  if (err instanceof PersonalTaskError) {
    const t = await getT();
    throw new Error(err.code === "onlyCreator" ? t("pe.onlyCreator") : t("pe.notFound"));
  }
  throw err;
}

export async function addPersonalTaskAction(formData: FormData): Promise<void> {
  const t = await getT();
  const fromId = await me();
  const partnerId = String(formData.get("partnerId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const remark = String(formData.get("remark") ?? "").trim();
  const priorityRaw = String(formData.get("priority") ?? "normal") as TaskPriority;
  const priority = PRIORITY_OPTIONS.includes(priorityRaw) ? priorityRaw : "normal";
  const forId = formData.get("for") === "me" ? fromId : partnerId;

  if (!title) throw new Error(t("pe.needName"));
  if (!partnerId || partnerId === fromId) throw new Error(t("pe.needPartner"));
  const partner = await getStaff(partnerId);
  if (!partner) throw new Error(t("pe.personMissing"));

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
  await togglePersonalTask(id, await me()).catch(explain);
  revalidatePath("/personal", "layout");
}

export async function deletePersonalTaskAction(id: string): Promise<void> {
  await deletePersonalTask(id, await me()).catch(explain);
  revalidatePath("/personal", "layout");
}
