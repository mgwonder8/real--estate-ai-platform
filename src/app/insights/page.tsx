import Link from "next/link";
import { CircleAlert, Sparkles, Trophy } from "lucide-react";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/page-header";
import { MeterBar, ProgressRing, StatusBar } from "@/components/ui/progress";
import { DueBadge } from "@/components/ui/status-pill";
import { listTasks } from "@/lib/data/tasks";
import { listSites } from "@/lib/data/sites";
import { listStaff } from "@/lib/data/staff";
import { isAiEnabled } from "@/lib/ai/openai";
import { STATUS_META, STATUS_ORDER, isOverdue, sortByUrgency, statusCounts, firstName } from "@/lib/task-meta";
import { PortfolioInsightsPanel } from "@/app/insights/portfolio-insights-button";
import { StaffSummaryButton } from "@/app/insights/staff-summary-button";

export default async function InsightsPage() {
  const session = await auth();
  const [tasks, sites, staff] = await Promise.all([listTasks(), listSites(), listStaff()]);
  const siteById = Object.fromEntries(sites.map((s) => [s.id, s]));
  const staffById = Object.fromEntries(staff.map((s) => [s.id, s]));

  const counts = statusCounts(tasks);
  const total = tasks.length;
  const rate = total ? Math.round((counts.approved / total) * 100) : 0;
  const late = sortByUrgency(tasks.filter(isOverdue));

  const perSite = sites
    .map((site) => {
      const list = tasks.filter((t) => t.siteId === site.id);
      const c = statusCounts(list);
      return { site, total: list.length, counts: c, late: list.filter(isOverdue).length, rate: list.length ? Math.round((c.approved / list.length) * 100) : 0 };
    })
    .sort((a, b) => b.late - a.late || a.rate - b.rate);

  const perStaff = staff
    .filter((s) => s.role !== "owner")
    .map((person) => {
      const mine = tasks.filter((t) => t.assigneeIds.includes(person.id));
      const done = mine.filter((t) => t.status === "approved").length;
      return { person, total: mine.length, done, late: mine.filter(isOverdue).length, rate: mine.length ? Math.round((done / mine.length) * 100) : 0 };
    })
    .filter((p) => p.total > 0)
    .sort((a, b) => b.rate - a.rate || a.late - b.late);

  const worstSite = perSite.find((s) => s.late > 0);
  const top = perStaff[0];

  const sentences: string[] = [];
  if (total === 0) sentences.push("No tasks yet.");
  else {
    sentences.push(`${counts.approved} of ${total} tasks are done across ${sites.length} ${sites.length === 1 ? "site" : "sites"}.`);
    sentences.push(late.length ? `${late.length} ${late.length === 1 ? "task is" : "tasks are"} late${worstSite ? `, mostly at ${worstSite.site.name}` : ""}.` : "Nothing is late.");
    if (counts.completed) sentences.push(`${counts.completed} waiting for your review.`);
    if (top && top.rate > 0) sentences.push(`${firstName(top.person.name)} is leading at ${top.rate}%.`);
  }

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <PageHeader title="Insights" />

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-3">
          <div className="flex items-center gap-5">
            <ProgressRing value={rate} size={92} stroke={8} />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">In short</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-slate-700">{sentences.join(" ")}</p>
            </div>
          </div>
          <StatusBar counts={counts} className="mt-6 h-3" />
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {STATUS_ORDER.map((s) => (
              <span key={s} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className={`h-2 w-2 rounded-full ${STATUS_META[s].dot}`} />
                {STATUS_META[s].label}
                <b className="font-semibold text-slate-800">{counts[s]}</b>
              </span>
            ))}
          </div>
        </Card>

        <Card className="relative overflow-hidden lg:col-span-2">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-gold/10 blur-2xl" />
          <CardHeader
            title={
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-brand-gold" /> AI briefing
              </span>
            }
          />
          <div className="px-5 pb-5">
            {isAiEnabled() ? <PortfolioInsightsPanel /> : <p className="text-sm text-slate-400">AI is not set up.</p>}
          </div>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Sites" />
          <div className="space-y-1 px-2 pb-3">
            {perSite.map(({ site, total: t, counts: c, late: l, rate: r }) => (
              <Link key={site.id} href={`/sites/${site.id}`} className="block rounded-xl px-3 py-3 transition hover:bg-slate-50">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium text-slate-900">{site.name}</p>
                  <span className="flex shrink-0 items-center gap-2 text-xs">
                    {l > 0 && <span className="rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-700">{l} late</span>}
                    <span className="font-semibold text-slate-700">{r}%</span>
                  </span>
                </div>
                <StatusBar counts={c} className="h-2" />
                <p className="mt-1.5 text-xs text-slate-400">{t} tasks</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Team" />
          <div className="space-y-1 px-2 pb-3">
            {perStaff.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No tasks assigned yet</p>}
            {perStaff.map(({ person, total: t, done, late: l, rate: r }, i) => (
              <div key={person.id} className="rounded-xl px-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar name={person.name} size="md" />
                    {i === 0 && r > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-gold text-white ring-2 ring-white">
                        <Trophy size={10} />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <Link href={`/tasks?staff=${person.id}`} className="truncate text-sm font-medium text-slate-900 hover:underline">
                        {person.name}
                      </Link>
                      <span className="shrink-0 text-sm font-semibold text-slate-800">{r}%</span>
                    </div>
                    <div className="mt-1.5">
                      <MeterBar value={r} tone={r >= 70 ? "emerald" : r >= 40 ? "amber" : "slate"} />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400">
                      {done}/{t} done{l > 0 && <span className="text-red-600"> · {l} late</span>}
                    </p>
                  </div>
                </div>
                {isAiEnabled() && <StaffSummaryButton staffId={person.id} />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {late.length > 0 && (
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-1.5">
                <CircleAlert size={14} className="text-red-500" /> Late
              </span>
            }
          />
          <div className="px-2 pb-2">
            {late.slice(0, 8).map((t) => (
              <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50">
                <Avatar name={staffById[t.assigneeIds[0]]?.name ?? "?"} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{t.title}</p>
                  <p className="truncate text-xs text-slate-500">{siteById[t.siteId]?.name}</p>
                </div>
                <DueBadge task={t} />
              </Link>
            ))}
          </div>
        </Card>
      )}
    </AppShell>
  );
}
