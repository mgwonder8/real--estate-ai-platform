import Link from "next/link";
import { CheckCircle2, Eye, FileText, Link2, MessageSquare, Paperclip, UsersRound } from "lucide-react";
import { auth } from "@/auth";
import { Card, EmptyState } from "@/components/ui/card";
import { ExpandableTask } from "@/components/expandable-task";
import { TaskCheck, checkStateOf } from "@/components/task-check";
import { TaskFiles } from "@/components/task-files";
import { listTasks } from "@/lib/data/tasks";
import { listSites } from "@/lib/data/sites";
import { listAllTaskComments } from "@/lib/data/task-comments";
import { listAllProofs } from "@/lib/data/proofs";
import { listAllTaskReferences } from "@/lib/data/task-references";
import { allSiteIds, getStaff, listStaff, teamViewSites } from "@/lib/data/staff";
import { listQueriesRaisedBy } from "@/lib/data/queries";
import { firstName, isFinished, isOpen, nextCheckStatus, serialLabel, sortByUrgency, timeAgo } from "@/lib/task-meta";
import { assignerName } from "@/lib/roles";
import { greetingIST, greetingName } from "@/lib/greeting";
import { toggleTaskDoneAction } from "@/app/(app)/tasks/actions";
import { addOwnTaskCommentAction } from "@/app/(app)/site/actions";
import { ProofForm } from "@/app/(app)/site/proof-form";
import { RaiseQueryForm } from "@/app/(app)/site/raise-query-form";
import { CommentBox } from "@/app/(app)/tasks/comment-thread";
import type { Task } from "@/lib/data/types";

const byRecent = (a: Task, b: Task) => b.updatedAt.localeCompare(a.updatedAt);

export default async function SiteStaffPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const session = await auth();
  const me = session!.user.id;
  const { view } = await searchParams;

  const [meStaff, tasks, sites, comments, allProofs, allRefs, staff, queries] = await Promise.all([
    getStaff(me),
    listTasks(),
    listSites(),
    listAllTaskComments(),
    listAllProofs(),
    listAllTaskReferences(),
    listStaff(),
    listQueriesRaisedBy(me),
  ]);

  const staffById = Object.fromEntries(staff.map((s) => [s.id, s]));
  const siteById = Object.fromEntries(sites.map((s) => [s.id, s]));
  const nameOf = (id: string) => (id === me ? "You" : staffById[id]?.name ?? "Office");
  const byLabel = (id: string) => (id === me ? "You" : assignerName(staffById[id]));

  const mySiteIds = meStaff ? allSiteIds(meStaff) : [session!.user.siteId].filter(Boolean);
  const teamSiteIds = meStaff ? teamViewSites(meStaff) : [];
  const multiSite = mySiteIds.length > 1;

  const mine = tasks.filter((t) => t.assigneeIds.includes(me));
  const team = tasks.filter((t) => teamSiteIds.includes(t.siteId) && !t.assigneeIds.includes(me));
  const showTeam = view === "team" && teamSiteIds.length > 0;

  const openMine = sortByUrgency(mine.filter(isOpen));
  const doneMine = mine.filter(isFinished).sort(byRecent);

  function renderTask(t: Task, own: boolean) {
    const state = checkStateOf(t.status);
    const next = own ? nextCheckStatus(t.status, "site_staff") : null;
    const others = t.assigneeIds.filter((id) => id !== me);
    const taskComments = comments.filter((c) => c.taskId === t.id);
    const references = [
      ...(t.resourceFileUrl
        ? [{ url: t.resourceFileUrl, name: t.resourceFileName || "Reference file", type: "", by: nameOf(t.createdBy), at: t.createdAt }]
        : []),
      ...allRefs
        .filter((r) => r.taskId === t.id)
        .map((r) => ({ url: r.url, name: r.name, type: r.type, by: nameOf(r.uploadedBy), at: r.createdAt, viaChat: r.source === "chat" })),
    ];
    const proofs = allProofs
      .filter((p) => p.taskId === t.id)
      .map((p) => ({ photoUrl: p.photoUrl, videoUrl: p.videoUrl, by: nameOf(p.submittedBy), at: p.submittedAt, notes: p.notes, lat: p.gpsLat, lng: p.gpsLng }));

    return (
      <ExpandableTask
        key={t.id}
        serial={serialLabel(t.serial)}
        title={t.title}
        remark={t.brief}
        priority={t.priority}
        state={state}
        due={t}
        siteName={own ? (multiSite ? siteById[t.siteId]?.name : undefined) : undefined}
        byName={byLabel(t.createdBy)}
        toNames={own ? (others.length ? ["You", ...others.map((id) => firstName(staffById[id]?.name))] : undefined) : t.assigneeIds.map((id) => staffById[id]?.name ?? "?")}
        extra={
          taskComments.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-slate-400">
              <MessageSquare size={11} /> {taskComments.length}
            </span>
          ) : undefined
        }
        check={
          <TaskCheck
            id={t.id}
            state={state}
            next={next ? checkStateOf(next) : null}
            action={toggleTaskDoneAction}
            label={state === "none" ? `Mark ${t.title} as done` : `Undo done for ${t.title}`}
          />
        }
      >
        <div className="space-y-4">
          {t.brief && <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{t.brief}</p>}

          {!own && (
            <p className="flex items-start gap-2 rounded-xl bg-white px-3 py-2.5 text-xs text-slate-500 ring-1 ring-slate-200">
              <Eye size={14} className="mt-px shrink-0 text-slate-400" />
              You can see this task. Only {t.assigneeIds.map((id) => firstName(staffById[id]?.name)).join(" or ")} can tick it off.
            </p>
          )}

          {t.resourceLink && (
            <a
              href={t.resourceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm text-brand-navy ring-1 ring-slate-200"
            >
              <Link2 size={14} /> Open link
            </a>
          )}

          <TaskFiles
            compact
            references={references}
            proofs={proofs}
            referenceTitle="From the office"
            proofTitle={own ? "Your proof" : "Proof from site"}
          />

          {own && isOpen(t) && <ProofForm taskId={t.id} required={t.proofRequired} />}

          {own && (
            <div className="border-t border-slate-200/70 pt-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <MessageSquare size={13} /> Messages with the office
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
                        <span className={`mt-0.5 block text-[10px] ${mineMsg ? "text-slate-300" : "text-slate-400"}`}>{timeAgo(c.createdAt)}</span>
                      </p>
                    </div>
                  );
                })}
                <CommentBox taskId={t.id} action={addOwnTaskCommentAction} placeholder="Message the office" />
              </div>
            </div>
          )}
        </div>
      </ExpandableTask>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {greetingIST()}, {greetingName(session!.user.name)}
        </h1>
        {mySiteIds.length > 0 && (
          <p className="mt-0.5 text-sm text-slate-500">{mySiteIds.map((id) => siteById[id]?.name).filter(Boolean).join(" · ")}</p>
        )}
      </div>

      {teamSiteIds.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-white p-1.5 ring-1 ring-slate-200/80">
          <Link
            href="/site"
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition ${
              !showTeam ? "bg-brand-navy text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            My tasks
            <span className={`rounded-md px-1.5 text-xs ${!showTeam ? "bg-white/15" : "bg-slate-100"}`}>{openMine.length}</span>
          </Link>
          <Link
            href="/site?view=team"
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition ${
              showTeam ? "bg-brand-navy text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <UsersRound size={15} /> Team
            <span className={`rounded-md px-1.5 text-xs ${showTeam ? "bg-white/15" : "bg-slate-100"}`}>{team.filter(isOpen).length}</span>
          </Link>
        </div>
      )}

      {!showTeam ? (
        <div className="space-y-6">
          <section>
            <SectionTitle label="To do" count={openMine.length} />
            <Card className="overflow-hidden">
              {openMine.length === 0 ? (
                <EmptyState icon={<CheckCircle2 size={20} className="text-emerald-500" />} title="All caught up" />
              ) : (
                <div className="divide-y divide-slate-100">{openMine.map((t) => renderTask(t, true))}</div>
              )}
            </Card>
          </section>

          {doneMine.length > 0 && (
            <section>
              <SectionTitle label="Finished" count={doneMine.length} tone="text-emerald-600" />
              <Card className="overflow-hidden">
                <div className="divide-y divide-emerald-100">{doneMine.map((t) => renderTask(t, true))}</div>
              </Card>
            </section>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {teamSiteIds.map((siteId) => {
            const siteTasks = team.filter((t) => t.siteId === siteId);
            const ordered = [...sortByUrgency(siteTasks.filter(isOpen)), ...siteTasks.filter(isFinished).sort(byRecent)];
            return (
              <section key={siteId}>
                <SectionTitle label={siteById[siteId]?.name ?? "Site"} count={siteTasks.filter(isOpen).length} suffix="open" />
                <Card className="overflow-hidden">
                  {ordered.length === 0 ? (
                    <EmptyState icon={<UsersRound size={20} />} title="No other tasks on this site" />
                  ) : (
                    <div className="divide-y divide-slate-100">{ordered.map((t) => renderTask(t, false))}</div>
                  )}
                </Card>
              </section>
            );
          })}
        </div>
      )}

      <Card className="mt-8 p-4 sm:p-5">
        <p className="mb-3 text-sm font-semibold text-slate-900">Need help? Ask the office</p>
        <RaiseQueryForm />
        {queries.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
            {queries.map((q) => (
              <div key={q.id} className="text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-slate-800">{q.message}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      q.status === "answered" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {q.status === "answered" ? "Replied" : "Sent"}
                  </span>
                </div>
                {q.reply && <p className="mt-1.5 rounded-xl bg-emerald-50/60 px-3 py-2 text-slate-700">{q.reply}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {mySiteIds
        .map((id) => siteById[id])
        .filter((site) => site && (site.briefText || site.briefFileUrl))
        .map((site) => (
          <Card key={site.id} className="mt-4 p-4 sm:p-5">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <FileText size={15} /> {multiSite ? `${site.name} brief` : "Project brief"}
            </p>
            {site.briefText && <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{site.briefText}</p>}
            {site.briefFileUrl && (
              <a
                href={site.briefFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm text-brand-navy hover:underline"
              >
                <Paperclip size={14} /> {site.briefFileName || "Document"}
              </a>
            )}
          </Card>
        ))}
    </div>
  );
}

function SectionTitle({ label, count, tone = "text-slate-500", suffix }: { label: string; count: number; tone?: string; suffix?: string }) {
  return (
    <p className={`mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider ${tone}`}>
      {label}
      <span className="rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold normal-case tracking-normal text-slate-500 ring-1 ring-slate-200">
        {count}
        {suffix ? ` ${suffix}` : ""}
      </span>
    </p>
  );
}
