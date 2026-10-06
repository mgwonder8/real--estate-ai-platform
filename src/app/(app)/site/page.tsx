import { Building2 } from "lucide-react";
import { auth } from "@/auth";
import { Card, EmptyState } from "@/components/ui/card";
import { SiteCard } from "@/components/site-card";
import { listTasks } from "@/lib/data/tasks";
import { listSites } from "@/lib/data/sites";
import { allSiteIds, getStaff, listStaff } from "@/lib/data/staff";
import { listQueriesRaisedBy } from "@/lib/data/queries";
import { greetingIST, greetingName } from "@/lib/greeting";
import { getT } from "@/lib/i18n/server";
import { RaiseQueryForm } from "@/app/(app)/site/raise-query-form";

export default async function SiteStaffPage() {
  const tr = await getT();
  const session = await auth();
  const me = session!.user.id;

  const [meStaff, tasks, sites, staff, queries] = await Promise.all([getStaff(me), listTasks(), listSites(), listStaff(), listQueriesRaisedBy(me)]);

  const mySiteIds = meStaff ? allSiteIds(meStaff) : [session!.user.siteId].filter(Boolean);
  const mySites = mySiteIds.map((id) => sites.find((s) => s.id === id)).filter((s) => !!s);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {greetingIST(tr)}, {greetingName(session!.user.name)}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">{tr("ss.yourSites")}</p>
      </div>

      {mySites.length === 0 ? (
        <Card>
          <EmptyState icon={<Building2 size={20} />} title={tr("ss.noSites")} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {mySites.map((site) => {
            const siteTasks = tasks.filter((task) => task.siteId === site.id);
            const assigned = new Set(siteTasks.flatMap((task) => task.assigneeIds));
            const people = staff.filter((s) => s.role !== "owner" && (s.siteId === site.id || assigned.has(s.id)));
            return <SiteCard key={site.id} site={site} tasks={siteTasks} people={people} href={`/site/${site.id}`} />;
          })}
        </div>
      )}


      <Card className="mt-8 p-4 sm:p-5">
        <p className="mb-3 text-sm font-semibold text-slate-900">{tr("ss.needHelp")}</p>
        <RaiseQueryForm />
        {queries.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
            {queries.map((q) => (
              <div key={q.id} className="text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-slate-800">{q.message}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      q.status === "answered" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {q.status === "answered" ? tr("ss.replied") : tr("ss.sent")}
                  </span>
                </div>
                {q.reply && <p className="mt-1.5 rounded-xl bg-emerald-50/60 px-3 py-2 text-slate-700">{q.reply}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  );
}
