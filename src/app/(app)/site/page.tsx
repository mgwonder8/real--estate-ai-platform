import { Building2 } from "lucide-react";
import { auth } from "@/auth";
import { Card, EmptyState } from "@/components/ui/card";
import { SiteTaskBoard, type BoardColumn } from "@/components/site-task-board";
import { listTasks } from "@/lib/data/tasks";
import { listSites } from "@/lib/data/sites";
import { allSiteIds, getStaff, listStaff, teamViewSites } from "@/lib/data/staff";
import { firstName, isOpen, isOverdue, sortByUrgency } from "@/lib/task-meta";
import { assignerName } from "@/lib/roles";
import type { Task } from "@/lib/data/types";
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
  const staffById = Object.fromEntries(staff.map((x) => [x.id, x]));
  const teamSiteIds = meStaff ? teamViewSites(meStaff) : [];
  const byRecent = (x: Task, y: Task) => y.updatedAt.localeCompare(x.updatedAt);
  const LIMIT = 8;

  // Same colour-coded board as the owner's dashboard: one column per site, each opening that site's tasks.
  const columns: BoardColumn[] = mySiteIds.flatMap((siteId) => {
    const site = sites.find((x) => x.id === siteId);
    if (!site) return [];
    const list = tasks.filter((task) => task.siteId === siteId && (task.assigneeIds.includes(me) || teamSiteIds.includes(siteId)));
    const ordered = [
      ...sortByUrgency(list.filter(isOpen)),
      ...list.filter((task) => task.status === "completed").sort(byRecent),
      ...list.filter((task) => task.status === "approved").sort(byRecent),
    ];
    const done = list.filter((task) => task.status === "approved").length;
    return [
      {
        siteId,
        name: site.name,
        href: `/site/${siteId}`,
        pct: list.length ? Math.round((done / list.length) * 100) : 0,
        open: list.filter(isOpen).length,
        late: list.filter(isOverdue).length,
        more: Math.max(0, ordered.length - LIMIT),
        tasks: ordered.slice(0, LIMIT).map((task) => ({
          id: task.id,
          serial: task.serial,
          title: task.title,
          status: task.status,
          priority: task.priority,
          deadline: task.deadline,
          people: task.assigneeIds.map((id) => (id === me ? tr("common.you") : firstName(staffById[id]?.name))).join(", "),
          by: task.createdBy === me ? tr("common.you") : assignerName(staffById[task.createdBy], tr),
          href: `/site/${siteId}`,
          canTick: false,
        })),
      },
    ];
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {greetingIST(tr)}, {greetingName(session!.user.name)}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">{tr("ss.yourSites")}</p>
      </div>

      {columns.length === 0 ? (
        <Card>
          <EmptyState icon={<Building2 size={20} />} title={tr("ss.noSites")} />
        </Card>
      ) : (
        <div>
          <SiteTaskBoard columns={columns} role="site_staff" seeAllHref={null} />
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
