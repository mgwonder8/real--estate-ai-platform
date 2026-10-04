import { getTask } from "@/lib/data/tasks";
import { addProof } from "@/lib/data/proofs";
import { addTaskReference } from "@/lib/data/task-references";
import { isImageFile } from "@/lib/files";
import { getT } from "@/lib/i18n/server";

export type SavedToTask = { taskId: string; title: string; kind: "proof" | "reference" };

/**
 * Files a chat attachment onto a task. Site staff photos/videos become proof of work
 * (only on tasks assigned to them); everything else is stored as a reference file.
 */
export async function saveChatFileToTask(input: {
  taskId: string;
  senderId: string;
  senderRole: string;
  attachment: { url: string; name: string; type: string };
}): Promise<SavedToTask> {
  const t = await getT();
  const task = await getTask(input.taskId);
  if (!task) throw new Error(t("cw.taskGone"));

  const isStaff = input.senderRole === "site_staff";
  if (isStaff && !task.assigneeIds.includes(input.senderId)) {
    throw new Error(t("cw.notYourTask"));
  }

  const { url, name, type } = input.attachment;
  const isVideo = type.startsWith("video/");
  if (isStaff && (isImageFile(name, type) || isVideo)) {
    await addProof({
      taskId: task.id,
      submittedBy: input.senderId,
      photoUrl: isVideo ? "" : url,
      videoUrl: isVideo ? url : "",
      notes: "Sent in chat",
    });
    return { taskId: task.id, title: task.title, kind: "proof" };
  }

  await addTaskReference({ taskId: task.id, uploadedBy: input.senderId, url, name, type, source: "chat" });
  return { taskId: task.id, title: task.title, kind: "reference" };
}
