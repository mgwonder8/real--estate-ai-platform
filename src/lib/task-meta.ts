import type { Task, TaskPriority, TaskStatus } from "@/lib/data/types";

export const STATUS_ORDER: TaskStatus[] = ["pending", "in_progress", "completed", "approved"];

export const STATUS_META: Record<
  TaskStatus,
  { label: string; short: string; dot: string; pill: string; bar: string; soft: string; text: string }
> = {
  pending: {
    label: "To do",
    short: "To do",
    dot: "bg-slate-400",
    pill: "bg-slate-100 text-slate-700",
    bar: "bg-slate-300",
    soft: "bg-slate-50",
    text: "text-slate-700",
  },
  in_progress: {
    label: "In progress",
    short: "Doing",
    dot: "bg-amber-500",
    pill: "bg-amber-50 text-amber-800",
    bar: "bg-amber-400",
    soft: "bg-amber-50",
    text: "text-amber-700",
  },
  completed: {
    label: "Needs review",
    short: "Review",
    dot: "bg-violet-500",
    pill: "bg-violet-50 text-violet-800",
    bar: "bg-violet-500",
    soft: "bg-violet-50",
    text: "text-violet-700",
  },
  approved: {
    label: "Done",
    short: "Done",
    dot: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-800",
    bar: "bg-emerald-500",
    soft: "bg-emerald-50",
    text: "text-emerald-700",
  },
};

export const PRIORITY_META: Record<TaskPriority, { label: string; dot: string; pill: string }> = {
  urgent: { label: "Urgent", dot: "bg-red-500", pill: "bg-red-50 text-red-700" },
  normal: { label: "Normal", dot: "bg-sky-500", pill: "bg-sky-50 text-sky-700" },
  low: { label: "Low", dot: "bg-slate-300", pill: "bg-slate-100 text-slate-600" },
};

export function isOpen(task: Pick<Task, "status">): boolean {
  return task.status === "pending" || task.status === "in_progress";
}

export function isOverdue(task: Pick<Task, "deadline" | "status">): boolean {
  if (!task.deadline || !isOpen(task)) return false;
  return daysUntil(task.deadline) < 0;
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function daysUntil(deadline: string): number {
  const [y, m, d] = deadline.split("-").map(Number);
  if (!y || !m || !d) return Number.NaN;
  return Math.round((startOfDay(new Date(y, m - 1, d)) - startOfDay(new Date())) / 86_400_000);
}

export function dueInfo(task: Pick<Task, "deadline" | "status">): { label: string; tone: "red" | "amber" | "slate" } | null {
  if (!task.deadline) return null;
  const days = daysUntil(task.deadline);
  if (Number.isNaN(days)) return null;
  if (!isOpen(task)) return { label: formatDate(task.deadline), tone: "slate" };
  if (days < 0) return { label: `${-days}d late`, tone: "red" };
  if (days === 0) return { label: "Today", tone: "amber" };
  if (days === 1) return { label: "Tomorrow", tone: "amber" };
  if (days <= 6) return { label: `${days} days`, tone: "slate" };
  return { label: formatDate(task.deadline), tone: "slate" };
}

export function formatDate(value: string): string {
  if (!value) return "";
  const [y, m, d] = value.split("-").map(Number);
  const date = y && m && d && value.length === 10 ? new Date(y, m - 1, d) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.round((Date.now() - then) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function firstName(name: string | undefined): string {
  return (name ?? "").trim().split(/\s+/)[0] || "?";
}

export function statusCounts(tasks: Pick<Task, "status">[]): Record<TaskStatus, number> {
  const counts: Record<TaskStatus, number> = { pending: 0, in_progress: 0, completed: 0, approved: 0 };
  for (const t of tasks) counts[t.status] += 1;
  return counts;
}

export function sortByUrgency<T extends Pick<Task, "deadline" | "status" | "priority">>(tasks: T[]): T[] {
  const priorityRank: Record<TaskPriority, number> = { urgent: 0, normal: 1, low: 2 };
  return [...tasks].sort((a, b) => {
    const od = Number(isOverdue(b)) - Number(isOverdue(a));
    if (od !== 0) return od;
    const pr = priorityRank[a.priority] - priorityRank[b.priority];
    if (pr !== 0) return pr;
    return (a.deadline || "9999").localeCompare(b.deadline || "9999");
  });
}
