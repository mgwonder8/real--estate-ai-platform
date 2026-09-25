import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, CalendarDays, Camera, Check, Link2, MapPin, Paperclip, Play, UserRound } from "lucide-react";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { DueBadge, PriorityPill, StatusPill } from "@/components/ui/status-pill";
import { getTask } from "@/lib/data/tasks";
import { listSites } from "@/lib/data/sites";
import { listStaff } from "@/lib/data/staff";
import { listProofsForTask } from "@/lib/data/proofs";
import { listCommentsForTask } from "@/lib/data/task-comments";
import { listTaskUpdatesForTask } from "@/lib/data/task-updates";
import { STATUS_META, STATUS_ORDER, formatDate, timeAgo } from "@/lib/task-meta";
import { updateTaskStatusAction } from "@/app/tasks/actions";
import { TaskReviewForm } from "@/app/tasks/task-review-form";
import { CommentBox } from "@/app/tasks/comment-thread";
import type { TaskStatus } from "@/lib/data/types";

type TimelineItem =
  | { kind: "comment"; at: string; who: string; text: string }
  | { kind: "status"; at: string; who: string; to: TaskStatus }
  | { kind: "proof"; at: string; who: string; text: string; photo: string; lat: string; lng: string };

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const [task, sites, staff, proofs, comments, updates] = await Promise.all([
    getTask(id),
    listSites(),
    listStaff(),
    listProofsForTask(id),
    listCommentsForTask(id),
    listTaskUpdatesForTask(id),
  ]);
  if (!task) notFound();

  const staffById = Object.fromEntries(staff.map((s) => [s.id, s]));
  const site = sites.find((s) => s.id === task.siteId);
  const nameOf = (sid: string) => staffById[sid]?.name ?? "Someone";

  const timeline: TimelineItem[] = [
    ...comments.map((c) => ({ kind: "comment" as const, at: c.createdAt, who: c.authorId, text: c.message })),
    ...updates.map((u) => ({ kind: "status" as const, at: u.changedAt, who: u.changedBy, to: u.toStatus as TaskStatus })),
    ...proofs.map((p) => ({
      kind: "proof" as const,
      at: p.submittedAt,
      who: p.submittedBy,
      text: p.notes,
      photo: p.photoUrl,
      lat: p.gpsLat,
      lng: p.gpsLng,
    })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  const stepIndex = STATUS_ORDER.indexOf(task.status);

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <PageHeader
        back={site ? `/tasks?site=${site.id}` : "/tasks"}
        title={task.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2 pt-1">
            <StatusPill status={task.status} />
            <PriorityPill priority={task.priority} />
            <DueBadge task={task} />
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="p-5">
            <ol className="flex items-center">
              {STATUS_ORDER.map((s, i) => {
                const done = i < stepIndex || task.status === "approved";
                const current = i === stepIndex && task.status !== "approved";
                return (
                  <li key={s} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${
                          done
                            ? "bg-emerald-500 text-white"
                            : current
                              ? `${STATUS_META[s].dot} text-white ring-4 ring-slate-100`
                              : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {done ? <Check size={15} strokeWidth={3} /> : i + 1}
                      </span>
                      <span className={`whitespace-nowrap text-[11px] font-medium ${current || done ? "text-slate-800" : "text-slate-400"}`}>
                        {STATUS_META[s].short}
                      </span>
                    </div>
                    {i < STATUS_ORDER.length - 1 && (
                      <span className={`mx-1 mb-5 h-0.5 flex-1 rounded-full ${i < stepIndex ? "bg-emerald-500" : "bg-slate-100"}`} />
                    )}
                  </li>
                );
              })}
            </ol>

            {(task.status === "pending" || task.status === "in_progress") && (
              <form action={updateTaskStatusAction} className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                <input type="hidden" name="taskId" value={task.id} />
                <input type="hidden" name="toStatus" value={task.status === "pending" ? "in_progress" : "completed"} />
                <p className="text-sm text-slate-600">
                  {task.status === "pending" ? "Not started yet." : "Work is underway."}
                </p>
                <Button type="submit" variant="secondary">
                  {task.status === "pending" ? <><Play size={15} /> Mark started</> : <><Check size={15} /> Mark done</>}
                </Button>
              </form>
            )}

            {task.status === "completed" && (
              <div className="mt-5">
                <TaskReviewForm taskId={task.id} />
              </div>
            )}

            {task.status === "approved" && (
              <p className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
                <Check size={16} /> Approved{task.approvedBy && ` by ${nameOf(task.approvedBy)}`}
                {task.approvedAt && <span className="text-emerald-600">· {timeAgo(task.approvedAt)}</span>}
              </p>
            )}
          </Card>

          {(task.brief || task.resourceLink || task.resourceFileUrl) && (
            <Card className="p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Details</p>
              {task.brief && <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-700">{task.brief}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {task.resourceLink && (
                  <a href={task.resourceLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-brand-navy ring-1 ring-slate-200 hover:bg-slate-100">
                    <Link2 size={14} /> Open link
                  </a>
                )}
                {task.resourceFileUrl && (
                  <a href={task.resourceFileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-brand-navy ring-1 ring-slate-200 hover:bg-slate-100">
                    <Paperclip size={14} /> {task.resourceFileName || "File"}
                  </a>
                )}
              </div>
            </Card>
          )}

          <Card className="p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Activity</p>
            <ol className="space-y-4">
              <TimelineRow icon={<Avatar name={nameOf(task.createdBy)} size="xs" />} at={task.createdAt}>
                <b className="font-medium text-slate-900">{nameOf(task.createdBy)}</b> created this task
              </TimelineRow>
              {timeline.map((item, i) => {
                if (item.kind === "status") {
                  return (
                    <TimelineRow key={i} icon={<span className={`h-2.5 w-2.5 rounded-full ${STATUS_META[item.to]?.dot ?? "bg-slate-300"}`} />} at={item.at}>
                      <b className="font-medium text-slate-900">{nameOf(item.who)}</b> moved it to{" "}
                      <span className={`font-medium ${STATUS_META[item.to]?.text ?? ""}`}>{STATUS_META[item.to]?.label ?? item.to}</span>
                    </TimelineRow>
                  );
                }
                if (item.kind === "proof") {
                  return (
                    <TimelineRow key={i} icon={<Camera size={13} className="text-violet-600" />} at={item.at}>
                      <b className="font-medium text-slate-900">{nameOf(item.who)}</b> sent proof
                      <div className="mt-2 flex gap-3 rounded-xl bg-slate-50 p-2.5">
                        {item.photo && (
                          <a href={item.photo} target="_blank" rel="noopener noreferrer" className="shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.photo} alt="Proof" className="h-20 w-20 rounded-lg object-cover ring-1 ring-slate-200" />
                          </a>
                        )}
                        <div className="min-w-0 text-sm">
                          {item.text && <p className="text-slate-700">{item.text}</p>}
                          {item.lat && item.lng && (
                            <a
                              href={`https://maps.google.com/?q=${item.lat},${item.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-xs text-brand-navy hover:underline"
                            >
                              <MapPin size={12} /> Location
                            </a>
                          )}
                        </div>
                      </div>
                    </TimelineRow>
                  );
                }
                const mine = item.who === session!.user.id;
                return (
                  <TimelineRow key={i} icon={<Avatar name={nameOf(item.who)} size="xs" />} at={item.at}>
                    <b className="font-medium text-slate-900">{mine ? "You" : nameOf(item.who)}</b>
                    <p className={`mt-1.5 inline-block rounded-2xl rounded-tl-sm px-3.5 py-2 text-sm ${mine ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-800"}`}>
                      {item.text}
                    </p>
                  </TimelineRow>
                );
              })}
            </ol>
            <div className="mt-5 border-t border-slate-100 pt-4">
              <CommentBox taskId={task.id} />
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="divide-y divide-slate-100">
            {site && (
              <Link href={`/sites/${site.id}`} className="flex items-center gap-3 p-4 transition hover:bg-slate-50">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-navy text-brand-gold">
                  <Building2 size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs text-slate-400">Site</span>
                  <span className="block truncate text-sm font-semibold text-slate-900">{site.name}</span>
                </span>
              </Link>
            )}
            <div className="p-4">
              <p className="mb-2.5 text-xs text-slate-400">Assigned to</p>
              <div className="space-y-2.5">
                {task.assigneeIds.map((aid) => (
                  <Link key={aid} href={`/tasks?staff=${aid}`} className="flex items-center gap-2.5 rounded-lg hover:opacity-80">
                    <Avatar name={nameOf(aid)} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-800">{nameOf(aid)}</span>
                      {staffById[aid]?.phone && <span className="block text-xs text-slate-400">{staffById[aid].phone}</span>}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            <InfoRow icon={<CalendarDays size={15} />} label="Due" value={task.deadline ? formatDate(task.deadline) : "No date"} />
            <InfoRow icon={<UserRound size={15} />} label="Created by" value={nameOf(task.createdBy)} />
            <InfoRow icon={<Camera size={15} />} label="Photo proof" value={task.proofRequired ? "Required" : "Optional"} />
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function TimelineRow({ icon, at, children }: { icon: React.ReactNode; at: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-50 ring-1 ring-slate-100">{icon}</span>
      <div className="min-w-0 flex-1 text-sm text-slate-600">
        <div className="flex items-baseline justify-between gap-2">
          <div className="min-w-0">{children}</div>
          <span className="shrink-0 text-xs text-slate-400">{timeAgo(at)}</span>
        </div>
      </div>
    </li>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
      <span className="flex items-center gap-2 text-slate-500">
        {icon}
        {label}
      </span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
