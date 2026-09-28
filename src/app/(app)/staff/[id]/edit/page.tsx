import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getStaff } from "@/lib/data/staff";
import { listSites } from "@/lib/data/sites";
import { EditStaffForm } from "./edit-staff-form";

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [staff, sites] = await Promise.all([getStaff(id), listSites()]);
  if (!staff) notFound();

  return (
    <>
      <div className="mx-auto max-w-xl">
        <PageHeader back="/staff" title={`Edit ${staff.name}`} />
        <Card className="p-5 sm:p-6">
          <EditStaffForm staff={staff} sites={sites} />
        </Card>
      </div>
    </>
  );
}
