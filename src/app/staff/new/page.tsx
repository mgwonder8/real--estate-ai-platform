import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { listSites } from "@/lib/data/sites";
import { AddStaffForm } from "@/app/staff/add-staff-form";

export default async function NewStaffPage() {
  const session = await auth();
  const sites = await listSites();
  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Add person" back="/staff" />
        <Card className="p-5 sm:p-6">
          <AddStaffForm sites={sites} />
        </Card>
      </div>
    </AppShell>
  );
}
