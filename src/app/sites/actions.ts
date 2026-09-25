"use server";

import { revalidatePath } from "next/cache";
import { createSite, updateSiteBrief } from "@/lib/data/sites";
import { saveProofFile } from "@/lib/storage/upload";

export async function createSiteAction(formData: FormData) {
  let briefFileUrl = "";
  let briefFileName = "";
  const file = formData.get("briefFile") as File | null;
  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await saveProofFile({ name: file.name, buffer });
    briefFileUrl = uploaded.url;
    briefFileName = file.name;
  }

  await createSite({
    name: String(formData.get("name") ?? ""),
    address: String(formData.get("address") ?? ""),
    briefText: String(formData.get("briefText") ?? ""),
    briefFileUrl,
    briefFileName,
  });
  revalidatePath("/sites", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/site");
}

export async function updateSiteBriefAction(formData: FormData) {
  const siteId = String(formData.get("siteId") ?? "");
  let briefFileUrl: string | undefined;
  let briefFileName: string | undefined;
  const file = formData.get("briefFile") as File | null;
  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await saveProofFile({ name: file.name, buffer });
    briefFileUrl = uploaded.url;
    briefFileName = file.name;
  }

  await updateSiteBrief(siteId, {
    briefText: String(formData.get("briefText") ?? ""),
    ...(briefFileUrl ? { briefFileUrl, briefFileName } : {}),
  });

  revalidatePath("/sites", "layout");
  revalidatePath("/site");
}
