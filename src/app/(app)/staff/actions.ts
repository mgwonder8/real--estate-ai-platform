"use server";

import { revalidatePath } from "next/cache";
import { randomInt } from "crypto";
import { createStaff, updateStaff, setStaffActive } from "@/lib/data/staff";
import { createUser } from "@/lib/data/users";
import type { Role } from "@/lib/data/types";
import { getT } from "@/lib/i18n/server";

export type CreateStaffState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; name: string; email: string; tempPassword: string };

export type UpdateStaffState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

function generateTempPassword(): string {
  return String(randomInt(100000, 999999));
}

export async function createStaffAction(
  _prev: CreateStaffState,
  formData: FormData
): Promise<CreateStaffState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "site_staff") as Role;
  const siteId = String(formData.get("siteId") ?? "");
  const extraSiteIds = formData.getAll("extraSiteIds").map(String).filter(Boolean);
  const phone = String(formData.get("phone") ?? "");

  if (!name || !email) {
    return { status: "error", message: (await getT())("as.needNameEmail") };
  }

  const staff = await createStaff({ name, role, siteId, extraSiteIds, phone, email });
  const tempPassword = generateTempPassword();
  await createUser({ email, password: tempPassword, staffId: staff.id });

  revalidatePath("/staff");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");

  return { status: "success", name, email, tempPassword };
}

export async function updateStaffAction(
  _prev: UpdateStaffState,
  formData: FormData
): Promise<UpdateStaffState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "site_staff") as Role;
  const siteId = String(formData.get("siteId") ?? "");
  const extraSiteIds = formData.getAll("extraSiteIds").map(String).filter(Boolean);
  const assigned = [siteId, ...extraSiteIds].filter(Boolean);
  const teamViewHiddenSiteIds = formData
    .getAll("teamViewHiddenSiteIds")
    .map(String)
    .filter((sid) => assigned.includes(sid));
  const phone = String(formData.get("phone") ?? "");

  if (!id || !name) {
    return { status: "error", message: (await getT())("es.needName") };
  }

  await updateStaff(id, { name, role, siteId, extraSiteIds, teamViewHiddenSiteIds, phone });

  revalidatePath("/staff");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/site");
  revalidatePath(`/staff/${id}/edit`);

  return { status: "success" };
}

export async function toggleStaffActiveAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  await setStaffActive(id, active);
  revalidatePath("/staff");
}
