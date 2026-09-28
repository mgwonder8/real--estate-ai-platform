import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { NewSiteForm } from "@/app/(app)/sites/new/new-site-form";

export default async function NewSitePage() {
  return (
    <>
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Add site" back="/sites" />
        <Card className="p-5 sm:p-6">
          <NewSiteForm />
        </Card>
      </div>
    </>
  );
}
