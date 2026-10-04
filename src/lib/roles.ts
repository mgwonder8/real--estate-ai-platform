import type { T } from "@/lib/i18n/translate";

export function roleLabel(role: string, t: T): string {
  if (role === "owner") return t("role.owner");
  if (role === "office_staff") return t("role.office");
  return t("role.siteStaff");
}

export function displayName(name: string, role: string) {
  return role === "owner" ? "Millennium Group" : name;
}

/** Who gave a task, as shown on task rows. The owner account reads as "Owner". */
export function assignerName(staff: { name: string; role: string } | undefined, t: T): string {
  if (!staff) return t("tasks.assigner.office");
  return staff.role === "owner" ? t("tasks.assigner.owner") : staff.name;
}
