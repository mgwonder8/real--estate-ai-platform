"use server";

import { auth } from "@/auth";
import { sendMessage, markConversationRead } from "@/lib/data/messages";
import { getStaff } from "@/lib/data/staff";
import { notifyManyStaff } from "@/lib/push/send";
import { revalidatePath } from "next/cache";

export async function sendMessageAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const toStaffId = String(formData.get("toStaffId") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  if (!toStaffId || !message) return;

  await sendMessage(session.user.id, toStaffId, message);

  const sender = await getStaff(session.user.id);
  await notifyManyStaff([toStaffId], {
    title: `Message from ${sender?.name ?? "Someone"}`,
    body: message.length > 80 ? message.slice(0, 80) + "…" : message,
    url: `/chat/${session.user.id}`,
  });

  revalidatePath("/chat");
}

export async function markReadAction(partnerStaffId: string) {
  const session = await auth();
  if (!session?.user) return;
  await markConversationRead(session.user.id, partnerStaffId);
  revalidatePath("/chat");
}
