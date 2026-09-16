import Link from "next/link";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill, PriorityPill } from "@/components/ui/status-pill";
import { listTasksForAssignee } from "@/lib/data/tasks";
import { getSite } from "@/lib/data/sites";
import { listAllTaskComments } from "@/lib/data/task-comments";
import { listQueriesRaisedBy } from "@/lib/data/queries";
import { updateOwnTaskStatusAction, addOwnTaskCommentAction, raiseQueryAction } from "@/app/site/actions";
import { ProofForm } from "@/app/site/proof-form";
import type { TaskStatus } from "@/lib/data/types";

const TABS: { key: TaskStatus; label: string }[] = [
  { key: "pending", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Awaiting Approval" },
  { key: "approved", label: "Approved" },
];

const nextStatus: Record<TaskStatus, TaskStatus | null> = {
  pending: "in_progress",
  in_progress: "completed",
  completed: null,
  approved: null,
};
const nextLabel: Record<TaskStatus, string> = {
  pending: "Start Task",
  in_progress: "Mark Complete",
  completed: "",
  approved: "",
};

export default async function SiteStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  const { tab } = await searchParams;
  const activeTab = (TABS.find((t) => t.key === tab)?.key ?? "pending") as TaskStatus;

  const [tasks, site, comments, queries] = await Promise.all([
    listTasksForAssignee(session!.user.id),
    session!.user.siteId ? getSite(session!.user.siteId) : Promise.resolve(null),
    listAllTaskComments(),
    listQueriesRaisedBy(session!.user.id),
  ]);

  const commentsByTask = new Map<string, typeof comments>();
  for (const c of comments) {
    commentsByTask.set(c.taskId, [...(commentsByTask.get(c.taskId) ?? []), c]);
  }

  const tabCounts = Object.fromEntries(TABS.map((t) => [t.key, tasks.filter((task) => task.status === t.key).length]));
  const visibleTasks = tasks.filter((t) => t.status === activeTab);

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">My Tasks</h1>
      <p className="mb-4 text-sm text-slate-500">Today&apos;s schedule and instructions.</p>

      {site && (site.briefText || site.briefFileUrl) && (
        <Card className="mb-4 p-4">
          <p className="mb-1 text-xs font-semibold text-brand-navy">Project Brief — {site.name}</p>
          {site.briefText && <p className="text-sm text-slate-700">{site.briefText}</p>}
          {site.briefFileUrl && (
            <a href={site.briefFileUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm text-brand-navy hover:underline">
              📎 {site.briefFileName || "View project brief document"}
            </a>
          )}
        </Card>
      )}

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/site?tab=${t.key}`}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${
              activeTab === t.key ? "bg-white text-brand-navy shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t.label} ({tabCounts[t.key] ?? 0})
          </Link>
        ))}
      </div>

      <div className="space-y-4">
        {visibleTasks.length === 0 && (
          <Card className="p-8 text-center text-sm text-slate-500">Nothing here right now.</Card>
        )}
        {visibleTasks.map((task) => {
          const upcoming = nextStatus[task.status];
          const taskComments = commentsByTask.get(task.id) ?? [];
          return (
            <Card key={task.id} className="p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="font-medium text-slate-900">{task.title}</h3>
                <PriorityPill priority={task.priority} />
                <StatusPill status={task.status} />
              </div>
              <p className="mb-1 text-sm text-slate-500">
                {task.deadline && `Due ${task.deadline}`}
              </p>
              {task.brief && <p className="mb-2 text-sm text-slate-700">{task.brief}</p>}
              {(task.resourceLink || task.resourceFileUrl) && (
                <p className="mb-3 flex flex-wrap gap-3 text-xs">
                  {task.resourceLink && (
                    <a href={task.resourceLink} target="_blank" rel="noopener noreferrer" className="text-brand-navy hover:underline">
                      🔗 Linked resource
                    </a>
                  )}
                  {task.resourceFileUrl && (
                    <a href={task.resourceFileUrl} target="_blank" rel="noopener noreferrer" className="text-brand-navy hover:underline">
                      📎 {task.resourceFileName || "Attached file"}
                    </a>
                  )}
                </p>
              )}
              {task.proofRequired && task.status === "pending" && (
                <p className="mb-3 text-xs font-medium text-amber-700">Photo/video proof required.</p>
              )}

              <div className="space-y-3">
                {(task.status === "pending" || task.status === "in_progress") && <ProofForm taskId={task.id} />}
                {upcoming && (
                  <form action={updateOwnTaskStatusAction}>
                    <input type="hidden" name="taskId" value={task.id} />
                    <input type="hidden" name="toStatus" value={upcoming} />
                    <Button type="submit" className="w-full">{nextLabel[task.status]}</Button>
                  </form>
                )}
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium text-brand-navy">
                  {taskComments.length > 0
                    ? `${taskComments.length} comment${taskComments.length === 1 ? "" : "s"} from the office`
                    : "Comments"}
                </summary>
                <div className="mt-2 space-y-2">
                  {taskComments.map((c) => (
                    <div key={c.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <p className="text-slate-700">{c.message}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {c.authorRole.replace("_", " ")} · {new Date(c.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  <form action={addOwnTaskCommentAction} className="flex gap-2">
                    <input type="hidden" name="taskId" value={task.id} />
                    <input
                      name="message"
                      placeholder="Reply…"
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-navy focus:outline-none"
                    />
                    <button type="submit" className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-300">
                      Send
                    </button>
                  </form>
                </div>
              </details>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Raise a Query</h2>
          <p className="text-sm text-slate-500">Stuck on something, or facing a problem at site? Let the office know.</p>
        </div>
        <form action={raiseQueryAction} className="flex flex-col gap-2 px-5 py-4 sm:flex-row">
          <input
            name="message"
            required
            placeholder="Describe the issue…"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none"
          />
          <Button type="submit">Send</Button>
        </form>
        {queries.length > 0 && (
          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {queries.map((q) => (
              <div key={q.id} className="px-5 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-800">{q.message}</p>
                  <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${q.status === "answered" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                    {q.status === "answered" ? "Answered" : "Open"}
                  </span>
                </div>
                {q.reply && (
                  <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <span className="font-medium">Office reply:</span> {q.reply}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </AppShell>
  );
}
