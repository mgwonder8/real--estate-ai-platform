import Link from "next/link";
import { ArrowRight, CircleAlert, Clock, Hourglass, CheckCircle2, ListTodo, MessageCircleQuestion, PartyPopper } from "lucide-react";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { MeterBar } from "@/components/ui/progress";
import { DueBadge } from "@/components/ui/status-pill";
import { SiteCard } from "@/components/site-card";
import { listSites } from "@/lib/data/sites";
import { listTasks } from "@/lib/data/tasks";
import { listStaff } from "@/lib/data/staff";
import { listAllQueries } from "@/lib/data/queries";
import { isAiEnabled } from "@/lib/ai/openai";
import { isOpen, isOverdue, sortByUrgency, statusCounts, firstName } from "@/lib/task-meta";
import { AiTaskChat } from "@/app/dashboard/ai-task-chat";

function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const session = await auth();
  const [sites, tasks, allStaff, queries] = await Promise.all([listSites(), listTasks(), listStaff(), listAllQueries()]);
  const staff = allStaff.filter((s) => s.role !== "owner" && s.active);
  const staffById = Object.fromEntries(allStaff.map((s) => [s.id, s]));
  const siteById = Object.fromEntries(sites.map((s) => [s.id, s]));

  const counts = statusCounts(tasks);
  const late = sortByUrgency(tasks.filter(isOverdue));
  const review = tasks.filter((t) => t.status === "completed");
  const openQueries = queries.filter((q) => q.status === "open");
  const attention = [...review, ...late].slice(0, 6);

  const today = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" }).format(new Date());

  const workload = staff
    .map((p) => {
      const mine = tasks.filter((t) => t.assigneeIds.includes(p.id));
      return { p, open: mine.filter(isOpen).length, total: mine.length, done: mine.filter((t) => t.status === "approved").length };
    })
    .filter((w) => w.total > 0)
    .sort((a, b) => b.open - a.open);

  const tiles = [
    { key: "pending", label: "To do", value: counts.pending, icon: ListTodo, tone: "from-slate-50 to-white text-slate-700", iconTone: "bg-slate-200/70 text-slate-700" },
    { key: "in_progress", label: "In progress", value: counts.in_progress, icon: Clock, tone: "from-amber-50 to-white text-amber-800", iconTone: "bg-amber-100 text-amber-700" },
    { key: "completed", label: "Needs review", value: counts.completed, icon: Hourglass, tone: "from-violet-50 to-white text-violet-800", iconTone: "bg-violet-100 text-violet-700" },
    { key: "approved", label: "Done", value: counts.approved, icon: CheckCircle2, tone: "from-emerald-50 to-white text-emerald-800", iconTone: "bg-emerald-100 text-emerald-700" },
  ];

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy via-brand-navy to-brand-navy-soft p-5 text-white shadow-xl shadow-brand-navy/10 sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-gold/15 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{today}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting()}, {firstName(session!.user.name)}
          </h1>
          <p className="mb-5 mt-5 text-sm font-medium text-brand-gold">Tell your task</p>
          {isAiEnabled() ? (
            <AiTaskChat sites={sites} staff={staff} />
          ) : (
            <Link href="/tasks/new" className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-medium text-brand-navy">
              New task <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </section>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(({ key, label, value, icon: Icon, tone, iconTone }) => (
          <Link
            key={key}
            href={`/tasks?status=${key}`}
            className={`group rounded-2xl border border-slate-200/70 bg-gradient-to-b p-4 transition hover:-translate-y-0.5 hover:shadow-md ${tone}`}
          >
            <div className="flex items-center justify-between">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconTone}`}>
                <Icon size={18} />
              </span>
              <ArrowRight size={15} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
            <p className="mt-0.5 text-sm font-medium">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Sites</h2>
            <Link href="/sites" className="text-xs font-medium text-slate-500 hover:text-brand-navy">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {sites.map((site) => {
              const siteTasks = tasks.filter((t) => t.siteId === site.id);
              const assigned = new Set(siteTasks.flatMap((t) => t.assigneeIds));
              const people = staff.filter((s) => s.siteId === site.id || assigned.has(s.id));
              return <SiteCard key={site.id} site={site} tasks={siteTasks} people={people} />;
            })}
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Needs you"
              action={
                attention.length > 0 && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">{review.length + late.length}</span>
                )
              }
            />
            <div className="px-2 pb-2">
              {attention.length === 0 && openQueries.length === 0 && (
                <p className="flex flex-col items-center gap-2 py-8 text-sm text-slate-400">
                  <PartyPopper size={22} className="text-emerald-500" />
                  All clear
                </p>
              )}
              {attention.map((t) => (
                <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      t.status === "completed" ? "bg-violet-50 text-violet-600" : "bg-red-50 text-red-600"
                    }`}
                  >
                    {t.status === "completed" ? <Hourglass size={15} /> : <CircleAlert size={15} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{t.title}</p>
                    <p className="truncate text-xs text-slate-500">
                      {siteById[t.siteId]?.name} · {t.assigneeIds.map((id) => firstName(staffById[id]?.name)).join(", ")}
                    </p>
                  </div>
                  {t.status === "completed" ? (
                    <span className="shrink-0 text-xs font-medium text-violet-600">Review</span>
                  ) : (
                    <DueBadge task={t} />
                  )}
                </Link>
              ))}
              {openQueries.length > 0 && (
                <Link href="/queries" className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                    <MessageCircleQuestion size={15} />
                  </span>
                  <p className="flex-1 text-sm font-medium text-slate-900">
                    {openQueries.length} open {openQueries.length === 1 ? "query" : "queries"}
                  </p>
                  <ArrowRight size={15} className="text-slate-300" />
                </Link>
              )}
            </div>
          </Card>

          {workload.length > 0 && (
            <Card>
              <CardHeader title="Team" action={<Link href="/staff" className="text-xs font-medium text-slate-500 hover:text-brand-navy">See all</Link>} />
              <div className="space-y-1 px-2 pb-3">
                {workload.map(({ p, open, total, done }) => (
                  <Link key={p.id} href={`/tasks?staff=${p.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-slate-50">
                    <Avatar name={p.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
                        <span className="shrink-0 text-xs text-slate-500">
                          <b className="font-semibold text-amber-600">{open}</b> open
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <MeterBar value={(done / total) * 100} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
