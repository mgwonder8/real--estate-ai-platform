"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getTask, updateTaskStatus } from "@/lib/data/tasks";
import { addProof } from "@/lib/data/proofs";
import { raiseQuery } from "@/lib/data/queries";
import { addTaskComment } from "@/lib/data/task-comments";
import { saveProofFile } from "@/lib/storage/upload";
import { listOfficeAndOwnerStaffIds } from "@/lib/data/staff";
import { notifyManyStaff } from "@/lib/push/send";
import { isOpen } from "@/lib/task-meta";
import { after } from "next/server";
import { getT } from "@/lib/i18n/server";
import type { Role } from "@/lib/data/types";

async function requireOwnTask(taskId: string) {
  const t = await getT();
  const session = await auth();
  if (!session?.user) throw new Error(t("common.notAuthenticated"));
  const task = await getTask(taskId);
  if (!task || !task.assigneeIds.includes(session.user.id)) {
    throw new Error(t("ss.notYours"));
  }
  return { session, task };
}

export type SubmitProofState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

export async function submitProofAction(
  _prev: SubmitProofState,
  formData: FormData
): Promise<SubmitProofState> {
  const taskId = String(formData.get("taskId") ?? "");
  const t = await getT();

  try {
    const { session, task } = await requireOwnTask(taskId);

    const photo = formData.get("photo") as File | null;
    let photoUrl = "";
    if (photo && photo.size > 0) {
      const buffer = Buffer.from(await photo.arrayBuffer());
      const uploaded = await saveProofFile({
        name: `${taskId}-${photo.name}`,
        buffer,
      });
      photoUrl = uploaded.url;
    }

    const noPhoto = formData.get("noPhoto") === "1";
    if (!photoUrl && !(noPhoto && !task.proofRequired)) throw new Error(t("pf.photoFirst"));

    const notes = String(formData.get("notes") ?? "").trim();
    if (photoUrl || notes) {
      await addProof({
        taskId,
        submittedBy: session.user.id,
        photoUrl,
        notes,
        gpsLat: String(formData.get("gpsLat") ?? ""),
        gpsLng: String(formData.get("gpsLng") ?? ""),
      });
    }

    // Sending proof is how staff finish a task: it goes straight to the office for approval.
    if (isOpen(task)) {
      await updateTaskStatus({ taskId, toStatus: "completed", changedBy: session.user.id });
      after(async () => {
        const recipients = await listOfficeAndOwnerStaffIds();
        await notifyManyStaff(recipients, { title: "Task done, awaiting approval", body: task.title, url: `/tasks/${taskId}` });
      });
    }

    revalidatePath("/site", "layout");
    revalidatePath("/tasks", "layout");
    revalidatePath("/sites", "layout");
    return { status: "success" };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : t("pf.failed") };
  }
}

export async function addOwnTaskCommentAction(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return;
  const { session } = await requireOwnTask(taskId);

  await addTaskComment({
    taskId,
    authorId: session.user.id,
    authorRole: session.user.role as Role,
    message,
  });

  revalidatePath("/site");
  revalidatePath("/tasks", "layout");
  revalidatePath("/sites", "layout");

  const recipients = await listOfficeAndOwnerStaffIds();
  await notifyManyStaff(recipients, { title: "New comment", body: message, url: `/tasks/${taskId}` });
}

export async function raiseQueryAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error((await getT())("common.notAuthenticated"));

  const message = String(formData.get("message") ?? "").trim();
  if (!message) return;

  await raiseQuery({
    raisedBy: session.user.id,
    siteId: session.user.siteId || undefined,
    taskId: String(formData.get("taskId") ?? "") || undefined,
    message,
    gpsLat: String(formData.get("gpsLat") ?? ""),
    gpsLng: String(formData.get("gpsLng") ?? ""),
  });

  revalidatePath("/site");
  revalidatePath("/queries");

  const recipients = await listOfficeAndOwnerStaffIds();
  await notifyManyStaff(recipients, { title: "New query raised", body: message, url: "/queries" });
}
