export const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  office_staff: "Office",
  site_staff: "Site staff",
};

export function displayName(name: string, role: string) {
  return role === "owner" ? "Millennium Group" : name;
}

/** Who gave a task, as shown on task rows. The owner account reads as "Owner". */
export function assignerName(staff: { name: string; role: string } | undefined): string {
  if (!staff) return "Office";
  return staff.role === "owner" ? "Owner" : staff.name;
}
