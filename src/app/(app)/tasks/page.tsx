import { Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { listTasks } from "@/lib/data/tasks";
import { listSites } from "@/lib/data/sites";
import { listStaff } from "@/lib/data/staff";
import { listAllProofs } from "@/lib/data/proofs";
import { listAllTaskComments } from "@/lib/data/task-comments";
import { TaskBrowser, type TaskFilters } from "@/app/(app)/tasks/task-browser";

const STATUSES = ["all", "late", "pending", "in_progress", "completed", "approved"];

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; site?: string; staff?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const [tasks, sites, staff, proofs, comments] = await Promise.all([
    listTasks(),
    listSites(),
    listStaff(),
    listAllProofs(),
    listAllTaskComments(),
  ]);

  const count = (ids: string[]) => ids.reduce<Record<string, number>>((m, id) => ((m[id] = (m[id] ?? 0) + 1), m), {});

  const initial: TaskFilters = {
    status: (STATUSES.includes(sp.status ?? "") ? sp.status : "all") as TaskFilters["status"],
    site: sp.site ?? "all",
    staff: sp.staff ?? "all",
    q: sp.q ?? "",
  };

  return (
    <>
      <PageHeader
        title="Tasks"
        actions={
          <ButtonLink href="/tasks/new" className="hidden lg:inline-flex">
            <Plus size={16} /> New task
          </ButtonLink>
        }
      />
      <TaskBrowser
        tasks={tasks}
        sites={sites}
        staff={staff}
        commentCounts={count(comments.map((c) => c.taskId))}
        proofCounts={count(proofs.map((p) => p.taskId))}
        initial={initial}
      />
    </>
  );
}
