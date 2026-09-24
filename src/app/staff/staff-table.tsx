"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toggleStaffActiveAction } from "@/app/staff/actions";
import type { Site, Staff } from "@/lib/data/types";

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  office_staff: "Office Staff",
  site_staff: "Site Staff",
};

export function StaffTable({ staff, sites }: { staff: Staff[]; sites: Site[] }) {
  const siteById = Object.fromEntries(sites.map((s) => [s.id, s]));

  if (staff.length === 0) {
    return <p className="px-5 py-10 text-center text-sm text-slate-500">No staff yet. Add one above.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-400">
            <th className="px-5 py-3 font-medium">Name</th>
            <th className="px-3 py-3 font-medium">Role</th>
            <th className="hidden px-3 py-3 font-medium sm:table-cell">Site</th>
            <th className="hidden px-3 py-3 font-medium md:table-cell">Contact</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-3 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((s) => (
            <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={s.name} />
                  <span className="font-medium text-slate-800">{s.name}</span>
                </div>
              </td>
              <td className="px-3 py-3 text-slate-600">{ROLE_LABEL[s.role] ?? s.role}</td>
              <td className="hidden px-3 py-3 text-slate-600 sm:table-cell">{s.siteId && siteById[s.siteId] ? siteById[s.siteId].name : "—"}</td>
              <td className="hidden px-3 py-3 text-slate-600 md:table-cell">
                <div>{s.email}</div>
                {s.phone && <div className="text-xs text-slate-400">{s.phone}</div>}
              </td>
              <td className="px-3 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                    s.active
                      ? "bg-emerald-100 text-emerald-800 ring-emerald-300"
                      : "bg-slate-100 text-slate-600 ring-slate-300"
                  }`}
                >
                  {s.active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-3 py-3 text-right">
                <form action={toggleStaffActiveAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="active" value={(!s.active).toString()} />
                  <Button variant={s.active ? "danger" : "secondary"} type="submit" className="!px-2.5 !py-1 text-xs">
                    {s.active ? "Deactivate" : "Activate"}
                  </Button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
