import { PRIORITY_META, STATUS_META, dueInfo } from "@/lib/task-meta";
import type { Task, TaskPriority, TaskStatus } from "@/lib/data/types";

export function StatusPill({ status }: { status: TaskStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${m.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

/** Urgency marker. Urgent blinks until the task is finished (pass `still` to stop it). */
export function UrgencyDot({ priority, still = false, size = "sm" }: { priority: TaskPriority; still?: boolean; size?: "sm" | "md" }) {
  const m = PRIORITY_META[priority];
  const box = size === "md" ? "h-2.5 w-2.5" : "h-2 w-2";
  return (
    <span title={m.label} className={`relative inline-flex shrink-0 ${box}`}>
      {m.blink && !still && (
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${m.dot} opacity-75 motion-reduce:animate-none`} />
      )}
      <span className={`relative inline-flex rounded-full ${box} ${m.dot}`} />
    </span>
  );
}

export function PriorityPill({ priority, still = false }: { priority: TaskPriority; still?: boolean }) {
  const m = PRIORITY_META[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${still ? "bg-slate-100 text-slate-500" : m.pill}`}>
      <UrgencyDot priority={priority} still={still} />
      {m.label}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: TaskPriority }) {
  if (priority === "normal") return null;
  return <UrgencyDot priority={priority} />;
}

const DUE_TONES = {
  red: "bg-red-50 text-red-700",
  amber: "bg-amber-50 text-amber-800",
  slate: "text-slate-500",
} as const;

export function DueBadge({ task }: { task: Pick<Task, "deadline" | "status"> }) {
  const info = dueInfo(task);
  if (!info) return null;
  return (
    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${DUE_TONES[info.tone]}`}>
      {info.label}
    </span>
  );
}
