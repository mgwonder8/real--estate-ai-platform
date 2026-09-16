import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { listSites } from "@/lib/data/sites";
import { listTasks } from "@/lib/data/tasks";
import { listStaff } from "@/lib/data/staff";
import { isAiEnabled } from "@/lib/ai/openai";
import { AiTaskChat } from "@/app/dashboard/ai-task-chat";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const [sites, tasks, staff] = await Promise.all([listSites(), listTasks(), listStaff()]);

  const totalPending = tasks.filter((t) => t.status === "pending").length;
  const totalInProgress = tasks.filter((t) => t.status === "in_progress").length;
  const totalCompleted = tasks.filter((t) => t.status === "completed").length;
  const totalApproved = tasks.filter((t) => t.status === "approved").length;

  const perSite = sites.map((site) => {
    const siteTasks = tasks.filter((t) => t.siteId === site.id);
    const siteStaff = staff.filter((s) => s.siteId === site.id && s.role === "site_staff");
    return {
      site,
      staffCount: siteStaff.length,
      pending: siteTasks.filter((t) => t.status === "pending").length,
      inProgress: siteTasks.filter((t) => t.status === "in_progress").length,
      completed: siteTasks.filter((t) => t.status === "completed" || t.status === "approved").length,
      latest: siteTasks[0],
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

      {sites.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">
          No sites yet. Add your first site under the Sites tab to get started.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {perSite.map(({ site, staffCount, pending, inProgress, completed, latest }) => (
            <Card key={site.id}>
              <CardHeader
                title={site.name}
                subtitle={`${site.address || "No address on file"} · ${staffCount} site staff`}
              />
              <div className="space-y-3 px-5 py-4">
                <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">{pending} pending</span>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">{inProgress} in progress</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">{completed} completed</span>
                </div>
                {latest ? (
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <div className="truncate text-sm text-slate-700">{latest.title}</div>
                    <StatusPill status={latest.status} />
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No tasks recorded for this site yet.</p>
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
