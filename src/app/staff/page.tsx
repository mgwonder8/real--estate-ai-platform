import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { listStaff } from "@/lib/data/staff";
import { listSites } from "@/lib/data/sites";
import { NewStaffModal } from "@/app/staff/new-staff-modal";
import { StaffTable } from "@/app/staff/staff-table";

export default async function StaffPage() {
  const session = await auth();
  const [staff, sites] = await Promise.all([listStaff(), listSites()]);

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Staff</h1>
          <p className="text-sm text-slate-500">Office and site staff, and their login access.</p>
        </div>
        <NewStaffModal sites={sites} />
      </div>

      <Card>
        <StaffTable staff={staff} sites={sites} />
      </Card>
    </AppShell>
  );
}
