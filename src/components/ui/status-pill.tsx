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

export function PriorityPill({ priority }: { priority: TaskPriority }) {
  const m = PRIORITY_META[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${m.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: TaskPriority }) {
  if (priority === "normal") return null;
  const m = PRIORITY_META[priority];
  return <span title={m.label} className={`inline-block h-2 w-2 shrink-0 rounded-full ${m.dot}`} />;
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
