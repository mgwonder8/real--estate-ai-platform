"use server";

import { listTasks } from "@/lib/data/tasks";
import { listStaff } from "@/lib/data/staff";
import { listSites } from "@/lib/data/sites";
import { listAllTaskUpdates } from "@/lib/data/task-updates";
import { generateStaffPerformanceSummary, generatePortfolioInsights } from "@/lib/ai/openai";

export type AiTextState = { status: "idle" } | { status: "error"; message: string } | { status: "success"; text: string };

function isOverdue(task: { deadline: string; status: string }): boolean {
  if (!task.deadline) return false;
  if (task.status === "completed" || task.status === "approved") return false;
  return new Date(task.deadline).getTime() < Date.now();
}

export async function generateStaffSummaryAction(_prev: AiTextState, formData: FormData): Promise<AiTextState> {
  const staffId = String(formData.get("staffId") ?? "");
  try {
    const [staff, tasks, updates] = await Promise.all([listStaff(), listTasks(), listAllTaskUpdates()]);
    const person = staff.find((s) => s.id === staffId);
    if (!person) return { status: "error", message: "Staff member not found" };

    const theirTasks = tasks.filter((t) => t.assigneeId === staffId);
    const completedAtByTask = new Map<string, string>();
    for (const u of updates) {
      if (u.toStatus === "completed") completedAtByTask.set(u.taskId, u.changedAt);
    }

    const taskSummaries = theirTasks.map((t) => {
      const completedAt = completedAtByTask.get(t.id);
      const onTime =
        !t.deadline || !completedAt
          ? null
          : new Date(completedAt).getTime() <= new Date(t.deadline).getTime();
      return { title: t.title, status: t.status, priority: t.priority, deadline: t.deadline, onTime };
    });

    if (taskSummaries.length === 0) {
      return { status: "success", text: `${person.name} has no tasks recorded yet.` };
    }

    const text = await generateStaffPerformanceSummary({
      staffName: person.name,
      role: person.role,
      taskSummaries,
    });
    return { status: "success", text };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "AI summary failed" };
  }
}

export async function generatePortfolioInsightsAction(_prev: AiTextState): Promise<AiTextState> {
  try {
    const [sites, tasks] = await Promise.all([listSites(), listTasks()]);
    const staff = await listStaff();
    const staffById = Object.fromEntries(staff.map((s) => [s.id, s]));
    const siteById = Object.fromEntries(sites.map((s) => [s.id, s]));

    const siteSummaries = sites.map((site) => {
      const siteTasks = tasks.filter((t) => t.siteId === site.id);
      return {
        name: site.name,
        pending: siteTasks.filter((t) => t.status === "pending").length,
        inProgress: siteTasks.filter((t) => t.status === "in_progress").length,
        completed: siteTasks.filter((t) => t.status === "completed").length,
        approved: siteTasks.filter((t) => t.status === "approved").length,
        overdue: siteTasks.filter(isOverdue).length,
      };
    });

    const overdueTasks = tasks
      .filter(isOverdue)
      .map((t) => ({
        title: t.title,
        site: siteById[t.siteId]?.name ?? "Unknown",
        assignee: staffById[t.assigneeId]?.name ?? "Unassigned",
        deadline: t.deadline,
        priority: t.priority,
      }));

    if (tasks.length === 0) {
      return { status: "success", text: "No tasks recorded yet — insights will appear once work is underway." };
    }

    const text = await generatePortfolioInsights({ siteSummaries, overdueTasks });
    return { status: "success", text };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "AI summary failed" };
  }
}
