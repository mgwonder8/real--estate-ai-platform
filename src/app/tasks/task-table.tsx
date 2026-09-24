"use client";

import { Fragment, useMemo, useState } from "react";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { AvatarStack } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusPill, PriorityPill } from "@/components/ui/status-pill";
import { TaskReviewForm } from "@/app/tasks/task-review-form";
import { CommentThread } from "@/app/tasks/comment-thread";
import { updateTaskStatusAction } from "@/app/tasks/actions";
import type { Proof, Staff, Site, Task, TaskComment, TaskStatus } from "@/lib/data/types";

const nextStatus: Record<TaskStatus, TaskStatus | null> = {
  pending: "in_progress",
  in_progress: "completed",
  completed: null,
  approved: null,
};
const nextLabel: Record<TaskStatus, string> = {
  pending: "Start",
  in_progress: "Mark Complete",
  completed: "",
  approved: "",
};

const STATUS_FILTERS: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Awaiting Approval" },
  { value: "approved", label: "Approved" },
];

export function TaskTable({
  tasks,
  sites,
  staff,
  proofs,
  comments,
}: {
  tasks: Task[];
  sites: Site[];
  staff: Staff[];
  proofs: Proof[];
  comments: TaskComment[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const siteById = useMemo(() => Object.fromEntries(sites.map((s) => [s.id, s])), [sites]);
  const staffById = useMemo(() => Object.fromEntries(staff.map((s) => [s.id, s])), [staff]);

  const proofsByTask = useMemo(() => {
    const map = new Map<string, Proof[]>();
    for (const p of proofs) map.set(p.taskId, [...(map.get(p.taskId) ?? []), p]);
    return map;
  }, [proofs]);

  const commentsByTask = useMemo(() => {
    const map = new Map<string, TaskComment[]>();
    for (const c of comments) map.set(c.taskId, [...(map.get(c.taskId) ?? []), c]);
    return map;
  }, [comments]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (!term) return true;
      const siteName = siteById[t.siteId]?.name ?? "";
      const assigneeNames = t.assigneeIds.map((id) => staffById[id]?.name ?? "").join(" ");
      return (
        t.title.toLowerCase().includes(term) ||
        siteName.toLowerCase().includes(term) ||
        assigneeNames.toLowerCase().includes(term)
      );
    });
  }, [tasks, search, statusFilter, siteById, staffById]);

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks, sites, staff…"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-navy focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "all")}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-slate-500">
          {tasks.length === 0 ? "No tasks yet. Add the first one above." : "No tasks match your search/filter."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Task</th>
                <th className="hidden px-3 py-3 font-medium sm:table-cell">Site</th>
                <th className="px-3 py-3 font-medium">Assigned to</th>
                <th className="hidden px-3 py-3 font-medium md:table-cell">Priority</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="hidden px-3 py-3 font-medium lg:table-cell">Deadline</th>
                <th className="w-8 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => {
                const isOpen = expandedId === task.id;
                const upcoming = nextStatus[task.status];
                const taskProofs = proofsByTask.get(task.id) ?? [];
                const taskComments = commentsByTask.get(task.id) ?? [];
                const assigneeNames = task.assigneeIds.map((id) => staffById[id]?.name ?? "Unknown");

                return (
                  <Fragment key={task.id}>
                    <tr
                      onClick={() => setExpandedId(isOpen ? null : task.id)}
                      className="cursor-pointer border-b border-slate-50 hover:bg-slate-50"
                    >
                      <td className="max-w-[220px] px-5 py-3">
                        <p className="truncate font-medium text-slate-800">{task.title}</p>
                        {(task.resourceLink || task.resourceFileUrl) && (
                          <p className="mt-0.5 text-xs text-brand-navy">🔗 Has resource</p>
                        )}
                      </td>
                      <td className="hidden px-3 py-3 text-slate-600 sm:table-cell">{siteById[task.siteId]?.name ?? "Unknown"}</td>
                      <td className="px-3 py-3"><AvatarStack names={assigneeNames} /></td>
                      <td className="hidden px-3 py-3 md:table-cell"><PriorityPill priority={task.priority} /></td>
                      <td className="px-3 py-3"><StatusPill status={task.status} /></td>
                      <td className="hidden px-3 py-3 text-slate-500 lg:table-cell">{task.deadline || "—"}</td>
                      <td className="px-3 py-3 text-slate-400">
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-slate-100 bg-slate-50/60">
                        <td colSpan={7} className="px-5 py-4">
                          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-3">
                              {task.brief && <p className="text-sm text-slate-700">{task.brief}</p>}
                              <div className="flex flex-wrap gap-3 text-xs">
                                {task.resourceLink && (
                                  <a href={task.resourceLink} target="_blank" rel="noopener noreferrer" className="text-brand-navy hover:underline">
                                    🔗 Linked resource
                                  </a>
                                )}
                                {task.resourceFileUrl && (
                                  <a href={task.resourceFileUrl} target="_blank" rel="noopener noreferrer" className="text-brand-navy hover:underline">
                                    📎 {task.resourceFileName || "Attached file"}
                                  </a>
                                )}
                              </div>

                              {upcoming && (
                                <form action={updateTaskStatusAction}>
                                  <input type="hidden" name="taskId" value={task.id} />
                                  <input type="hidden" name="toStatus" value={upcoming} />
                                  <Button variant="secondary" type="submit">{nextLabel[task.status]}</Button>
                                </form>
                              )}

                              {task.status === "completed" && <TaskReviewForm taskId={task.id} />}

                              {task.status === "approved" && task.approvedBy && (
                                <p className="text-xs text-emerald-700">
                                  Approved by {staffById[task.approvedBy]?.name ?? "owner"} ·{" "}
                                  {task.approvedAt && new Date(task.approvedAt).toLocaleString()}
                                </p>
                              )}

                              {taskProofs.length > 0 && (
                                <div>
                                  <p className="mb-2 text-xs font-medium text-slate-500">
                                    {taskProofs.length} proof{taskProofs.length === 1 ? "" : "s"} submitted
                                  </p>
                                  <div className="space-y-2">
                                    {taskProofs.map((proof) => (
                                      <div key={proof.id} className="flex items-start gap-3 rounded-lg bg-white p-3 ring-1 ring-slate-100">
                                        {proof.photoUrl && (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img
                                            src={proof.photoUrl}
                                            alt="Submitted proof"
                                            className="h-16 w-16 rounded-md object-cover ring-1 ring-slate-200"
                                          />
                                        )}
                                        <div className="min-w-0 text-sm">
                                          <p className="text-slate-700">{proof.notes || "No notes provided."}</p>
                                          <p className="mt-0.5 text-xs text-slate-500">
                                            {staffById[proof.submittedBy]?.name ?? "Unknown"} ·{" "}
                                            {new Date(proof.submittedAt).toLocaleString()}
                                            {proof.gpsLat && proof.gpsLng && (
                                              <>
                                                {" "}
                                                ·{" "}
                                                <a
                                                  href={`https://maps.google.com/?q=${proof.gpsLat},${proof.gpsLng}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-brand-navy hover:underline"
                                                >
                                                  View location
                                                </a>
                                              </>
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="mb-2 text-xs font-medium text-slate-500">
                                {taskComments.length > 0 ? `${taskComments.length} comment${taskComments.length === 1 ? "" : "s"}` : "Comments"}
                              </p>
                              <CommentThread taskId={task.id} comments={taskComments} staffById={staffById} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
