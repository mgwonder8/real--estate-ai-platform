import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { listSites } from "@/lib/data/sites";
import { listStaff } from "@/lib/data/staff";
import { NewSiteModal } from "@/app/sites/new-site-modal";
import { SiteTable } from "@/app/sites/site-table";

export default async function SitesPage() {
  const session = await auth();
  const [sites, staff] = await Promise.all([listSites(), listStaff()]);

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Sites</h1>
          <p className="text-sm text-slate-500">The portfolio of properties being managed.</p>
        </div>
        <NewSiteModal />
      </div>

      <Card>
        <SiteTable sites={sites} staff={staff} />
      </Card>
    </AppShell>
  );
}
