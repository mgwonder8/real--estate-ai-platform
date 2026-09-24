import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusPill, PriorityPill } from "@/components/ui/status-pill";
import { listSites } from "@/lib/data/sites";
import { listTasks } from "@/lib/data/tasks";
import { listStaff } from "@/lib/data/staff";
import { isAiEnabled } from "@/lib/ai/openai";
import { AiTaskChat } from "@/app/dashboard/ai-task-chat";
import Link from "next/link";

function isOverdue(task: { deadline: string; status: string }): boolean {
  if (!task.deadline) return false;
  if (task.status === "completed" || task.status === "approved") return false;
  return new Date(task.deadline).getTime() < Date.now();
}

export default async function DashboardPage() {
  const session = await auth();
  const [sites, tasks, staff] = await Promise.all([listSites(), listTasks(), listStaff()]);

  const staffById = Object.fromEntries(staff.map((s) => [s.id, s]));

  const totalPending = tasks.filter((t) => t.status === "pending").length;
  const totalInProgress = tasks.filter((t) => t.status === "in_progress").length;
  const totalCompleted = tasks.filter((t) => t.status === "completed").length;
  const totalApproved = tasks.filter((t) => t.status === "approved").length;

  const perSite = sites.map((site) => {
    const siteTasks = tasks.filter((t) => t.siteId === site.id);
    const siteStaff = staff.filter((s) => s.siteId === site.id && s.role === "site_staff");
    const outstanding = siteTasks
      .filter((t) => t.status === "pending" || t.status === "in_progress")
      .sort((a, b) => {
        const overdueDiff = Number(isOverdue(b)) - Number(isOverdue(a));
        if (overdueDiff !== 0) return overdueDiff;
        return (a.deadline || "9999").localeCompare(b.deadline || "9999");
      });
    return {
      site,
      staffCount: siteStaff.length,
      pending: siteTasks.filter((t) => t.status === "pending").length,
      inProgress: siteTasks.filter((t) => t.status === "in_progress").length,
      awaitingApproval: siteTasks.filter((t) => t.status === "completed").length,
      approved: siteTasks.filter((t) => t.status === "approved").length,
      overdueCount: siteTasks.filter(isOverdue).length,
      outstanding,
    };
  });

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Portfolio Overview</h1>
          <p className="text-sm text-slate-500">Real-time status across {sites.length} site{sites.length === 1 ? "" : "s"}.</p>
        </div>
        <Link href="/tasks" className="text-sm font-medium text-brand-navy hover:underline">
          Go to task board &rarr;
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader
          title="Quick Add via Chat"
          subtitle="Type an instruction like normal — AI drafts the task, you confirm before it's created."
        />
        <div className="px-5 py-5">
          {isAiEnabled() ? (
            <AiTaskChat sites={sites} staff={staff} />
          ) : (
            <p className="text-sm text-slate-500">
              AI task parsing isn&apos;t configured yet (missing <code className="rounded bg-slate-100 px-1">OPENAI_API_KEY</code>).
              Use the full form on the <Link href="/tasks" className="text-brand-navy hover:underline">Tasks</Link> page instead.
            </p>
          )}
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="Pending" value={totalPending} />
        <SummaryCard label="In Progress" value={totalInProgress} />
        <SummaryCard label="Awaiting Approval" value={totalCompleted} />
        <SummaryCard label="Approved" value={totalApproved} />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Site Dashboard</h2>
        <p className="text-sm text-slate-500">What&apos;s outstanding at every site, at a glance.</p>
      </div>

      {sites.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">
          No sites yet. Add your first site under the Sites tab to get started.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {perSite.map(({ site, staffCount, pending, inProgress, awaitingApproval, approved, overdueCount, outstanding }) => (
            <Card key={site.id}>
              <CardHeader
                title={site.name}
                subtitle={`${site.address || "No address on file"} · ${staffCount} site staff`}
                action={
                  overdueCount > 0 ? (
                    <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                      {overdueCount} overdue
                    </span>
                  ) : undefined
                }
              />
              <div className="space-y-3 px-5 py-4">
                <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">{pending} pending</span>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">{inProgress} in progress</span>
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-800">{awaitingApproval} awaiting approval</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">{approved} approved</span>
                </div>

                {outstanding.length === 0 ? (
                  <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    Nothing pending — this site is caught up.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-slate-500">Remaining work</p>
                    {outstanding.slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-slate-800">{task.title}</p>
                          <p className="truncate text-xs text-slate-500">
                            {task.assigneeIds.map((id) => staffById[id]?.name ?? "Unknown").join(", ") || "Unassigned"}
                            {task.deadline && ` · Due ${task.deadline}`}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {isOverdue(task) && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Overdue</span>
                          )}
                          <PriorityPill priority={task.priority} />
                          <StatusPill status={task.status} />
                        </div>
                      </div>
                    ))}
                    {outstanding.length > 5 && (
                      <p className="pt-0.5 text-xs text-slate-500">+{outstanding.length - 5} more — see Tasks for the full list.</p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
    </Card>
  );
}
