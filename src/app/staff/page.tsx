import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listStaff } from "@/lib/data/staff";
import { listSites } from "@/lib/data/sites";
import { AddStaffForm } from "@/app/staff/add-staff-form";
import { toggleStaffActiveAction } from "@/app/staff/actions";

export default async function StaffPage() {
  const session = await auth();
  const [staff, sites] = await Promise.all([listStaff(), listSites()]);
  const siteById = Object.fromEntries(sites.map((s) => [s.id, s]));

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Staff</h1>
        <p className="text-sm text-slate-500">Office and site staff, and their login access.</p>
      </div>

      <Card className="mb-6">
        <CardHeader title="Add Staff" subtitle="Creates their login at the same time." />
        <AddStaffForm sites={sites} />
      </Card>

      <Card>
        <CardHeader title={`All Staff (${staff.length})`} />
        <div className="divide-y divide-slate-100">
          {staff.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-slate-500">No staff yet. Add one above.</p>
          )}
          {staff.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-medium text-slate-900">
                  {s.name} <span className="ml-1 text-xs font-normal text-slate-500">{s.role.replace("_", " ")}</span>
                </p>
                <p className="text-sm text-slate-500">
                  {s.email}
                  {s.siteId && siteById[s.siteId] && ` · ${siteById[s.siteId].name}`}
                </p>
              </div>
              <form action={toggleStaffActiveAction}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="active" value={(!s.active).toString()} />
                <Button variant={s.active ? "danger" : "secondary"} type="submit">
                  {s.active ? "Deactivate" : "Activate"}
                </Button>
              </form>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
