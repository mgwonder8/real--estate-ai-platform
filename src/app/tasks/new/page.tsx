import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
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
      <div className="mb-5 flex items-center gap-3">
        <Link
          href={presetSiteId ? `/sites/${presetSiteId}` : "/tasks"}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">New task</h1>
          <p className="text-sm text-slate-500">Assign to one or more staff.</p>
        </div>
      </div>

      <Card className="p-5">
        <NewTaskForm sites={sites} staff={assignableStaff} presetSiteId={presetSiteId} />
      </Card>
    </AppShell>
  );
}
