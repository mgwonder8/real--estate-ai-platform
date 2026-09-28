export const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  office_staff: "Office",
  site_staff: "Site staff",
};

export function displayName(name: string, role: string) {
  return role === "owner" ? "Millennium Group" : name;
}
