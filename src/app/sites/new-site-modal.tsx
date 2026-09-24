"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { createSiteAction } from "@/app/sites/actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none";

export function NewSiteModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-1.5">
        <Plus size={16} />
        Add Site
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Site" subtitle="Optionally attach a project brief that site staff will be able to see.">
        <form
          action={async (fd) => {
            await createSiteAction(fd);
            setOpen(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input name="name" required className={inputClass} placeholder="e.g. Sunrise Residency" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
            <input name="address" className={inputClass} placeholder="Street, city" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Project brief (text)</label>
            <textarea name="briefText" rows={3} className={inputClass} placeholder="Scope, key dates, points of contact…" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Project brief (file, optional)</label>
            <input name="briefFile" type="file" className="w-full text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Add Site</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
