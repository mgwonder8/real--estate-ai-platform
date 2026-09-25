import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, MapPin, Users, ClipboardList } from "lucide-react";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { PriorityPill, StatusPill } from "@/components/ui/status-pill";
import { getSite } from "@/lib/data/sites";
import { listTasksForSite } from "@/lib/data/tasks";
import { listStaff } from "@/lib/data/staff";
import { SiteBriefForm } from "@/app/sites/[id]/site-brief-form";

function isOverdue(task: { deadline: string; status: string }): boolean {
  if (!task.deadline) return false;
  if (task.status === "completed" || task.status === "approved") return false;
  return new Date(task.deadline).getTime() < Date.now();
}

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const [site, tasks, staff] = await Promise.all([getSite(id), listTasksForSite(id), listStaff()]);
  if (!site) notFound();

  const siteStaff = staff.filter((s) => s.siteId === site.id && s.role === "site_staff");
  const staffById = Object.fromEntries(staff.map((s) => [s.id, s]));

  const outstanding = tasks
    .filter((t) => t.status === "pending" || t.status === "in_progress")
    .sort((a, b) => {
      const overdueDiff = Number(isOverdue(b)) - Number(isOverdue(a));
      if (overdueDiff !== 0) return overdueDiff;
      return (a.deadline || "9999").localeCompare(b.deadline || "9999");
    });
  const awaiting = tasks.filter((t) => t.status === "completed");
  const approved = tasks.filter((t) => t.status === "approved");
  const overdueCount = tasks.filter(isOverdue).length;

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Link href="/sites" className="mt-1 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-slate-900">{site.name}</h1>
            <p className="flex items-center gap-1 text-sm text-slate-500">
              <MapPin size={12} /> {site.address || "No address"}
            </p>
          </div>
        </div>
        <Link href={`/tasks/new?siteId=${site.id}`}>
          <Button className="shrink-0 gap-1.5">
            <Plus size={16} /> New task
          </Button>
        </Link>
      </div>

      {/* Compact stat row */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SiteStat label="Total" value={tasks.length} />
        <SiteStat label="Outstanding" value={outstanding.length} />
        <SiteStat label="Awaiting" value={awaiting.length} tone="blue" />
        <SiteStat label="Overdue" value={overdueCount} tone={overdueCount > 0 ? "red" : "default"} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader
              title="Outstanding"
              subtitle={`${outstanding.length} pending or in progress`}
            />
            {outstanding.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-emerald-700">All caught up.</p>
            ) : (
              <TaskList tasks={outstanding} staffById={staffById} />
            )}
          </Card>

          {awaiting.length > 0 && (
            <Card>
              <CardHeader title="Awaiting approval" subtitle={`${awaiting.length} pending your review`} />
              <TaskList tasks={awaiting} staffById={staffById} showApproveLink />
            </Card>
          )}

          {approved.length > 0 && (
            <Card>
              <CardHeader title="Approved" subtitle={`${approved.length} done`} />
              <TaskList tasks={approved} staffById={staffById} />
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Site staff" action={<span className="text-xs text-slate-500"><Users size={12} className="mr-0.5 inline" /> {siteStaff.length}</span>} />
            <div className="divide-y divide-slate-100">
              {siteStaff.length === 0 ? (
                <p className="px-5 py-6 text-center text-sm text-slate-500">None assigned.</p>
              ) : (
                siteStaff.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={s.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{s.name}</p>
                      <p className="truncate text-xs text-slate-500">{s.phone || s.email}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Project brief" />
            <div className="px-5 py-4">
              <SiteBriefForm site={site} />
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function TaskList({
  tasks,
  staffById,
  showApproveLink,
}: {
  tasks: Awaited<ReturnType<typeof listTasksForSite>>;
  staffById: Record<string, { name: string }>;
  showApproveLink?: boolean;
}) {
  return (
    <ul className="divide-y divide-slate-100">
      {tasks.map((t) => (
        <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{t.title}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
              <ClipboardList size={11} />
              <span className="truncate">
                {t.assigneeIds.map((id) => staffById[id]?.name ?? "?").join(", ") || "Unassigned"}
              </span>
              {t.deadline && <span>· Due {t.deadline}</span>}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {isOverdue(t) && (
              <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">Late</span>
            )}
            <PriorityPill priority={t.priority} />
            <StatusPill status={t.status} />
            {showApproveLink && (
              <Link href="/tasks" className="text-xs font-medium text-brand-navy hover:underline">
                Review
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

const STAT_TONES = {
  default: "bg-slate-100 text-slate-700",
  blue: "bg-blue-100 text-blue-700",
  red: "bg-red-100 text-red-700",
} as const;

function SiteStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: keyof typeof STAT_TONES;
}) {
  const isRed = tone === "red" && value > 0;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-0.5 text-2xl font-semibold ${isRed ? "text-red-600" : "text-slate-900"}`}>{value}</p>
      <span className={`mt-1 inline-block h-1 w-8 rounded-full ${STAT_TONES[tone]}`} />
    </div>
  );
}
