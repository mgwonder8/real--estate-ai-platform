"use client";

import Link from "next/link";
import { ArrowUpRight, UserRound, Users } from "lucide-react";
import { TaskCheck } from "@/components/task-check";
import { DueBadge, UrgencyDot } from "@/components/ui/status-pill";
import { toggleTaskDoneAction } from "@/app/(app)/tasks/actions";
import { TONE_META, TONE_ORDER, checkStateOf, nextCheckStatus, serialLabel, taskTone } from "@/lib/task-meta";
import { useT } from "@/lib/i18n/client";
import type { TaskPriority, TaskStatus } from "@/lib/data/types";

export type BoardTask = {
  id: string;
  serial: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string;
  people: string;
  /** Who assigned it, by name. */
  by: string;
  /** Where tapping the card goes; staff cards have no detail page. */
  href?: string;
  /** Whether this viewer may tick it (staff only tick their own). */
  canTick: boolean;
};

export type BoardColumn = {
  siteId: string;
  name: string;
  pct: number;
  open: number;
  late: number;
  tasks: BoardTask[];
  more: number;
  /** Where the column title goes, if anywhere. */
  href?: string;
};

/** One column per site, task cards coloured by priority and progress, like a planning wall. */
export function SiteTaskBoard({ columns, role, seeAllHref = "/sites" }: { columns: BoardColumn[]; role: string; seeAllHref?: string | null }) {
  const t = useT();
  return (
    <section className="mb-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">{t("board.title")}</h2>
          <p className="text-xs text-slate-500">{t("board.sub")}</p>
        </div>
        {seeAllHref && (
          <Link href={seeAllHref} className="-my-2 -mr-2 flex min-h-11 items-center px-2 text-[13px] font-medium text-slate-500 hover:text-brand-navy">
            {t("dash.seeAll")}
          </Link>
        )}
      </div>

      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-3 sm:mx-0 sm:px-0">
        {columns.map((col) => (
          <SiteColumn key={col.siteId} col={col} role={role} />
        ))}
      </div>

      <div className="mt-1 flex flex-wrap gap-1.5">
        {TONE_ORDER.map((tone) => (
          <span key={tone} className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
            <span className={`h-2.5 w-2.5 rounded-[3px] ${TONE_META[tone].swatch}`} />
            {t(`tone.${tone}` as const)}
          </span>
        ))}
      </div>
    </section>
  );
}

function SiteColumn({ col, role }: { col: BoardColumn; role: string }) {
  const t = useT();
  return (
    <div className="flex w-[84vw] max-w-[320px] shrink-0 snap-start flex-col lg:w-auto lg:min-w-72 lg:max-w-none lg:flex-1 rounded-2xl bg-white p-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80 sm:w-72">
      <ColumnHead href={col.href}>
        <span className="flex items-start justify-between gap-2">
          <span className="break-words text-[15px] font-semibold leading-snug text-slate-900">{col.name}</span>
          {col.href && (
            <ArrowUpRight size={16} className="mt-0.5 shrink-0 text-slate-300 transition group-hover:text-brand-navy" aria-label={t("board.openSite")} />
          )}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
          <span className="font-medium text-emerald-700">{t("board.pctDone", { pct: col.pct })}</span>
          {col.open > 0 && <span className="text-slate-500">· {t("sd.openCount", { n: col.open })}</span>}
          {col.late > 0 && <span className="font-medium text-red-600">· {t("in.lateCount", { n: col.late })}</span>}
        </span>
        <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-slate-100">
          <span className="block h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${col.pct}%` }} />
        </span>
      </ColumnHead>

      <div className="space-y-2">
        {col.tasks.length === 0 && (
          <p className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 py-8 text-xs text-slate-400">{t("board.empty")}</p>
        )}
        {col.tasks.map((task) => (
          <BoardCard key={task.id} task={task} role={role} />
        ))}
      </div>

      {col.more > 0 &&
        (col.href ? (
          <Link href={col.href} className="mt-2 flex min-h-10 items-center justify-center rounded-xl text-xs font-semibold text-brand-navy hover:bg-slate-50">
            {t("board.more", { n: col.more })}
          </Link>
        ) : (
          <p className="mt-2 text-center text-xs font-medium text-slate-400">{t("board.more", { n: col.more })}</p>
        ))}
    </div>
  );
}

function BoardCard({ task, role }: { task: BoardTask; role: string }) {
  const t = useT();
  const tone = TONE_META[taskTone(task)];
  const state = checkStateOf(task.status);
  const next = task.canTick ? nextCheckStatus(task.status, role) : null;
  return (
    <div className={`relative flex items-start gap-1 overflow-hidden rounded-xl border py-2 pl-3.5 pr-0.5 transition hover:shadow-sm ${tone.card}`}>
      <span className={`absolute inset-y-0 left-0 w-1 ${tone.edge}`} />
      <CardBody href={task.href}>
        <span className="flex items-start gap-1.5">
          {task.priority === "urgent" && task.status !== "approved" && task.status !== "completed" && (
            <span className="mt-1.5">
              <UrgencyDot priority="urgent" />
            </span>
          )}
          <span className={`line-clamp-2 break-words text-[13.5px] font-semibold leading-snug ${tone.title}`}>{task.title}</span>
        </span>
        {task.people && (
          <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-600">
            <Users size={11} className="shrink-0 text-slate-400" />
            <span className="line-clamp-1 break-words">{task.people}</span>
          </span>
        )}
        {task.by && (
          <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <UserRound size={11} className="shrink-0 text-slate-400" />
            <span className="line-clamp-1 break-words">{t("sb.by", { name: task.by })}</span>
          </span>
        )}
        <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
          <span className="font-mono font-semibold text-slate-400">{serialLabel(task.serial)}</span>
          <DueBadge task={task} />
        </span>
      </CardBody>
      <TaskCheck
        id={task.id}
        state={state}
        next={next ? checkStateOf(next) : null}
        action={toggleTaskDoneAction}
        label={state === "full" ? t("tasks.reopen", { title: task.title }) : t("tasks.markDone", { title: task.title })}
      />
    </div>
  );
}

function ColumnHead({ href, children }: { href?: string; children: React.ReactNode }) {
  const cls = "group mb-2.5 block rounded-xl px-1.5 pt-1";
  return href ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <div className={cls}>{children}</div>
  );
}

function CardBody({ href, children }: { href?: string; children: React.ReactNode }) {
  const cls = "min-w-0 flex-1 py-0.5";
  return href ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <div className={cls}>{children}</div>
  );
}
