"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { replyToQuery } from "@/lib/data/queries";

export async function replyToQueryAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const reply = String(formData.get("reply") ?? "").trim();
  if (!reply) return;

  await replyToQuery({
    queryId: String(formData.get("queryId") ?? ""),
    reply,
    repliedBy: session.user.id,
  });

  revalidatePath("/queries");
  revalidatePath("/site");
}
