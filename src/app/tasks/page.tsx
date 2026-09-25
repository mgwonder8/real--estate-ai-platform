import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listTasks } from "@/lib/data/tasks";
import { listSites } from "@/lib/data/sites";
import { listStaff } from "@/lib/data/staff";
import { listAllProofs } from "@/lib/data/proofs";
import { listAllTaskComments } from "@/lib/data/task-comments";
import { TaskTable } from "@/app/tasks/task-table";

export default async function TasksPage() {
  const session = await auth();
  const [tasks, sites, staff, proofs, comments] = await Promise.all([
    listTasks(),
    listSites(),
    listStaff(),
    listAllProofs(),
    listAllTaskComments(),
  ]);

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Tasks</h1>
          <p className="text-sm text-slate-500">All work across every site.</p>
        </div>
        <Link href="/tasks/new">
          <Button className="gap-1.5">
            <Plus size={16} /> New task
          </Button>
        </Link>
      </div>

      <Card>
        <TaskTable tasks={tasks} sites={sites} staff={staff} proofs={proofs} comments={comments} />
      </Card>
    </AppShell>
  );
}
