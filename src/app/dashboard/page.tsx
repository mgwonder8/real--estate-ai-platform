import { auth } from "@/auth";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { PriorityPill } from "@/components/ui/status-pill";
import { listSites } from "@/lib/data/sites";
import { listTasks } from "@/lib/data/tasks";
import { listStaff } from "@/lib/data/staff";
import { isAiEnabled } from "@/lib/ai/openai";
import { AiTaskChat } from "@/app/dashboard/ai-task-chat";
import { Clock, Loader2, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";

function isOverdue(task: { deadline: string; status: string }): boolean {
  if (!task.deadline) return false;
  if (task.status === "completed" || task.status === "approved") return false;
  return new Date(task.deadline).getTime() < Date.now();
}

export default async function DashboardPage() {
  const session = await auth();
  const [sites, tasks, allStaff] = await Promise.all([listSites(), listTasks(), listStaff()]);
  const staff = allStaff.filter((s) => s.role !== "owner");
  const staffById = Object.fromEntries(allStaff.map((s) => [s.id, s]));

  const counts = {
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    approved: tasks.filter((t) => t.status === "approved").length,
  };

  const perSite = sites.map((site) => {
    const siteTasks = tasks.filter((t) => t.siteId === site.id);
    const outstanding = siteTasks
      .filter((t) => t.status === "pending" || t.status === "in_progress")
      .sort((a, b) => {
        const overdueDiff = Number(isOverdue(b)) - Number(isOverdue(a));
        if (overdueDiff !== 0) return overdueDiff;
        return (a.deadline || "9999").localeCompare(b.deadline || "9999");
      });
    return {
      site,
      total: siteTasks.length,
      overdue: siteTasks.filter(isOverdue).length,
      awaiting: siteTasks.filter((t) => t.status === "completed").length,
      outstanding,
    };
  });

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Everything happening across your sites.</p>
      </div>

      {/* AI chat — compact */}
      <Card className="mb-5">
        <CardHeader title="Tell your task" />
        <div className="px-5 py-4">
          {isAiEnabled() ? (
            <AiTaskChat sites={sites} staff={staff} />
          ) : (
            <p className="text-sm text-slate-500">
              AI isn&apos;t configured. Use{" "}
              <Link href="/tasks/new" className="text-brand-navy hover:underline">
                New Task
              </Link>{" "}
              instead.
            </p>
          )}
        </div>
      </Card>

      {/* Compact stat strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Clock} label="Pending" value={counts.pending} tone="slate" />
        <Stat icon={Loader2} label="In Progress" value={counts.inProgress} tone="amber" />
        <Stat icon={CheckCircle2} label="Awaiting" value={counts.completed} tone="blue" />
        <Stat icon={ShieldCheck} label="Approved" value={counts.approved} tone="emerald" />
      </div>

      {/* Sites grid */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Sites</h2>
        <Link href="/sites" className="text-xs font-medium text-brand-navy hover:underline">
          View all
        </Link>
      </div>

      {sites.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">
          No sites yet. Add your first site to get started.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {perSite.map(({ site, total, overdue, awaiting, outstanding }) => (
            <Link
              key={site.id}
              href={`/sites/${site.id}`}
              className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-navy hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900 group-hover:text-brand-navy">{site.name}</p>
                  <p className="truncate text-xs text-slate-500">{site.address || "—"}</p>
                </div>
                <ArrowRight size={16} className="mt-0.5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-navy" />
              </div>

              <div className="mb-3 flex flex-wrap gap-1.5 text-xs">
                <Chip label={`${total} tasks`} tone="slate" />
                {awaiting > 0 && <Chip label={`${awaiting} awaiting`} tone="blue" />}
                {overdue > 0 && <Chip label={`${overdue} overdue`} tone="red" />}
              </div>

              {outstanding.length === 0 ? (
                <p className="text-xs text-emerald-700">All caught up.</p>
              ) : (
                <ul className="space-y-1">
                  {outstanding.slice(0, 3).map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="min-w-0 flex-1 truncate text-slate-700">{t.title}</span>
                      <span className="shrink-0 text-slate-400">
                        {t.assigneeIds.map((id) => staffById[id]?.name?.split(" ")[0] ?? "?").join(", ")}
                      </span>
                      {isOverdue(t) ? (
                        <span className="shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">Late</span>
                      ) : (
                        <PriorityPill priority={t.priority} />
                      )}
                    </li>
                  ))}
                  {outstanding.length > 3 && (
                    <li className="pt-0.5 text-xs text-slate-400">+{outstanding.length - 3} more</li>
                  )}
                </ul>
              )}
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

const TONES = {
  slate: { icon: "bg-slate-100 text-slate-600", value: "text-slate-900" },
  amber: { icon: "bg-amber-100 text-amber-700", value: "text-slate-900" },
  blue: { icon: "bg-blue-100 text-blue-700", value: "text-slate-900" },
  emerald: { icon: "bg-emerald-100 text-emerald-700", value: "text-slate-900" },
} as const;

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  tone: keyof typeof TONES;
}) {
  const t = TONES[tone];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${t.icon}`}>
        <Icon size={16} />
      </span>
      <div>
        <p className={`text-xl font-semibold leading-none ${t.value}`}>{value}</p>
        <p className="mt-1 text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

const CHIP_TONES = {
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-blue-100 text-blue-700",
  red: "bg-red-100 text-red-700",
} as const;

function Chip({ label, tone }: { label: string; tone: keyof typeof CHIP_TONES }) {
  return <span className={`rounded-full px-2 py-0.5 ${CHIP_TONES[tone]}`}>{label}</span>;
}
