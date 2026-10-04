import { PageHeader } from "@/components/ui/page-header";
import { listSites } from "@/lib/data/sites";
import { listStaff } from "@/lib/data/staff";
import { NewTaskForm } from "@/app/(app)/tasks/new/new-task-form";
import { getT } from "@/lib/i18n/server";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ siteId?: string }>;
}) {
  const t = await getT();
  const { siteId: presetSiteId } = await searchParams;
  const [sites, staff] = await Promise.all([listSites(), listStaff()]);
  const assignableStaff = staff.filter((s) => s.active && s.role !== "owner");

  return (
    <>
      <div className="mx-auto max-w-3xl">
        <PageHeader title={t("nt.title")} back={presetSiteId ? `/sites/${presetSiteId}` : "/tasks"} />
        <NewTaskForm sites={sites} staff={assignableStaff} presetSiteId={presetSiteId} />
      </div>
    </>
  );
}
