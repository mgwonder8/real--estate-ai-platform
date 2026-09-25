import { Building2, Plus } from "lucide-react";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card, EmptyState } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SiteCard } from "@/components/site-card";
import { listSites } from "@/lib/data/sites";
import { listStaff } from "@/lib/data/staff";
import { listTasks } from "@/lib/data/tasks";

export default async function SitesPage() {
  const session = await auth();
  const [sites, staff, tasks] = await Promise.all([listSites(), listStaff(), listTasks()]);

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <PageHeader
        title="Sites"
        actions={
          <ButtonLink href="/sites/new" variant="secondary">
            <Plus size={16} /> Add site
          </ButtonLink>
        }
      />

      {sites.length === 0 ? (
        <Card>
          <EmptyState icon={<Building2 size={20} />} title="No sites yet" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sites.map((site) => {
            const siteTasks = tasks.filter((t) => t.siteId === site.id);
            const assigned = new Set(siteTasks.flatMap((t) => t.assigneeIds));
            const people = staff.filter((s) => s.role !== "owner" && (s.siteId === site.id || assigned.has(s.id)));
            return <SiteCard key={site.id} site={site} tasks={siteTasks} people={people} />;
          })}
        </div>
      )}
    </AppShell>
  );
}
