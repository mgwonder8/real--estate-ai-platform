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
import type { Role, TaskStatus } from "@/lib/data/types";

async function requireOwnTask(taskId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  const task = await getTask(taskId);
  if (!task || !task.assigneeIds.includes(session.user.id)) {
    throw new Error("Task not found or not assigned to you");
  }
  return { session, task };
}

export async function updateOwnTaskStatusAction(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "");
  const toStatus = String(formData.get("toStatus") ?? "") as TaskStatus;
  const { session, task } = await requireOwnTask(taskId);

  await updateTaskStatus({ taskId, toStatus, changedBy: session.user.id });

  revalidatePath("/site");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");

  if (toStatus === "completed") {
    const recipients = await listOfficeAndOwnerStaffIds();
    await notifyManyStaff(recipients, {
      title: "Task awaiting approval",
      body: task.title,
      url: "/tasks",
    });
  }
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

  try {
    const { session } = await requireOwnTask(taskId);

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

    await addProof({
      taskId,
      submittedBy: session.user.id,
      photoUrl,
      notes: String(formData.get("notes") ?? ""),
      gpsLat: String(formData.get("gpsLat") ?? ""),
      gpsLng: String(formData.get("gpsLng") ?? ""),
    });

    revalidatePath("/site");
    revalidatePath("/tasks");
    return { status: "success" };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Failed to submit proof" };
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
  revalidatePath("/tasks");

  const recipients = await listOfficeAndOwnerStaffIds();
  await notifyManyStaff(recipients, { title: "New comment", body: message, url: "/tasks" });
}

export async function raiseQueryAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

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
