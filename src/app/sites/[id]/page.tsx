import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, MessageCircleQuestion, Phone, Plus } from "lucide-react";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressRing, StatusBar } from "@/components/ui/progress";
import { getSite } from "@/lib/data/sites";
import { listTasksForSite } from "@/lib/data/tasks";
import { listStaff } from "@/lib/data/staff";
import { listAllQueries } from "@/lib/data/queries";
import { STATUS_META, STATUS_ORDER, isOpen, isOverdue, statusCounts, timeAgo } from "@/lib/task-meta";
import { SiteBriefForm } from "@/app/sites/[id]/site-brief-form";
import { SiteBoard } from "@/app/sites/[id]/site-board";

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const [site, tasks, staff, queries] = await Promise.all([getSite(id), listTasksForSite(id), listStaff(), listAllQueries()]);
  if (!site) notFound();

  const staffById = Object.fromEntries(staff.map((s) => [s.id, s]));
  const assignedIds = new Set(tasks.flatMap((t) => t.assigneeIds));
  const people = staff.filter((s) => s.role !== "owner" && (s.siteId === site.id || assignedIds.has(s.id)));

  const counts = statusCounts(tasks);
  const late = tasks.filter(isOverdue).length;
  const pct = tasks.length ? (counts.approved / tasks.length) * 100 : 0;
  const siteQueries = queries.filter((q) => q.siteId === site.id);
  const openQueries = siteQueries.filter((q) => q.status === "open");

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <PageHeader
        back="/sites"
        title={site.name}
        subtitle={
          site.address && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={13} /> {site.address}
            </span>
          )
        }
        actions={
          <ButtonLink href={`/tasks/new?siteId=${site.id}`}>
            <Plus size={16} /> New task
          </ButtonLink>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center gap-5">
            <ProgressRing value={pct} size={76} stroke={7} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-500">
                <b className="text-2xl font-semibold text-slate-900">{counts.approved}</b> of {tasks.length} tasks done
              </p>
              <StatusBar counts={counts} className="mt-3 h-2.5" />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {STATUS_ORDER.map((s) => (
              <Link
                key={s}
                href={`/tasks?site=${site.id}&status=${s}`}
                className={`rounded-xl px-3 py-2.5 transition hover:ring-1 hover:ring-slate-200 ${STATUS_META[s].soft}`}
              >
                <p className="text-xl font-semibold text-slate-900">{counts[s]}</p>
                <p className={`flex items-center gap-1.5 text-xs font-medium ${STATUS_META[s].text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[s].dot}`} />
                  {STATUS_META[s].label}
                </p>
              </Link>
            ))}
            <Link
              href={`/tasks?site=${site.id}&status=late`}
              className={`col-span-2 rounded-xl px-3 py-2.5 transition hover:ring-1 hover:ring-slate-200 sm:col-span-1 ${late ? "bg-red-50" : "bg-slate-50"}`}
            >
              <p className={`text-xl font-semibold ${late ? "text-red-600" : "text-slate-900"}`}>{late}</p>
              <p className={`flex items-center gap-1.5 text-xs font-medium ${late ? "text-red-700" : "text-slate-500"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${late ? "bg-red-500" : "bg-slate-300"}`} />
                Late
              </p>
            </Link>
          </div>
        </Card>

        <Card>
          <CardHeader title="Team" action={<span className="text-xs text-slate-400">{people.length}</span>} />
          <div className="px-2 pb-2">
            {people.length === 0 && <p className="px-3 py-6 text-center text-sm text-slate-400">No one yet</p>}
            {people.map((p) => {
              const mine = tasks.filter((t) => t.assigneeIds.includes(p.id));
              const open = mine.filter(isOpen).length;
              const done = mine.filter((t) => t.status === "approved").length;
              return (
                <Link
                  key={p.id}
                  href={`/tasks?site=${site.id}&staff=${p.id}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50"
                >
                  <Avatar name={p.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
                    {p.phone && (
                      <p className="flex items-center gap-1 text-xs text-slate-400">
                        <Phone size={11} /> {p.phone}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 text-xs font-medium">
                    <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-amber-700" title="Open">{open}</span>
                    <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-emerald-700" title="Done">{done}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mb-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Tasks</h2>
        <SiteBoard tasks={tasks} people={people} staffById={staffById} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Project brief" />
          <div className="px-5 pb-5">
            <SiteBriefForm site={site} />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Queries"
            action={
              openQueries.length > 0 && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">{openQueries.length} open</span>
              )
            }
          />
          <div className="px-2 pb-2">
            {siteQueries.length === 0 && (
              <p className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-slate-400">
                <MessageCircleQuestion size={16} /> No queries
              </p>
            )}
            {siteQueries.slice(0, 5).map((q) => (
              <Link key={q.id} href="/queries" className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50">
                <Avatar name={staffById[q.raisedBy]?.name ?? "?"} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm text-slate-800">{q.message}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{timeAgo(q.createdAt)}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    q.status === "open" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {q.status === "open" ? "Open" : "Replied"}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
