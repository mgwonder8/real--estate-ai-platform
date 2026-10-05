import type { T } from "@/lib/i18n/translate";

export function roleLabel(role: string, t: T): string {
  if (role === "owner") return t("role.owner");
  if (role === "office_staff") return t("role.office");
  return t("role.siteStaff");
}

/** The signed-in person's name as shown in the menu; falls back to the company for an unnamed owner account. */
export function displayName(name: string, role: string) {
  return name?.trim() || (role === "owner" ? "Millennium Group" : "");
}

/** Who gave a task, shown by their own name so it is clear which owner or office person it was. */
export function assignerName(staff: { name: string; role: string } | undefined, t: T): string {
  return staff?.name || t("tasks.assigner.office");
}
