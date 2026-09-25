import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { listSites } from "@/lib/data/sites";
import { listStaff } from "@/lib/data/staff";
import { NewTaskForm } from "@/app/tasks/new/new-task-form";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ siteId?: string }>;
}) {
  const session = await auth();
  const { siteId: presetSiteId } = await searchParams;
  const [sites, staff] = await Promise.all([listSites(), listStaff()]);
  const assignableStaff = staff.filter((s) => s.active && s.role !== "owner");

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <div className="mx-auto max-w-3xl">
        <PageHeader title="New task" back={presetSiteId ? `/sites/${presetSiteId}` : "/tasks"} />
        <NewTaskForm sites={sites} staff={assignableStaff} presetSiteId={presetSiteId} />
      </div>
    </AppShell>
  );
}
