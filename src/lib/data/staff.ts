import { appendRow, readTable, updateRow, findRowById } from "@/lib/google/sheet-table";
import { newId } from "@/lib/ids";
import type { Staff, Role } from "@/lib/data/types";

const TAB = "Staff";

function toStaff(data: Record<string, string>): Staff {
  const extraSiteIds = data.extra_site_ids
    ? data.extra_site_ids.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  return {
    id: data.id,
    name: data.name,
    role: (data.role as Role) || "site_staff",
    siteId: data.site_id,
    extraSiteIds,
    phone: data.phone,
    email: data.email,
    active: data.active === "TRUE" || data.active === "true",
    createdAt: data.created_at,
  };
}

export function allSiteIds(staff: Staff): string[] {
  return [staff.siteId, ...staff.extraSiteIds].filter(Boolean);
}

export async function listStaff(): Promise<Staff[]> {
  const { rows } = await readTable(TAB);
  return rows.map((r) => toStaff(r.data));
}

export async function getStaff(id: string): Promise<Staff | null> {
  const row = await findRowById(TAB, id);
  return row ? toStaff(row.data) : null;
}

export async function listStaffBySite(siteId: string): Promise<Staff[]> {
  const all = await listStaff();
  return all.filter((s) => allSiteIds(s).includes(siteId));
}

/** Owner + office staff, the recipients for site-staff-initiated notifications. */
export async function listOfficeAndOwnerStaffIds(): Promise<string[]> {
  const all = await listStaff();
  return all.filter((s) => s.active && (s.role === "owner" || s.role === "office_staff")).map((s) => s.id);
}

export async function createStaff(input: {
  name: string;
  role: Role;
  siteId?: string;
  extraSiteIds?: string[];
  phone?: string;
  email: string;
}): Promise<Staff> {
  const staff: Staff = {
    id: newId("staff"),
    name: input.name,
    role: input.role,
    siteId: input.siteId ?? "",
    extraSiteIds: input.extraSiteIds ?? [],
    phone: input.phone ?? "",
    email: input.email,
    active: true,
    createdAt: new Date().toISOString(),
  };
  await appendRow(TAB, {
    id: staff.id,
    name: staff.name,
    role: staff.role,
    site_id: staff.siteId,
    extra_site_ids: staff.extraSiteIds.join(","),
    phone: staff.phone,
    email: staff.email,
    active: "TRUE",
    created_at: staff.createdAt,
  });
  return staff;
}

export async function updateStaff(
  id: string,
  input: { name: string; role: Role; siteId: string; extraSiteIds: string[]; phone: string }
): Promise<void> {
  const row = await findRowById(TAB, id);
  if (!row) throw new Error(`Staff not found: ${id}`);
  await updateRow(TAB, row.rowNumber, {
    ...row.data,
    name: input.name,
    role: input.role,
    site_id: input.siteId,
    extra_site_ids: input.extraSiteIds.join(","),
    phone: input.phone,
  });
}

export async function setStaffActive(id: string, active: boolean): Promise<void> {
  const row = await findRowById(TAB, id);
  if (!row) throw new Error(`Staff not found: ${id}`);
  await updateRow(TAB, row.rowNumber, { ...row.data, active: active ? "TRUE" : "FALSE" });
}
