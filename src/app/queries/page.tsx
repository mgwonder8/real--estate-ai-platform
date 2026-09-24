import { MapPin } from "lucide-react";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { listAllQueries } from "@/lib/data/queries";
import { listStaff } from "@/lib/data/staff";
import { listSites } from "@/lib/data/sites";
import { replyToQueryAction } from "@/app/queries/actions";

export default async function QueriesPage() {
  const session = await auth();
  const [queries, staff, sites] = await Promise.all([listAllQueries(), listStaff(), listSites()]);

  const staffById = Object.fromEntries(staff.map((s) => [s.id, s]));
  const siteById = Object.fromEntries(sites.map((s) => [s.id, s]));

  const open = queries.filter((q) => q.status === "open");
  const answered = queries.filter((q) => q.status === "answered");

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Queries</h1>
        <p className="text-sm text-slate-500">Problems and questions raised by site staff.</p>
      </div>

      <Card className="mb-6">
        <CardHeader
          title="Open"
          action={
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">{open.length}</span>
          }
        />
        <div className="divide-y divide-slate-100">
          {open.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-500">No open queries.</p>}
          {open.map((q) => {
            const raiser = staffById[q.raisedBy];
            return (
              <div key={q.id} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <Avatar name={raiser?.name ?? "?"} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{raiser?.name ?? "Unknown"}</span>
                      {q.siteId && siteById[q.siteId] && ` · ${siteById[q.siteId].name}`} ·{" "}
                      {new Date(q.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-slate-800">{q.message}</p>
                    {q.gpsLat && q.gpsLng && (
                      <a
                        href={`https://maps.google.com/?q=${q.gpsLat},${q.gpsLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-brand-navy hover:underline"
                      >
                        <MapPin size={12} /> View location
                      </a>
                    )}
                    <form action={replyToQueryAction} className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <input type="hidden" name="queryId" value={q.id} />
                      <input
                        name="reply"
                        required
                        placeholder="Type your reply…"
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none"
                      />
                      <Button type="submit" variant="secondary">Reply</Button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Answered"
          action={
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{answered.length}</span>
          }
        />
        <div className="divide-y divide-slate-100">
          {answered.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-500">No answered queries yet.</p>}
          {answered.map((q) => {
            const raiser = staffById[q.raisedBy];
            return (
              <div key={q.id} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <Avatar name={raiser?.name ?? "?"} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{raiser?.name ?? "Unknown"}</span>
                      {q.siteId && siteById[q.siteId] && ` · ${siteById[q.siteId].name}`} ·{" "}
                      {new Date(q.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-slate-800">{q.message}</p>
                    <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <span className="font-medium">Reply:</span> {q.reply}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </AppShell>
  );
}
