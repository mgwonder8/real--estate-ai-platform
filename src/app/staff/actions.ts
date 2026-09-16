"use server";

import { revalidatePath } from "next/cache";
import { randomInt } from "crypto";
import { createStaff, setStaffActive } from "@/lib/data/staff";
import { createUser } from "@/lib/data/users";
import type { Role } from "@/lib/data/types";

export type CreateStaffState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; name: string; email: string; tempPassword: string };

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
  const phone = String(formData.get("phone") ?? "");

  if (!name || !email) {
    return { status: "error", message: "Name and email are required." };
  }

  const staff = await createStaff({ name, role, siteId, phone, email });
  const tempPassword = generateTempPassword();
  await createUser({ email, password: tempPassword, staffId: staff.id });

  revalidatePath("/staff");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");

  return { status: "success", name, email, tempPassword };
}

export async function toggleStaffActiveAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  await setStaffActive(id, active);
  revalidatePath("/staff");
}
