import Link from "next/link";
import { Check, FileText, Link2, MessageSquare, Paperclip, Play } from "lucide-react";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card, EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DueBadge, PriorityPill } from "@/components/ui/status-pill";
import { listTasksForAssignee } from "@/lib/data/tasks";
import { getSite } from "@/lib/data/sites";
import { listAllTaskComments } from "@/lib/data/task-comments";
import { listQueriesRaisedBy } from "@/lib/data/queries";
import { STATUS_META, firstName, sortByUrgency, timeAgo } from "@/lib/task-meta";
import { updateOwnTaskStatusAction, addOwnTaskCommentAction } from "@/app/site/actions";
import { ProofForm } from "@/app/site/proof-form";
import { RaiseQueryForm } from "@/app/site/raise-query-form";
import { CommentBox } from "@/app/tasks/comment-thread";
import type { TaskStatus } from "@/lib/data/types";

const TABS: TaskStatus[] = ["pending", "in_progress", "completed", "approved"];

export default async function SiteStaffPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await auth();
  const { tab } = await searchParams;

  const [tasks, site, comments, queries] = await Promise.all([
    listTasksForAssignee(session!.user.id),
    session!.user.siteId ? getSite(session!.user.siteId) : Promise.resolve(null),
    listAllTaskComments(),
    listQueriesRaisedBy(session!.user.id),
  ]);

  const counts = Object.fromEntries(TABS.map((s) => [s, tasks.filter((t) => t.status === s).length])) as Record<TaskStatus, number>;
  const defaultTab = counts.in_progress ? "in_progress" : "pending";
  const activeTab = (TABS.find((t) => t === tab) ?? defaultTab) as TaskStatus;
  const visible = sortByUrgency(tasks.filter((t) => t.status === activeTab));

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Hi {firstName(session!.user.name)}</h1>
          {site && <p className="mt-0.5 text-sm text-slate-500">{site.name}</p>}
        </div>

        <div className="mb-5 grid grid-cols-4 gap-1.5 rounded-2xl bg-white p-1.5 ring-1 ring-slate-200/80">
          {TABS.map((s) => {
            const on = activeTab === s;
            return (
              <Link
                key={s}
                href={`/site?tab=${s}`}
                className={`flex flex-col items-center rounded-xl py-2 transition ${on ? "bg-brand-navy text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
              >
                <span className="text-lg font-semibold leading-tight">{counts[s]}</span>
                <span className="text-[11px] font-medium">{STATUS_META[s].short}</span>
              </Link>
            );
          })}
        </div>

        <div className="space-y-4">
          {visible.length === 0 && (
            <Card>
              <EmptyState icon={<Check size={20} className="text-emerald-500" />} title="Nothing here" />
            </Card>
          )}
          {visible.map((task) => {
            const taskComments = comments.filter((c) => c.taskId === task.id);
            const canWork = task.status === "pending" || task.status === "in_progress";
            return (
              <Card key={task.id} className="overflow-hidden">
                <div className={`h-1 ${STATUS_META[task.status].bar}`} />
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-slate-900">{task.title}</h3>
                    <DueBadge task={task} />
                  </div>
                  {task.priority === "urgent" && (
                    <div className="mt-1.5">
                      <PriorityPill priority="urgent" />
                    </div>
                  )}
                  {task.brief && <p className="mt-2 text-sm leading-relaxed text-slate-600">{task.brief}</p>}
                  {(task.resourceLink || task.resourceFileUrl) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {task.resourceLink && (
                        <a href={task.resourceLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-brand-navy ring-1 ring-slate-200">
                          <Link2 size={14} /> Link
                        </a>
                      )}
                      {task.resourceFileUrl && (
                        <a href={task.resourceFileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-brand-navy ring-1 ring-slate-200">
                          <Paperclip size={14} /> {task.resourceFileName || "File"}
                        </a>
                      )}
                    </div>
                  )}

                  {canWork && (
                    <div className="mt-4 space-y-3">
                      {task.status === "in_progress" && <ProofForm taskId={task.id} required={task.proofRequired} />}
                      <form action={updateOwnTaskStatusAction}>
                        <input type="hidden" name="taskId" value={task.id} />
                        <input type="hidden" name="toStatus" value={task.status === "pending" ? "in_progress" : "completed"} />
                        <Button type="submit" size="lg" className="w-full">
                          {task.status === "pending" ? <><Play size={16} /> Start</> : <><Check size={16} /> Mark done</>}
                        </Button>
                      </form>
                    </div>
                  )}

                  <details className="group mt-4 border-t border-slate-100 pt-3">
                    <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-slate-500">
                      <MessageSquare size={15} />
                      {taskComments.length > 0 ? `${taskComments.length} messages` : "Message office"}
                    </summary>
                    <div className="mt-3 space-y-2">
                      {taskComments.map((c) => {
                        const mine = c.authorId === session!.user.id;
                        return (
                          <div key={c.id} className={`flex ${mine ? "justify-end" : ""}`}>
                            <p className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "rounded-br-sm bg-brand-navy text-white" : "rounded-bl-sm bg-slate-100 text-slate-800"}`}>
                              {c.message}
                              <span className={`mt-0.5 block text-[10px] ${mine ? "text-slate-300" : "text-slate-400"}`}>{timeAgo(c.createdAt)}</span>
                            </p>
                          </div>
                        );
                      })}
                      <CommentBox taskId={task.id} action={addOwnTaskCommentAction} />
                    </div>
                  </details>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8 p-4 sm:p-5">
          <p className="mb-3 text-sm font-semibold text-slate-900">Need help? Ask the office</p>
          <RaiseQueryForm />
          {queries.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
              {queries.map((q) => (
                <div key={q.id} className="text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-slate-800">{q.message}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${q.status === "answered" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {q.status === "answered" ? "Replied" : "Sent"}
                    </span>
                  </div>
                  {q.reply && <p className="mt-1.5 rounded-xl bg-emerald-50/60 px-3 py-2 text-slate-700">{q.reply}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>

        {site && (site.briefText || site.briefFileUrl) && (
          <Card className="mt-4 p-4 sm:p-5">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <FileText size={15} /> Project brief
            </p>
            {site.briefText && <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{site.briefText}</p>}
            {site.briefFileUrl && (
              <a href={site.briefFileUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm text-brand-navy hover:underline">
                <Paperclip size={14} /> {site.briefFileName || "Document"}
              </a>
            )}
          </Card>
        )}
      </div>
    </AppShell>
  );
}
