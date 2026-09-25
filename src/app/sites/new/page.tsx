import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { NewSiteForm } from "@/app/sites/new/new-site-form";

export default async function NewSitePage() {
  const session = await auth();
  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Add site" back="/sites" />
        <Card className="p-5 sm:p-6">
          <NewSiteForm />
        </Card>
      </div>
    </AppShell>
  );
}
