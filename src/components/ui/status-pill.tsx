import type { TaskPriority, TaskStatus } from "@/lib/data/types";

const statusStyles: Record<TaskStatus, string> = {
  pending: "bg-slate-100 text-slate-700 ring-slate-300",
  in_progress: "bg-amber-100 text-amber-800 ring-amber-300",
  completed: "bg-emerald-100 text-emerald-800 ring-emerald-300",
};

const statusLabels: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

const priorityStyles: Record<TaskPriority, string> = {
  low: "bg-slate-100 text-slate-600 ring-slate-300",
  normal: "bg-blue-100 text-blue-700 ring-blue-300",
  urgent: "bg-red-100 text-red-700 ring-red-300",
};

export function StatusPill({ status }: { status: TaskStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

export function PriorityPill({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${priorityStyles[priority]}`}>
      {priority === "urgent" ? "Urgent" : priority === "low" ? "Low" : "Normal"}
    </span>
  );
}
