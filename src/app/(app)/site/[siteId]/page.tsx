import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Eye, FileText, Link2, MapPin, MessageSquare, Paperclip, UserRound, UsersRound } from "lucide-react";
import { auth } from "@/auth";
import { Card, EmptyState } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/page-header";
import { DueBadge, UrgencyDot } from "@/components/ui/status-pill";
import { TaskFiles } from "@/components/task-files";
import { listTasks } from "@/lib/data/tasks";
import { listSites } from "@/lib/data/sites";
import { listAllTaskComments } from "@/lib/data/task-comments";
import { listAllProofs } from "@/lib/data/proofs";
import { listAllTaskReferences } from "@/lib/data/task-references";
import { allSiteIds, getStaff, listStaff, teamViewSites } from "@/lib/data/staff";
import { TONE_META, firstName, isFinished, isOpen, serialLabel, sortByUrgency, taskTone, timeAgo } from "@/lib/task-meta";
import { getT } from "@/lib/i18n/server";
import { addOwnTaskCommentAction } from "@/app/(app)/site/actions";
import { ProofForm } from "@/app/(app)/site/proof-form";
import { CommentBox } from "@/app/(app)/tasks/comment-thread";
import type { Task } from "@/lib/data/types";

const byRecent = (a: Task, b: Task) => b.updatedAt.localeCompare(a.updatedAt);

export default async function StaffSitePage({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { siteId } = await params;
  const { view } = await searchParams;
  const tr = await getT();
  const session = await auth();
  const me = session!.user.id;

  const [meStaff, tasks, sites, comments, allProofs, allRefs, staff] = await Promise.all([
    getStaff(me),
    listTasks(),
    listSites(),
    listAllTaskComments(),
    listAllProofs(),
    listAllTaskReferences(),
    listStaff(),
  ]);

  const mySiteIds = meStaff ? allSiteIds(meStaff) : [session!.user.siteId].filter(Boolean);
  const site = sites.find((s) => s.id === siteId);
  if (!site || !mySiteIds.includes(siteId)) notFound();

  const staffById = Object.fromEntries(staff.map((s) => [s.id, s]));
  const nameOf = (id: string) => (id === me ? tr("common.you") : staffById[id]?.name ?? tr("tasks.assigner.office"));
  const canSeeTeam = meStaff ? teamViewSites(meStaff).includes(siteId) : false;
  const showTeam = view === "team" && canSeeTeam;

  const siteTasks = tasks.filter((t) => t.siteId === siteId);
  const mine = siteTasks.filter((t) => t.assigneeIds.includes(me));
  const team = siteTasks.filter((t) => !t.assigneeIds.includes(me));
  const openMine = sortByUrgency(mine.filter(isOpen));
  const waitingMine = mine.filter((t) => t.status === "completed").sort(byRecent);
  const approvedMine = mine.filter((t) => t.status === "approved").sort(byRecent);

  function renderTask(task: Task, own: boolean) {
    const tone = TONE_META[taskTone(task)];
    const others = task.assigneeIds.filter((id) => id !== me);
    const taskComments = comments.filter((c) => c.taskId === task.id);
    const references = [
      ...(task.resourceFileUrl
        ? [{ url: task.resourceFileUrl, name: task.resourceFileName || tr("tf.refFile"), type: "", by: nameOf(task.createdBy), at: task.createdAt }]
        : []),
      ...allRefs
        .filter((r) => r.taskId === task.id)
        .map((r) => ({ url: r.url, name: r.name, type: r.type, by: nameOf(r.uploadedBy), at: r.createdAt, viaChat: r.source === "chat" })),
    ];
    const proofs = allProofs
      .filter((p) => p.taskId === task.id)
      .map((p) => ({ photoUrl: p.photoUrl, videoUrl: p.videoUrl, by: nameOf(p.submittedBy), at: p.submittedAt, notes: p.notes, lat: p.gpsLat, lng: p.gpsLng }));
    const people = own
      ? others.length
        ? [tr("common.you"), ...others.map((id) => firstName(staffById[id]?.name))].join(", ")
        : ""
      : task.assigneeIds.map((id) => firstName(staffById[id]?.name)).join(", ");

    return (
      <div key={task.id} className={`relative overflow-hidden rounded-2xl border ${tone.card}`}>
        <span className={`absolute inset-y-0 left-0 w-1.5 ${tone.edge}`} />
        <details className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-start gap-2 py-3.5 pl-5 pr-4 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 flex-1">
              <span className="flex items-start gap-2">
                {task.priority === "urgent" && isOpen(task) && (
                  <span className="mt-1.5">
                    <UrgencyDot priority="urgent" />
                  </span>
                )}
                <span className={`break-words text-base font-semibold leading-snug ${tone.title}`}>{task.title}</span>
              </span>
              {task.brief && <span className="mt-1 line-clamp-2 block break-words text-sm text-slate-600">{task.brief}</span>}
              <span className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
                <span className="font-mono font-semibold text-slate-400">{serialLabel(task.serial)}</span>
                <DueBadge task={task} />
                <span className="inline-flex items-center gap-1">
                  <UserRound size={11} className="text-slate-400" /> {tr("sb.by", { name: nameOf(task.createdBy) })}
                </span>
                {people && <span className="break-words">{people}</span>}
                {taskComments.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare size={11} /> {taskComments.length}
                  </span>
                )}
              </span>
            </span>
            <span className="mt-1 shrink-0 text-xs font-medium text-brand-navy group-open:hidden">{tr("ss.details")}</span>
          </summary>

          <div className="space-y-4 border-t border-black/5 bg-white/60 px-5 pb-4 pt-4">
            {task.brief && <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{task.brief}</p>}

            {!own && (
              <p className="flex items-start gap-2 rounded-xl bg-white px-3 py-2.5 text-xs text-slate-500 ring-1 ring-slate-200">
                <Eye size={14} className="mt-px shrink-0 text-slate-400" />
                {tr("ss.viewOnly", { names: task.assigneeIds.map((id) => firstName(staffById[id]?.name)).join(` ${tr("ss.or")} `) })}
              </p>
            )}

            {task.resourceLink && (
              <a
                href={task.resourceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-white px-3 text-sm text-brand-navy ring-1 ring-slate-200"
              >
                <Link2 size={14} /> {tr("td.openLink")}
              </a>
            )}

            <TaskFiles
              compact
              references={references}
              proofs={proofs}
              referenceTitle={tr("ss.fromOffice")}
              proofTitle={own ? tr("ss.yourProof") : tr("td.proofFromSite")}
            />

            {own && (
              <div className="border-t border-slate-200/70 pt-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <MessageSquare size={13} /> {tr("ss.msgsOffice")}
                </p>
                <div className="space-y-2">
                  {taskComments.map((c) => {
                    const mineMsg = c.authorId === me;
                    return (
                      <div key={c.id} className={`flex ${mineMsg ? "justify-end" : ""}`}>
                        <p
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                            mineMsg ? "rounded-br-sm bg-brand-navy text-white" : "rounded-bl-sm bg-white text-slate-800 ring-1 ring-slate-200"
                          }`}
                        >
                          {c.message}
                          <span className={`mt-0.5 block text-[10px] ${mineMsg ? "text-slate-300" : "text-slate-400"}`}>{timeAgo(c.createdAt, tr)}</span>
                        </p>
                      </div>
                    );
                  })}
                  <CommentBox taskId={task.id} action={addOwnTaskCommentAction} placeholder={tr("ss.msgOffice")} />
                </div>
              </div>
            )}
          </div>
        </details>

        {own && isOpen(task) && (
          <div className="px-4 pb-4 pl-5">
            <ProofForm taskId={task.id} required={task.proofRequired} />
          </div>
        )}
        {own && task.status === "completed" && (
          <p className="mx-4 mb-4 ml-5 flex min-h-11 items-center gap-2 rounded-xl bg-sky-100 px-3.5 text-sm font-semibold text-sky-900">
            <Clock size={16} /> {tr("status.completed")}
          </p>
        )}
        {own && task.status === "approved" && (
          <p className="mx-4 mb-4 ml-5 flex min-h-11 items-center gap-2 rounded-xl bg-emerald-100 px-3.5 text-sm font-semibold text-emerald-900">
            <CheckCircle2 size={16} /> {tr("status.approved")}
          </p>
        )}
      </div>
    );
  }

  const tab = (href: string, active: boolean, label: React.ReactNode, count: number) => (
    <Link
      href={href}
      replace
      className={`flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition ${
        active ? "bg-brand-navy text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
      }`}
    >
      {label}
      <span className={`rounded-md px-1.5 text-xs ${active ? "bg-white/15" : "bg-slate-100"}`}>{count}</span>
    </Link>
  );

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back="/site"
        title={site.name}
        subtitle={
          site.address && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={13} /> {site.address}
            </span>
          )
        }
      />

      {canSeeTeam && (
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-white p-1.5 ring-1 ring-slate-200/80">
          {tab(`/site/${siteId}`, !showTeam, tr("nav.myTasks"), openMine.length)}
          {tab(
            `/site/${siteId}?view=team`,
            showTeam,
            <>
              <UsersRound size={15} /> {tr("nav.team")}
            </>,
            team.filter(isOpen).length
          )}
        </div>
      )}

      {!showTeam ? (
        <div className="space-y-6">
          <section className="space-y-3">
            <SectionTitle label={tr("ss.todo")} count={openMine.length} />
            {openMine.length === 0 ? (
              <Card>
                <EmptyState icon={<CheckCircle2 size={20} className="text-emerald-500" />} title={tr("ss.caughtUp")} />
              </Card>
            ) : (
              openMine.map((task) => renderTask(task, true))
            )}
          </section>

          {waitingMine.length > 0 && (
            <section className="space-y-3">
              <SectionTitle label={tr("status.completed")} count={waitingMine.length} tone="text-sky-700" />
              {waitingMine.map((task) => renderTask(task, true))}
            </section>
          )}

          {approvedMine.length > 0 && (
            <section className="space-y-3">
              <SectionTitle label={tr("ss.finished")} count={approvedMine.length} tone="text-emerald-600" />
              {approvedMine.map((task) => renderTask(task, true))}
            </section>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {team.length === 0 ? (
            <Card>
              <EmptyState icon={<UsersRound size={20} />} title={tr("ss.noOther")} />
            </Card>
          ) : (
            Array.from(new Set(team.flatMap((t) => t.assigneeIds)))
              .filter((pid) => pid !== me)
              .map((pid) => {
                const theirsAll = team.filter((t) => t.assigneeIds.includes(pid));
                const theirs = [...sortByUrgency(theirsAll.filter(isOpen)), ...theirsAll.filter(isFinished).sort(byRecent)];
                const name = staffById[pid]?.name ?? tr("common.unknown");
                return (
                  <section key={pid} className="space-y-3">
                    <div className="flex items-center gap-2.5 px-1">
                      <Avatar name={name} size="sm" />
                      <span className="min-w-0 flex-1 break-words text-sm font-semibold text-slate-900">{name}</span>
                      <span className="shrink-0 text-xs font-medium text-slate-500">
                        {tr("grp.counts", { open: theirs.filter(isOpen).length, done: theirs.filter(isFinished).length })}
                      </span>
                    </div>
                    {theirs.map((task) => renderTask(task, false))}
                  </section>
                );
              })
          )}
        </div>
      )}

      {(site.briefText || site.briefFileUrl) && (
        <Card className="mt-8 p-4 sm:p-5">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <FileText size={15} /> {tr("ss.brief")}
          </p>
          {site.briefText && <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{site.briefText}</p>}
          {site.briefFileUrl && (
            <a
              href={site.briefFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-sm text-brand-navy hover:underline"
            >
              <Paperclip size={14} /> {site.briefFileName || tr("ss.document")}
            </a>
          )}
        </Card>
      )}
    </div>
  );
}

function SectionTitle({ label, count, tone = "text-slate-500" }: { label: string; count: number; tone?: string }) {
  return (
    <p className={`flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider ${tone}`}>
      {label}
      <span className="rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold normal-case tracking-normal text-slate-500 ring-1 ring-slate-200">{count}</span>
    </p>
  );
}
