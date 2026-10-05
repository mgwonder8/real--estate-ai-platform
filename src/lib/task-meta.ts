import type { Task, TaskPriority, TaskStatus } from "@/lib/data/types";
import { shortDate, type T } from "@/lib/i18n/translate";

export const STATUS_ORDER: TaskStatus[] = ["pending", "in_progress", "completed", "approved"];

export const STATUS_META: Record<
  TaskStatus,
  { dot: string; pill: string; bar: string; soft: string; text: string }
> = {
  pending: {
    dot: "bg-slate-400",
    pill: "bg-slate-100 text-slate-700",
    bar: "bg-slate-300",
    soft: "bg-slate-50",
    text: "text-slate-700",
  },
  in_progress: {
    dot: "bg-amber-500",
    pill: "bg-amber-50 text-amber-800",
    bar: "bg-amber-400",
    soft: "bg-amber-50",
    text: "text-amber-700",
  },
  completed: {
    dot: "bg-sky-500",
    pill: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
    bar: "bg-sky-400",
    soft: "bg-sky-50/70",
    text: "text-sky-700",
  },
  approved: {
    dot: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-800",
    bar: "bg-emerald-500",
    soft: "bg-emerald-50",
    text: "text-emerald-700",
  },
};

export const PRIORITY_META: Record<TaskPriority, { dot: string; pill: string; edge: string; blink: boolean }> = {
  urgent: { dot: "bg-red-500", pill: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200", edge: "bg-red-500", blink: true },
  high: { dot: "bg-orange-500", pill: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200", edge: "bg-orange-400", blink: false },
  normal: { dot: "bg-sky-500", pill: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100", edge: "bg-sky-400", blink: false },
  low: { dot: "bg-slate-300", pill: "bg-slate-100 text-slate-600", edge: "bg-slate-300", blink: false },
};

/**
 * The colour a task wears everywhere (dashboard board, task rows, legend):
 * green done, blue awaiting approval, red urgent or high, yellow in progress, pink scheduled.
 */
export type TaskTone = "done" | "review" | "high" | "progress" | "scheduled";

export const TONE_ORDER: TaskTone[] = ["done", "high", "progress", "review", "scheduled"];

export function taskTone(task: Pick<Task, "status" | "priority">): TaskTone {
  if (task.status === "approved") return "done";
  if (task.status === "completed") return "review";
  if (task.priority === "urgent" || task.priority === "high") return "high";
  if (task.status === "in_progress") return "progress";
  return "scheduled";
}

export const TONE_META: Record<TaskTone, { card: string; row: string; edge: string; swatch: string; title: string }> = {
  done: {
    card: "border-emerald-200 bg-emerald-50",
    row: "bg-emerald-50/70 hover:bg-emerald-50",
    edge: "bg-emerald-500",
    swatch: "bg-emerald-500",
    title: "text-emerald-950",
  },
  review: {
    card: "border-sky-200 bg-sky-50",
    row: "bg-sky-50/60 hover:bg-sky-50",
    edge: "bg-sky-500",
    swatch: "bg-sky-500",
    title: "text-sky-950",
  },
  high: {
    card: "border-red-200 bg-red-50",
    row: "bg-red-50/50 hover:bg-red-50/80",
    edge: "bg-red-500",
    swatch: "bg-red-500",
    title: "text-red-950",
  },
  progress: {
    card: "border-amber-200 bg-amber-50",
    row: "bg-amber-50/50 hover:bg-amber-50/80",
    edge: "bg-amber-400",
    swatch: "bg-amber-400",
    title: "text-amber-950",
  },
  scheduled: {
    card: "border-pink-200 bg-pink-50/70",
    row: "bg-white hover:bg-pink-50/40",
    edge: "bg-pink-400",
    swatch: "bg-pink-400",
    title: "text-slate-900",
  },
};

/** Which tab of the task list shows a given status. */
export const TASK_VIEW: Record<TaskStatus, "open" | "review" | "done"> = {
  pending: "open",
  in_progress: "open",
  completed: "review",
  approved: "done",
};

export const PRIORITY_OPTIONS: TaskPriority[] = ["low", "normal", "high", "urgent"];

export function isOpen(task: Pick<Task, "status">): boolean {
  return task.status === "pending" || task.status === "in_progress";
}

export function isFinished(task: Pick<Task, "status">): boolean {
  return task.status === "completed" || task.status === "approved";
}

/** none = open, half = ticked by staff and awaiting approval, full = done. */
export type CheckState = "none" | "half" | "full";

export function checkStateOf(status: TaskStatus): CheckState {
  if (status === "approved") return "full";
  if (status === "completed") return "half";
  return "none";
}

/** What ticking the checkbox does. null means this person can't change it. */
export function nextCheckStatus(status: TaskStatus, role: string): TaskStatus | null {
  if (role === "site_staff") {
    if (status === "pending" || status === "in_progress") return "completed";
    if (status === "completed") return "in_progress";
    return null;
  }
  return status === "approved" ? "pending" : "approved";
}

export function serialLabel(serial: number): string {
  return `#${serial}`;
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

export function dueInfo(
  task: Pick<Task, "deadline" | "status">,
  t: T
): { label: string; tone: "red" | "amber" | "slate" } | null {
  if (!task.deadline) return null;
  const days = daysUntil(task.deadline);
  if (Number.isNaN(days)) return null;
  if (!isOpen(task)) return { label: formatDate(task.deadline, t), tone: "slate" };
  if (days < 0) return { label: t("due.late", { n: -days }), tone: "red" };
  if (days === 0) return { label: t("common.today"), tone: "amber" };
  if (days === 1) return { label: t("common.tomorrow"), tone: "amber" };
  if (days <= 6) return { label: t("due.inDays", { n: days }), tone: "slate" };
  return { label: formatDate(task.deadline, t), tone: "slate" };
}

export function formatDate(value: string, t: T): string {
  if (!value) return "";
  const [y, m, d] = value.split("-").map(Number);
  const date = y && m && d && value.length === 10 ? new Date(y, m - 1, d) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return shortDate(date, t.locale);
}

export function timeAgo(iso: string, t: T): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.round((Date.now() - then) / 60_000);
  if (mins < 1) return t("time.justNow");
  if (mins < 60) return t("time.minutesAgo", { n: mins });
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return t("time.hoursAgo", { n: hrs });
  const days = Math.round(hrs / 24);
  if (days < 7) return t("time.daysAgo", { n: days });
  return shortDate(new Date(iso), t.locale);
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
  const priorityRank: Record<TaskPriority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
  return [...tasks].sort((a, b) => {
    const od = Number(isOverdue(b)) - Number(isOverdue(a));
    if (od !== 0) return od;
    const pr = priorityRank[a.priority] - priorityRank[b.priority];
    if (pr !== 0) return pr;
    return (a.deadline || "9999").localeCompare(b.deadline || "9999");
  });
}
