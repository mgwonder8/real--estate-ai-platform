"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { AddStaffForm } from "@/app/staff/add-staff-form";
import type { Site } from "@/lib/data/types";

export function NewStaffModal({ sites }: { sites: Site[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-1.5">
        <Plus size={16} />
        Add Staff
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Staff" subtitle="Creates their login at the same time.">
        <AddStaffForm sites={sites} />
      </Modal>
    </>
  );
}
