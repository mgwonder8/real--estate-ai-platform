import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { NewSiteForm } from "@/app/(app)/sites/new/new-site-form";
import { getT } from "@/lib/i18n/server";

export default async function NewSitePage() {
  const t = await getT();
  return (
    <>
      <div className="mx-auto max-w-2xl">
        <PageHeader title={t("ns.title")} back="/sites" />
        <Card className="p-5 sm:p-6">
          <NewSiteForm />
        </Card>
      </div>
    </>
  );
}
