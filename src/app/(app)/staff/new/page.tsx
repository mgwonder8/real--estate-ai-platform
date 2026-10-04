import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { listSites } from "@/lib/data/sites";
import { AddStaffForm } from "@/app/(app)/staff/add-staff-form";
import { getT } from "@/lib/i18n/server";

export default async function NewStaffPage() {
  const t = await getT();
  const sites = await listSites();
  return (
    <>
      <div className="mx-auto max-w-2xl">
        <PageHeader title={t("as.title")} back="/staff" />
        <Card className="p-5 sm:p-6">
          <AddStaffForm sites={sites} />
        </Card>
      </div>
    </>
  );
}
