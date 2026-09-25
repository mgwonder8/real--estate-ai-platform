import Link from "next/link";
import { CheckCircle2, MapPin, MessageCircleQuestion } from "lucide-react";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card, EmptyState } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/page-header";
import { listAllQueries } from "@/lib/data/queries";
import { listStaff } from "@/lib/data/staff";
import { listSites } from "@/lib/data/sites";
import { timeAgo } from "@/lib/task-meta";
import { ReplyBox } from "@/app/queries/reply-box";

export default async function QueriesPage() {
  const session = await auth();
  const [queries, staff, sites] = await Promise.all([listAllQueries(), listStaff(), listSites()]);

  const staffById = Object.fromEntries(staff.map((s) => [s.id, s]));
  const siteById = Object.fromEntries(sites.map((s) => [s.id, s]));
  const open = queries.filter((q) => q.status === "open");
  const answered = queries.filter((q) => q.status === "answered");

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <PageHeader title="Queries" />

      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Open</h2>
        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">{open.length}</span>
      </div>

      <div className="mb-8 space-y-3">
        {open.length === 0 && (
          <Card>
            <EmptyState icon={<CheckCircle2 size={20} className="text-emerald-500" />} title="No open queries" />
          </Card>
        )}
        {open.map((q) => {
          const raiser = staffById[q.raisedBy];
          const site = siteById[q.siteId];
          return (
            <Card key={q.id} className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <Avatar name={raiser?.name ?? "?"} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 text-sm">
                    <span className="font-semibold text-slate-900">{raiser?.name ?? "Unknown"}</span>
                    {site && (
                      <Link href={`/sites/${site.id}`} className="text-xs text-slate-500 hover:underline">
                        {site.name}
                      </Link>
                    )}
                    <span className="text-xs text-slate-400">{timeAgo(q.createdAt)}</span>
                  </div>
                  <p className="mt-2 inline-block rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5 text-[15px] text-slate-800">{q.message}</p>
                  {q.gpsLat && q.gpsLng && (
                    <a
                      href={`https://maps.google.com/?q=${q.gpsLat},${q.gpsLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 inline-flex items-center gap-1 text-xs text-brand-navy hover:underline"
                    >
                      <MapPin size={12} /> Location
                    </a>
                  )}
                  <div className="mt-3">
                    <ReplyBox queryId={q.id} />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {answered.length > 0 && (
        <>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Replied</h2>
          <Card className="divide-y divide-slate-100">
            {answered.map((q) => {
              const raiser = staffById[q.raisedBy];
              return (
                <div key={q.id} className="flex items-start gap-3 p-4">
                  <Avatar name={raiser?.name ?? "?"} size="sm" />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="text-slate-800">{q.message}</p>
                    <p className="mt-1.5 flex items-start gap-1.5 text-slate-500">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                      {q.reply}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {raiser?.name}
                      {siteById[q.siteId] && ` · ${siteById[q.siteId].name}`} · {timeAgo(q.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </Card>
        </>
      )}

      {queries.length === 0 && (
        <Card>
          <EmptyState icon={<MessageCircleQuestion size={20} />} title="No queries yet" />
        </Card>
      )}
    </AppShell>
  );
}
