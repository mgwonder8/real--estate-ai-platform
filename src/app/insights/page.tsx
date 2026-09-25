import Link from "next/link";
import { ListChecks, CheckCircle2, TrendingUp, AlertTriangle, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { PriorityPill } from "@/components/ui/status-pill";
import { Avatar } from "@/components/ui/avatar";
import { listTasks } from "@/lib/data/tasks";
import { listSites } from "@/lib/data/sites";
import { listStaff } from "@/lib/data/staff";
import { isAiEnabled } from "@/lib/ai/openai";
import { PortfolioInsightsPanel } from "@/app/insights/portfolio-insights-button";
import { StaffSummaryButton } from "@/app/insights/staff-summary-button";

function isOverdue(task: { deadline: string; status: string }): boolean {
  if (!task.deadline) return false;
  if (task.status === "completed" || task.status === "approved") return false;
  return new Date(task.deadline).getTime() < Date.now();
}

export default async function InsightsPage() {
  const session = await auth();
  const [tasks, sites, staff] = await Promise.all([listTasks(), listSites(), listStaff()]);

  const siteById = Object.fromEntries(sites.map((s) => [s.id, s]));
  const staffById = Object.fromEntries(staff.map((s) => [s.id, s]));

  const totalTasks = tasks.length;
  const doneCount = tasks.filter((t) => t.status === "approved").length;
  const completionRate = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;
  const overdueTasks = tasks.filter(isOverdue).sort((a, b) => a.deadline.localeCompare(b.deadline));

  const perSite = sites
    .map((site) => {
      const siteTasks = tasks.filter((t) => t.siteId === site.id);
      return {
        site,
        total: siteTasks.length,
        overdue: siteTasks.filter(isOverdue).length,
        approved: siteTasks.filter((t) => t.status === "approved").length,
        awaiting: siteTasks.filter((t) => t.status === "completed").length,
      };
    })
    .sort((a, b) => b.overdue - a.overdue);

  const siteStaffOnly = staff.filter((s) => s.role === "site_staff");
  const perStaff = siteStaffOnly
    .map((person) => {
      const theirs = tasks.filter((t) => t.assigneeIds.includes(person.id));
      const approved = theirs.filter((t) => t.status === "approved").length;
      const overdue = theirs.filter(isOverdue).length;
      return {
        person,
        total: theirs.length,
        approved,
        overdue,
        completionRate: theirs.length > 0 ? Math.round((approved / theirs.length) * 100) : 0,
      };
    })
    .sort((a, b) => b.completionRate - a.completionRate);

  const topPerformer = perStaff.find((p) => p.total > 0);
  const riskiestSite = perSite.find((s) => s.overdue > 0);

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900">Insights</h1>
        <p className="text-sm text-slate-500">Where the portfolio stands, in plain language.</p>
      </div>

      {/* Compact stat strip */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={totalTasks} icon={ListChecks} />
        <StatCard label="Approved" value={doneCount} icon={CheckCircle2} />
        <StatCard label="Completion" value={`${completionRate}%`} icon={TrendingUp} />
        <StatCard label="Overdue" value={overdueTasks.length} tone={overdueTasks.length > 0 ? "danger" : "default"} icon={AlertTriangle} />
      </div>

      {/* At-a-glance narrative */}
      <Card className="mb-5">
        <div className="px-5 py-4">
          <p className="mb-2 text-sm font-semibold text-slate-900">This week, at a glance</p>
          <p className="text-sm leading-relaxed text-slate-700">
            {totalTasks === 0 ? (
              "No tasks recorded yet. Create the first one from the dashboard."
            ) : (
              <>
                {sites.length} site{sites.length === 1 ? "" : "s"} are being managed with{" "}
                <strong className="text-slate-900">{totalTasks}</strong> total task{totalTasks === 1 ? "" : "s"}.{" "}
                <strong className="text-emerald-700">{completionRate}%</strong> have been approved.{" "}
                {overdueTasks.length > 0 ? (
                  <>
                    There {overdueTasks.length === 1 ? "is" : "are"}{" "}
                    <strong className="text-red-600">{overdueTasks.length} overdue task{overdueTasks.length === 1 ? "" : "s"}</strong>
                    {riskiestSite && <> — mostly at <strong>{riskiestSite.site.name}</strong></>}
                    .{" "}
                  </>
                ) : (
                  "Nothing is overdue right now — a clean run. "
                )}
                {topPerformer && topPerformer.completionRate > 0 && (
                  <>
                    <strong>{topPerformer.person.name}</strong> is leading with a{" "}
                    <strong className="text-emerald-700">{topPerformer.completionRate}%</strong> completion rate.
                  </>
                )}
              </>
            )}
          </p>
        </div>
      </Card>

      {/* AI briefing */}
      <Card className="mb-5">
        <CardHeader
          title={<span className="flex items-center gap-1.5"><Sparkles size={14} className="text-brand-gold" /> AI briefing</span>}
        />
        <div className="px-5 py-4">
          {isAiEnabled() ? (
            <PortfolioInsightsPanel />
          ) : (
            <p className="text-sm text-slate-500">AI briefing isn&apos;t configured yet.</p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Overdue */}
        <Card>
          <CardHeader title="Needs attention" subtitle={overdueTasks.length === 0 ? "Nothing overdue." : `${overdueTasks.length} overdue`} />
          <div className="divide-y divide-slate-100">
            {overdueTasks.length === 0 && <p className="px-5 py-8 text-center text-sm text-emerald-700">All clear.</p>}
            {overdueTasks.slice(0, 8).map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={staffById[t.assigneeIds[0]]?.name ?? "?"} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{t.title}</p>
                    <p className="truncate text-xs text-slate-500">
                      <Link href={`/sites/${t.siteId}`} className="hover:underline">
                        {siteById[t.siteId]?.name ?? "Unknown"}
                      </Link>
                      {" · Due "}{t.deadline}
                    </p>
                  </div>
                </div>
                <PriorityPill priority={t.priority} />
              </div>
            ))}
          </div>
        </Card>

        {/* Sites ranking */}
        <Card>
          <CardHeader title="Sites" subtitle="Sorted by overdue count" />
          <div className="divide-y divide-slate-100">
            {perSite.map(({ site, total, approved, overdue, awaiting }) => {
              const rate = total > 0 ? Math.round((approved / total) * 100) : 0;
              return (
                <Link key={site.id} href={`/sites/${site.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{site.name}</p>
                    <p className="text-xs text-slate-500">
                      {total} task{total === 1 ? "" : "s"} · {rate}% approved
                      {awaiting > 0 && <> · {awaiting} awaiting</>}
                    </p>
                  </div>
                  {overdue > 0 ? (
                    <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      {overdue} overdue
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      on track
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Staff */}
      <Card className="mt-5">
        <CardHeader title="Staff performance" subtitle="Ranked by completion rate" />
        <div className="divide-y divide-slate-100">
          {perStaff.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-500">No site staff yet.</p>}
          {perStaff.map(({ person, total, approved, overdue, completionRate: rate }) => (
            <div key={person.id} className="px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={person.name} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{person.name}</p>
                    <p className="text-xs text-slate-500">
                      {total > 0 ? (
                        <>
                          {approved}/{total} approved · {rate}% completion
                          {overdue > 0 && <span className="ml-1 font-medium text-red-600">· {overdue} overdue</span>}
                        </>
                      ) : (
                        "No tasks assigned yet."
                      )}
                    </p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  rate >= 80 ? "bg-emerald-100 text-emerald-700"
                    : rate >= 50 ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-600"
                }`}>
                  {rate}%
                </span>
              </div>
              {isAiEnabled() && total > 0 && <StaffSummaryButton staffId={person.id} />}
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
  icon: Icon,
}: {
  label: string;
  value: string | number;
  tone?: "default" | "danger";
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  const danger = tone === "danger" && Number(value) > 0;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${danger ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-500"}`}>
        <Icon size={16} />
      </span>
      <div>
        <p className={`text-xl font-semibold leading-none ${danger ? "text-red-600" : "text-slate-900"}`}>{value}</p>
        <p className="mt-1 text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
