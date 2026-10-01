import Link from "next/link";
import { ArrowRight, ChevronDown, MapPin } from "lucide-react";
import { DueBadge, PriorityPill, UrgencyDot } from "@/components/ui/status-pill";
import { PRIORITY_META } from "@/lib/task-meta";
import type { CheckState } from "@/components/task-check";
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
  const finished = state !== "none";
  const tone =
    state === "full"
      ? "bg-emerald-50 hover:bg-emerald-100/60"
      : state === "half"
        ? "bg-emerald-50/50 hover:bg-emerald-50"
        : "bg-white hover:bg-slate-50/80";
  const edge = finished ? "bg-emerald-500" : PRIORITY_META[priority].edge;
  const toLabel = toNames?.length ? toNames.join(", ") : "";

  const body = (
    <>
      <span className="flex items-center gap-2">
        <span className={`min-w-0 break-words text-[15px] font-semibold leading-snug ${finished ? "text-emerald-900" : "text-slate-900"}`}>
          {title}
        </span>
        {state === "half" && (
          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
            Awaiting approval
          </span>
        )}
      </span>
      {remark && (
        <span className={`mt-0.5 block truncate text-[13px] ${finished ? "text-emerald-800/70" : "text-slate-500"}`}>{remark}</span>
      )}
      <span className={`mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 ${columns ? "lg:hidden" : ""}`}>
        {siteName && (
          <span className="inline-flex items-center gap-1">
            <MapPin size={11} className="text-slate-400" /> {siteName}
          </span>
        )}
        {(byName || toLabel) && (
          <span className="inline-flex min-w-0 items-center gap-1">
            {byName && <span className="font-medium text-slate-600">{byName}</span>}
            {byName && toLabel && <ArrowRight size={11} className="shrink-0 text-slate-400" />}
            {toLabel && <span className="truncate">{toLabel}</span>}
          </span>
        )}
        {due && <DueBadge task={due} />}
        {extra}
      </span>
      {columns && siteName && (
        <span className="mt-1 hidden items-center gap-1 text-xs text-slate-500 lg:inline-flex">
          <MapPin size={11} className="text-slate-400" /> {siteName}
          {extra && <span className="ml-2 inline-flex items-center gap-2.5">{extra}</span>}
        </span>
      )}
    </>
  );

  const bodyClass = "min-w-0 flex-1 text-left";

  return (
    <div className={`relative flex items-start gap-3 py-3 pl-4 pr-3 transition-colors sm:pl-5 sm:pr-4 ${tone}`}>
      <span className={`absolute inset-y-0 left-0 w-1 ${edge}`} />
      <span
        className={`w-9 shrink-0 pt-0.5 font-mono text-xs font-semibold tabular-nums ${finished ? "text-emerald-600" : "text-slate-400"}`}
      >
        {serial}
      </span>
      <span className="pt-px">{check}</span>

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
          <span className={`hidden shrink-0 truncate pt-0.5 text-sm font-medium text-slate-700 lg:block ${COL.by}`}>{byName}</span>
          <span className={`hidden shrink-0 truncate pt-0.5 text-sm text-slate-600 lg:block ${COL.to}`}>{toLabel}</span>
        </>
      )}

      <span className={`flex shrink-0 items-center gap-2 pt-0.5 ${columns ? `lg:justify-start ${COL.urgency}` : ""}`}>
        {priority !== "normal" || columns ? (
          <>
            <span className="sm:hidden">
              <UrgencyDot priority={priority} still={finished} size="md" />
            </span>
            <span className="hidden sm:inline-flex">
              <PriorityPill priority={priority} still={finished} />
            </span>
          </>
        ) : null}
      </span>

      {columns && due && (
        <span className={`hidden shrink-0 pt-0.5 lg:block ${COL.due}`}>
          <DueBadge task={due} />
        </span>
      )}

      {onOpen && <ChevronDown size={16} className={`mt-1 shrink-0 text-slate-300 transition ${open ? "rotate-180" : ""}`} />}
    </div>
  );
}

export function TaskLineHeader() {
  return (
    <div className="hidden items-center gap-3 border-b border-slate-100 bg-slate-50/80 py-2 pl-5 pr-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:flex">
      <span className="w-9 shrink-0">No.</span>
      <span className="w-6 shrink-0" />
      <span className="flex-1">Task</span>
      <span className={`shrink-0 ${COL.by}`}>Assigned by</span>
      <span className={`shrink-0 ${COL.to}`}>Assigned to</span>
      <span className={`shrink-0 ${COL.urgency}`}>Urgency</span>
      <span className={`shrink-0 ${COL.due}`}>Due</span>
    </div>
  );
}
