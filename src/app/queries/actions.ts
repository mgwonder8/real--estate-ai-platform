"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { replyToQuery, listAllQueries } from "@/lib/data/queries";
import { notifyStaff } from "@/lib/push/send";

export async function replyToQueryAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const reply = String(formData.get("reply") ?? "").trim();
  if (!reply) return;

  const queryId = String(formData.get("queryId") ?? "");
  const existing = (await listAllQueries()).find((q) => q.id === queryId);

  await replyToQuery({
    queryId,
    reply,
    repliedBy: session.user.id,
  });

  revalidatePath("/queries");
  revalidatePath("/site");

  if (existing) {
    await notifyStaff(existing.raisedBy, {
      title: "Your query was answered",
      body: reply,
      url: "/site",
    });
  }
}
