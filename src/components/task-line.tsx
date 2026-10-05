"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown, MapPin } from "lucide-react";
import { DueBadge, PriorityPill, UrgencyDot } from "@/components/ui/status-pill";
import { TONE_META, taskTone } from "@/lib/task-meta";
import { useT } from "@/lib/i18n/client";
import type { CheckState } from "@/lib/task-meta";
import type { TaskPriority, TaskStatus } from "@/lib/data/types";

/** Desktop column widths, shared with TaskLineHeader so the header lines up. */
const COL = { by: "w-32", to: "w-36", urgency: "w-28", due: "w-24" };

export function TaskLine({
  serial,
  title,
  remark,
  priority,
  state,
  due,
  check,
  siteName,
  byName,
  toNames,
  href,
  onOpen,
  open,
  extra,
  columns = false,
}: {
  serial: string;
  title: string;
  remark?: string;
  priority: TaskPriority;
  state: CheckState;
  due?: { deadline: string; status: TaskStatus };
  check: React.ReactNode;
  siteName?: string;
  byName?: string;
  toNames?: string[];
  href?: string;
  onOpen?: () => void;
  open?: boolean;
  extra?: React.ReactNode;
  /** Spread who/urgency/due into aligned columns on wide screens. */
  columns?: boolean;
}) {
  const t = useT();
  const finished = state !== "none";
  const status: TaskStatus = state === "full" ? "approved" : state === "half" ? "completed" : (due?.status ?? "pending");
  const tone = TONE_META[taskTone({ status, priority })];
  const toLabel = toNames?.length ? toNames.join(", ") : "";
  const showPill = priority !== "normal" || finished;

  const body = (
    <>
      <span className="block">
        <span className={`break-words text-[15px] font-semibold leading-snug ${tone.title}`}>{title}</span>
        {state === "half" && (
          <span className="ml-2 inline-block whitespace-nowrap rounded-full bg-sky-100 px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-sky-700">
            {t("status.completed")}
          </span>
        )}
      </span>
      {remark && (
        <span className={`mt-0.5 line-clamp-2 break-words text-[13px] leading-snug lg:line-clamp-1 ${finished ? "text-emerald-800/70" : "text-slate-500"}`}>
          {remark}
        </span>
      )}

      <span className={`mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-slate-500 ${columns ? "lg:hidden" : ""}`}>
        <span className={`font-mono font-semibold tabular-nums sm:hidden ${finished ? "text-emerald-600" : "text-slate-400"}`}>{serial}</span>
        {showPill && (
          <span className="sm:hidden">
            <PriorityPill priority={priority} still={finished} />
          </span>
        )}
        {due && <DueBadge task={due} />}
        {siteName && (
          <span className="inline-flex max-w-full items-center gap-1">
            <MapPin size={11} className="shrink-0 text-slate-400" />
            <span className="break-words">{siteName}</span>
          </span>
        )}
        {(byName || toLabel) && (
          <span className="inline-flex max-w-full flex-wrap items-center gap-x-1">
            {byName && <span className="font-medium text-slate-600">{byName}</span>}
            {byName && toLabel && <ArrowRight size={11} className="shrink-0 text-slate-400" />}
            {toLabel && <span className="break-words">{toLabel}</span>}
          </span>
        )}
        {extra}
      </span>

      {columns && (siteName || extra) && (
        <span className="mt-1 hidden items-center gap-2.5 text-xs text-slate-500 lg:inline-flex">
          {siteName && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} className="text-slate-400" /> {siteName}
            </span>
          )}
          {extra}
        </span>
      )}
    </>
  );

  const bodyClass = "flex min-w-0 flex-1 flex-col py-2.5 text-left";

  return (
    <div className={`relative flex items-start gap-1 pl-4 pr-1 transition-colors sm:gap-2 sm:pl-5 sm:pr-2 ${tone.row}`}>
      <span className={`absolute inset-y-0 left-0 w-1 ${tone.edge}`} />
      <span className={`mt-[13px] hidden w-9 shrink-0 font-mono text-xs font-semibold tabular-nums sm:block ${finished ? "text-emerald-600" : "text-slate-400"}`}>
        {serial}
      </span>

      {href ? (
        <Link href={href} className={bodyClass}>
          {body}
        </Link>
      ) : onOpen ? (
        <button type="button" onClick={onOpen} aria-expanded={open} className={bodyClass}>
          {body}
        </button>
      ) : (
        <div className={bodyClass}>{body}</div>
      )}

      {columns && (
        <>
          <span className={`mt-3 hidden shrink-0 break-words text-sm font-medium text-slate-700 lg:block ${COL.by}`}>{byName}</span>
          <span className={`mt-3 hidden shrink-0 break-words text-sm text-slate-600 lg:block ${COL.to}`}>{toLabel}</span>
        </>
      )}

      <span className={`mt-3 hidden shrink-0 sm:flex sm:items-center ${columns ? COL.urgency : ""}`}>
        {showPill && <PriorityPill priority={priority} still={finished} />}
      </span>

      {columns && due && (
        <span className={`mt-3 hidden shrink-0 lg:block ${COL.due}`}>
          <DueBadge task={due} />
        </span>
      )}

      {!onOpen && !columns && priority === "urgent" && !finished && (
        <span className="mt-4 shrink-0 sm:hidden">
          <UrgencyDot priority={priority} size="md" />
        </span>
      )}
      <span className="shrink-0 pt-px">{check}</span>
      {onOpen && <ChevronDown size={18} className={`-ml-1 mt-3.5 shrink-0 text-slate-300 transition ${open ? "rotate-180" : ""}`} />}
    </div>
  );
}

export function TaskLineHeader() {
  const t = useT();
  return (
    <div className="hidden items-center gap-2 border-b border-slate-100 bg-slate-50/80 py-2 pl-5 pr-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:flex">
      <span className="w-9 shrink-0">{t("tasks.colNo")}</span>
      <span className="flex-1">{t("tasks.colTask")}</span>
      <span className={`shrink-0 ${COL.by}`}>{t("tasks.assignedBy")}</span>
      <span className={`shrink-0 ${COL.to}`}>{t("tasks.assignedTo")}</span>
      <span className={`shrink-0 ${COL.urgency}`}>{t("tasks.colUrgency")}</span>
      <span className={`shrink-0 ${COL.due}`}>{t("tasks.colDue")}</span>
      <span className="w-11 shrink-0 text-center">{t("tasks.colDone")}</span>
    </div>
  );
}
