import Link from "next/link";
import { ArrowRight, CircleAlert, Clock, Hourglass, CheckCircle2, ListTodo, MessageCircleQuestion, PartyPopper } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { MeterBar } from "@/components/ui/progress";
import { DueBadge } from "@/components/ui/status-pill";
import { SiteTaskBoard, type BoardColumn } from "@/components/site-task-board";
import { listSites } from "@/lib/data/sites";
import { listTasks } from "@/lib/data/tasks";
import { listStaff } from "@/lib/data/staff";
import { listAllQueries } from "@/lib/data/queries";
import { isAiEnabled } from "@/lib/ai/openai";
import { isOpen, isOverdue, sortByUrgency, statusCounts, firstName, serialLabel } from "@/lib/task-meta";
import { assignerName } from "@/lib/roles";
import { greetingIST, greetingName } from "@/lib/greeting";
import { getT } from "@/lib/i18n/server";
import { LOCALE_TAG } from "@/lib/i18n/config";
import { auth } from "@/auth";
import { AiTaskChat } from "@/app/(app)/dashboard/ai-task-chat";

export default async function DashboardPage() {
  const tr = await getT();
  const [session, sites, tasks, allStaff, queries] = await Promise.all([auth(), listSites(), listTasks(), listStaff(), listAllQueries()]);
  const staff = allStaff.filter((s) => s.role !== "owner" && s.active);
  const staffById = Object.fromEntries(allStaff.map((s) => [s.id, s]));
  const siteById = Object.fromEntries(sites.map((s) => [s.id, s]));

  const counts = statusCounts(tasks);
  const late = sortByUrgency(tasks.filter(isOverdue));
  const review = tasks.filter((t) => t.status === "completed");
  const openQueries = queries.filter((q) => q.status === "open");
  const attention = [...review, ...late].slice(0, 6);

  const today = new Intl.DateTimeFormat(LOCALE_TAG[tr.locale], { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" }).format(new Date());

  const workload = staff
    .map((p) => {
      const mine = tasks.filter((t) => t.assigneeIds.includes(p.id));
      return { p, open: mine.filter(isOpen).length, total: mine.length, done: mine.filter((t) => t.status === "approved").length };
    })
    .filter((w) => w.total > 0)
    .sort((a, b) => b.open - a.open);

  const byRecent = (a: { updatedAt: string }, b: { updatedAt: string }) => b.updatedAt.localeCompare(a.updatedAt);
  const BOARD_LIMIT = 8;
  const columns: BoardColumn[] = sites.map((site) => {
    const list = tasks.filter((task) => task.siteId === site.id);
    const ordered = [
      ...sortByUrgency(list.filter(isOpen)),
      ...list.filter((task) => task.status === "completed").sort(byRecent),
      ...list.filter((task) => task.status === "approved").sort(byRecent),
    ];
    const done = list.filter((task) => task.status === "approved").length;
    return {
      siteId: site.id,
      name: site.name,
      pct: list.length ? Math.round((done / list.length) * 100) : 0,
      open: list.filter(isOpen).length,
      late: list.filter(isOverdue).length,
      more: Math.max(0, ordered.length - BOARD_LIMIT),
      href: `/sites/${site.id}`,
      tasks: ordered.slice(0, BOARD_LIMIT).map((task) => ({
        id: task.id,
        serial: task.serial,
        title: task.title,
        status: task.status,
        priority: task.priority,
        deadline: task.deadline,
        people: task.assigneeIds.map((id) => firstName(staffById[id]?.name)).join(", "),
        by: assignerName(staffById[task.createdBy], tr),
        href: `/tasks/${task.id}`,
        canTick: true,
      })),
    };
  });

  const tiles = [
    { key: "open", label: tr("views.open"), value: counts.pending + counts.in_progress, icon: ListTodo, tone: "from-sky-50 to-white text-sky-800", iconTone: "bg-sky-100 text-sky-700" },
    { key: "late", label: tr("views.late"), value: late.length, icon: Clock, tone: "from-red-50 to-white text-red-700", iconTone: "bg-red-100 text-red-600" },
    { key: "review", label: tr("views.review"), value: counts.completed, icon: Hourglass, tone: "from-sky-50 to-white text-sky-800", iconTone: "bg-sky-100 text-sky-700" },
    { key: "done", label: tr("views.done"), value: counts.approved, icon: CheckCircle2, tone: "from-emerald-50 to-white text-emerald-800", iconTone: "bg-emerald-100 text-emerald-700" },
  ];

  return (
    <>
      <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy via-brand-navy to-brand-navy-soft p-5 text-white shadow-xl shadow-brand-navy/10 sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-gold/15 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{today}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {greetingIST(tr)}, {greetingName(session?.user.name)}
          </h1>
          <p className="mb-5 mt-5 text-sm font-medium text-brand-gold">{tr("dash.tell")}</p>
          {isAiEnabled() ? (
            <AiTaskChat sites={sites} staff={staff} />
          ) : (
            <Link href="/tasks/new" className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-medium text-brand-navy">
              {tr("nav.newTask")} <ArrowRight size={16} />
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

      <SiteTaskBoard columns={columns} role={session!.user.role} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader
              title={tr("dash.needsYou")}
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
                  {tr("dash.allClear")}
                </p>
              )}
              {attention.map((t) => (
                <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      t.status === "completed" ? "bg-sky-50 text-sky-600" : "bg-red-50 text-red-600"
                    }`}
                  >
                    {t.status === "completed" ? <Hourglass size={15} /> : <CircleAlert size={15} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium text-slate-900">
                      <span className="mr-1.5 font-mono text-xs text-slate-400">{serialLabel(t.serial)}</span>
                      {t.title}
                    </p>
                    <p className="break-words text-xs text-slate-500">
                      {siteById[t.siteId]?.name} · {assignerName(staffById[t.createdBy], tr)} →{" "}
                      {t.assigneeIds.map((id) => firstName(staffById[id]?.name)).join(", ")}
                    </p>
                  </div>
                  {t.status === "completed" ? (
                    <span className="shrink-0 text-xs font-medium text-sky-700">{tr("dash.approve")}</span>
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
                    {tr.n("dash.openQueries", openQueries.length)}
                  </p>
                  <ArrowRight size={15} className="text-slate-300" />
                </Link>
              )}
            </div>
          </Card>

          {workload.length > 0 && (
            <Card>
              <CardHeader title={tr("dash.team")} action={<Link href="/staff" className="-my-3 -mr-2 flex min-h-11 items-center px-2 text-[13px] font-medium text-slate-500 hover:text-brand-navy">{tr("dash.seeAll")}</Link>} />
              <div className="space-y-1 px-2 pb-3">
                {workload.map(({ p, open, total, done }) => (
                  <Link key={p.id} href={`/tasks?staff=${p.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-slate-50">
                    <Avatar name={p.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="break-words text-sm font-medium text-slate-900">{p.name}</p>
                        <span className="shrink-0 text-xs text-slate-500">
                          <b className="font-semibold text-amber-600">{open}</b> {tr("dash.openLabel")}
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
    </>
  );
}
