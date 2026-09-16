import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill, PriorityPill } from "@/components/ui/status-pill";
import { listTasksForAssignee } from "@/lib/data/tasks";
import { getSite } from "@/lib/data/sites";
import { updateOwnTaskStatusAction } from "@/app/site/actions";
import { ProofForm } from "@/app/site/proof-form";
import type { TaskStatus } from "@/lib/data/types";

const nextStatus: Record<TaskStatus, TaskStatus | null> = {
  pending: "in_progress",
  in_progress: "completed",
  completed: null,
};
const nextLabel: Record<TaskStatus, string> = {
  pending: "Start Task",
  in_progress: "Mark Complete",
  completed: "",
};

export default async function SiteStaffPage() {
  const session = await auth();
  const tasks = await listTasksForAssignee(session!.user.id);
  const openTasks = tasks.filter((t) => t.status !== "completed");
  const doneTasks = tasks.filter((t) => t.status === "completed");

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">My Tasks</h1>
      <p className="mb-6 text-sm text-slate-500">Today&apos;s schedule and instructions.</p>

      <div className="space-y-4">
        {openTasks.length === 0 && (
          <Card className="p-8 text-center text-sm text-slate-500">No open tasks right now.</Card>
        )}
        {await Promise.all(
          openTasks.map(async (task) => {
            const site = await getSite(task.siteId);
            const upcoming = nextStatus[task.status];
            return (
              <Card key={task.id} className="p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-slate-900">{task.title}</h3>
                  <PriorityPill priority={task.priority} />
                  <StatusPill status={task.status} />
                </div>
                <p className="mb-1 text-sm text-slate-500">
                  {site?.name ?? "Unknown site"}
                  {task.deadline && ` · Due ${task.deadline}`}
                </p>
                {task.brief && <p className="mb-3 text-sm text-slate-700">{task.brief}</p>}
                {task.proofRequired && (
                  <p className="mb-3 text-xs font-medium text-amber-700">Photo/video proof required.</p>
                )}

                <div className="space-y-3">
                  <ProofForm taskId={task.id} />
                  {upcoming && (
                    <form action={updateOwnTaskStatusAction}>
                      <input type="hidden" name="taskId" value={task.id} />
                      <input type="hidden" name="toStatus" value={upcoming} />
                      <Button type="submit" className="w-full">{nextLabel[task.status]}</Button>
                    </form>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {doneTasks.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-slate-500">Completed</h2>
          <div className="space-y-2">
            {doneTasks.map((task) => (
              <Card key={task.id} className="flex items-center justify-between p-3">
                <span className="text-sm text-slate-700">{task.title}</span>
                <StatusPill status={task.status} />
              </Card>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
