import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill, PriorityPill } from "@/components/ui/status-pill";
import { listTasks } from "@/lib/data/tasks";
import { listSites } from "@/lib/data/sites";
import { listStaff } from "@/lib/data/staff";
import { listAllProofs } from "@/lib/data/proofs";
import { createTaskAction, updateTaskStatusAction } from "@/app/tasks/actions";
import type { TaskStatus } from "@/lib/data/types";

export default async function TasksPage() {
  const session = await auth();
  const [tasks, sites, staff, proofs] = await Promise.all([
    listTasks(),
    listSites(),
    listStaff(),
    listAllProofs(),
  ]);

  const siteById = Object.fromEntries(sites.map((s) => [s.id, s]));
  const staffById = Object.fromEntries(staff.map((s) => [s.id, s]));
  const assignableStaff = staff.filter((s) => s.active);
  const proofsByTask = new Map<string, typeof proofs>();
  for (const proof of proofs) {
    proofsByTask.set(proof.taskId, [...(proofsByTask.get(proof.taskId) ?? []), proof]);
  }

  const nextStatus: Record<TaskStatus, TaskStatus | null> = {
    pending: "in_progress",
    in_progress: "completed",
    completed: null,
  };
  const nextLabel: Record<TaskStatus, string> = {
    pending: "Start",
    in_progress: "Mark Complete",
    completed: "",
  };

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Tasks</h1>
          <p className="text-sm text-slate-500">Assign, prioritize, and track work across every site.</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader title="New Task" subtitle="Assign to a specific site and staff member." />
        <form action={createTaskAction} className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2">
            <input name="title" required className={inputClass} placeholder="e.g. Fix leaking pipe in unit 4B" />
          </Field>
          <Field label="Project brief" className="sm:col-span-2">
            <textarea name="brief" rows={2} className={inputClass} placeholder="Details, instructions, materials needed…" />
          </Field>
          <Field label="Site">
            <select name="siteId" required className={inputClass}>
              <option value="">Select site</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Assign to">
            <select name="assigneeId" required className={inputClass}>
              <option value="">Select staff</option>
              {assignableStaff.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.role.replace("_", " ")})</option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select name="priority" defaultValue="normal" className={inputClass}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </Field>
          <Field label="Deadline">
            <input name="deadline" type="date" className={inputClass} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
            <input type="checkbox" name="proofRequired" defaultChecked className="rounded border-slate-300" />
            Require photo/video proof before this task can be marked complete
          </label>
          <div className="sm:col-span-2">
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title={`All Tasks (${tasks.length})`} />
        <div className="divide-y divide-slate-100">
          {tasks.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-slate-500">No tasks yet. Create the first one above.</p>
          )}
          {tasks.map((task) => {
            const site = siteById[task.siteId];
            const assignee = staffById[task.assigneeId];
            const upcoming = nextStatus[task.status];
            const taskProofs = proofsByTask.get(task.id) ?? [];
            return (
              <div key={task.id} className="px-5 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900">{task.title}</span>
                      <PriorityPill priority={task.priority} />
                      <StatusPill status={task.status} />
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {site?.name ?? "Unknown site"} · {assignee?.name ?? "Unassigned"}
                      {task.deadline && ` · Due ${task.deadline}`}
                    </p>
                  </div>
                  {upcoming && (
                    <form action={updateTaskStatusAction}>
                      <input type="hidden" name="taskId" value={task.id} />
                      <input type="hidden" name="toStatus" value={upcoming} />
                      <Button variant="secondary" type="submit">{nextLabel[task.status]}</Button>
                    </form>
                  )}
                </div>
                {taskProofs.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-medium text-brand-navy">
                      {taskProofs.length} proof{taskProofs.length === 1 ? "" : "s"} submitted
                    </summary>
                    <div className="mt-2 space-y-2">
                      {taskProofs.map((proof) => (
                        <div key={proof.id} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
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
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </AppShell>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none";

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}
