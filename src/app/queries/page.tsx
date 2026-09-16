import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
        <CardHeader title={`Open (${open.length})`} />
        <div className="divide-y divide-slate-100">
          {open.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-500">No open queries.</p>}
          {open.map((q) => (
            <div key={q.id} className="px-5 py-4">
              <p className="text-sm text-slate-500">
                {staffById[q.raisedBy]?.name ?? "Unknown"}
                {q.siteId && siteById[q.siteId] && ` · ${siteById[q.siteId].name}`} ·{" "}
                {new Date(q.createdAt).toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-slate-800">{q.message}</p>
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
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title={`Answered (${answered.length})`} />
        <div className="divide-y divide-slate-100">
          {answered.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-500">No answered queries yet.</p>}
          {answered.map((q) => (
            <div key={q.id} className="px-5 py-4">
              <p className="text-sm text-slate-500">
                {staffById[q.raisedBy]?.name ?? "Unknown"}
                {q.siteId && siteById[q.siteId] && ` · ${siteById[q.siteId].name}`} ·{" "}
                {new Date(q.createdAt).toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-slate-800">{q.message}</p>
              <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span className="font-medium">Reply:</span> {q.reply}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
