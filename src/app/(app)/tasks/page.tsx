import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { listTasks } from "@/lib/data/tasks";
import { listSites } from "@/lib/data/sites";
import { listStaff } from "@/lib/data/staff";
import { listAllProofs } from "@/lib/data/proofs";
import { listAllTaskComments } from "@/lib/data/task-comments";
import { TaskBrowser, type TaskFilters } from "@/app/(app)/tasks/task-browser";
import { getT } from "@/lib/i18n/server";

const VIEWS = ["all", "open", "review", "done", "late"];

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; site?: string; staff?: string; by?: string; q?: string; group?: string }>;
}) {
  const sp = await searchParams;
  const t = await getT();
  const [session, tasks, sites, staff, proofs, comments] = await Promise.all([
    auth(),
    listTasks(),
    listSites(),
    listStaff(),
    listAllProofs(),
    listAllTaskComments(),
  ]);

  const count = (ids: string[]) => ids.reduce<Record<string, number>>((m, id) => ((m[id] = (m[id] ?? 0) + 1), m), {});

  const initial: TaskFilters = {
    status: (VIEWS.includes(sp.status ?? "") ? sp.status : "all") as TaskFilters["status"],
    site: sp.site ?? "all",
    staff: sp.staff ?? "all",
    by: sp.by ?? "all",
    q: sp.q ?? "",
    group: sp.group === "site" || sp.group === "none" ? sp.group : "person",
  };

  return (
    <>
      <PageHeader
        title={t("tasks.title")}
        actions={
          <ButtonLink href="/tasks/new" className="hidden lg:inline-flex">
            <Plus size={16} /> {t("tasks.new")}
          </ButtonLink>
        }
      />
      <TaskBrowser
        tasks={tasks}
        sites={sites}
        staff={staff}
        myRole={session!.user.role}
        commentCounts={count(comments.map((c) => c.taskId))}
        proofCounts={count(proofs.map((p) => p.taskId))}
        initial={initial}
      />
    </>
  );
}
