import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { PriorityPill } from "@/components/ui/status-pill";
import { listTasks } from "@/lib/data/tasks";
import { listSites } from "@/lib/data/sites";
import { listStaff } from "@/lib/data/staff";
import { isAiEnabled } from "@/lib/ai/openai";
import { PortfolioInsightsButton } from "@/app/insights/portfolio-insights-button";
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

  const perSite = sites.map((site) => {
    const siteTasks = tasks.filter((t) => t.siteId === site.id);
    return {
      site,
      total: siteTasks.length,
      overdue: siteTasks.filter(isOverdue).length,
      approved: siteTasks.filter((t) => t.status === "approved").length,
    };
  });

  const siteStaffOnly = staff.filter((s) => s.role === "site_staff");
  const perStaff = siteStaffOnly.map((person) => {
    const theirs = tasks.filter((t) => t.assigneeId === person.id);
    const approved = theirs.filter((t) => t.status === "approved").length;
    const overdue = theirs.filter(isOverdue).length;
    return {
      person,
      total: theirs.length,
      approved,
      overdue,
      completionRate: theirs.length > 0 ? Math.round((approved / theirs.length) * 100) : 0,
    };
  });

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Insights &amp; Reports</h1>
        <p className="text-sm text-slate-500">Portfolio-wide performance, staff summaries, and delay flags.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Tasks" value={totalTasks} />
        <StatCard label="Approved" value={doneCount} />
        <StatCard label="Completion Rate" value={`${completionRate}%`} />
        <StatCard label="Overdue" value={overdueTasks.length} tone={overdueTasks.length > 0 ? "danger" : "default"} />
      </div>

      <Card className="mb-6">
        <CardHeader title="AI Portfolio Briefing" subtitle="A generated summary of what needs attention across all sites." />
        <div className="px-5 py-5">
          {isAiEnabled() ? (
            <PortfolioInsightsButton />
          ) : (
            <p className="text-sm text-slate-500">
              AI insights aren&apos;t configured (missing <code className="rounded bg-slate-100 px-1">OPENAI_API_KEY</code>).
            </p>
          )}
        </div>
      </Card>

      <Card className="mb-6">
        <CardHeader title="Overdue Tasks" subtitle="Past their deadline and not yet approved." />
        <div className="divide-y divide-slate-100">
          {overdueTasks.length === 0 && <p className="px-5 py-6 text-center text-sm text-slate-500">Nothing overdue right now.</p>}
          {overdueTasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{t.title}</p>
                <p className="text-xs text-slate-500">
                  {siteById[t.siteId]?.name ?? "Unknown site"} · {staffById[t.assigneeId]?.name ?? "Unassigned"} · Due {t.deadline}
                </p>
              </div>
              <PriorityPill priority={t.priority} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-6">
        <CardHeader title="Sites" />
        <div className="divide-y divide-slate-100">
          {perSite.map(({ site, total, overdue, approved }) => (
            <div key={site.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="font-medium text-slate-900">{site.name}</span>
              <span className="text-slate-500">
                {total} tasks · {approved} approved{overdue > 0 && <span className="ml-1 font-medium text-red-600">· {overdue} overdue</span>}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Staff Performance" />
        <div className="divide-y divide-slate-100">
          {perStaff.length === 0 && <p className="px-5 py-6 text-center text-sm text-slate-500">No site staff yet.</p>}
          {perStaff.map(({ person, total, approved, overdue, completionRate: rate }) => (
            <div key={person.id} className="px-5 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-900">{person.name}</span>
                <span className="text-slate-500">
                  {total} tasks · {approved} approved · {rate}% completion
                  {overdue > 0 && <span className="ml-1 font-medium text-red-600">· {overdue} overdue</span>}
                </span>
              </div>
              {isAiEnabled() && <StaffSummaryButton staffId={person.id} />}
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}

function StatCard({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "danger" }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${tone === "danger" && Number(value) > 0 ? "text-red-600" : "text-slate-900"}`}>{value}</p>
    </Card>
  );
}
