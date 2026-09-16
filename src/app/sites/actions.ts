"use server";

import { revalidatePath } from "next/cache";
import { createSite } from "@/lib/data/sites";

export async function createSiteAction(formData: FormData) {
  await createSite({
    name: String(formData.get("name") ?? ""),
    address: String(formData.get("address") ?? ""),
  });
  revalidatePath("/sites");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}
