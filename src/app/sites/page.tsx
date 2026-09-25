import Link from "next/link";
import { Plus, MapPin, Users, ArrowRight } from "lucide-react";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listSites } from "@/lib/data/sites";
import { listStaff } from "@/lib/data/staff";
import { listTasks } from "@/lib/data/tasks";
import { NewSiteModal } from "@/app/sites/new-site-modal";

function isOverdue(task: { deadline: string; status: string }): boolean {
  if (!task.deadline) return false;
  if (task.status === "completed" || task.status === "approved") return false;
  return new Date(task.deadline).getTime() < Date.now();
}

export default async function SitesPage() {
  const session = await auth();
  const [sites, staff, tasks] = await Promise.all([listSites(), listStaff(), listTasks()]);

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Sites</h1>
          <p className="text-sm text-slate-500">Every property being managed.</p>
        </div>
        <NewSiteModal />
      </div>

      {sites.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-slate-500">No sites yet.</p>
          <Link href="/tasks/new" className="mt-3 inline-block">
            <Button className="gap-1.5"><Plus size={16} /> Add site</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sites.map((site) => {
            const siteTasks = tasks.filter((t) => t.siteId === site.id);
            const siteStaffCount = staff.filter((s) => s.siteId === site.id && s.role === "site_staff").length;
            const outstanding = siteTasks.filter((t) => t.status === "pending" || t.status === "in_progress").length;
            const overdue = siteTasks.filter(isOverdue).length;
            return (
              <Link
                key={site.id}
                href={`/sites/${site.id}`}
                className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-navy hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 group-hover:text-brand-navy">{site.name}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                      <MapPin size={11} /> {site.address || "—"}
                    </p>
                  </div>
                  <ArrowRight size={16} className="mt-0.5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-navy" />
                </div>

                <div className="flex flex-wrap gap-1.5 text-xs">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                    <Users size={10} className="mr-1 inline" /> {siteStaffCount}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{siteTasks.length} tasks</span>
                  {outstanding > 0 && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">{outstanding} open</span>
                  )}
                  {overdue > 0 && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">{overdue} overdue</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
