"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { AssigneeCheckboxes } from "@/components/assignee-checkboxes";
import { createTaskAction } from "@/app/tasks/actions";
import type { Site, Staff } from "@/lib/data/types";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none";

export function NewTaskModal({ sites, staff }: { sites: Site[]; staff: Staff[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-1.5">
        <Plus size={16} />
        Add Task
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="New Task" subtitle="Assign to a specific site and staff member(s)." wide>
        <form
          action={async (fd) => {
            await createTaskAction(fd);
            setOpen(false);
          }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <Field label="Title" className="sm:col-span-2">
            <input name="title" required className={inputClass} placeholder="e.g. Fix leaking pipe in unit 4B" />
          </Field>
          <Field label="Project brief" className="sm:col-span-2">
            <textarea name="brief" rows={2} className={inputClass} placeholder="Details, instructions, materials needed…" />
          </Field>
          <Field label="Site">
            <select name="siteId" required className={inputClass}>
              <option value="">Select site</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select name="priority" defaultValue="normal" className={inputClass}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </Field>
          <Field label="Assign to (select one or more)" className="sm:col-span-2">
            <AssigneeCheckboxes staff={staff} />
          </Field>
          <Field label="Deadline">
            <input name="deadline" type="date" className={inputClass} />
          </Field>
          <Field label="Resource link (optional)">
            <input name="resourceLink" type="url" placeholder="https://…" className={inputClass} />
          </Field>
          <Field label="Attach a file (optional)" className="sm:col-span-2">
            <input name="resourceFile" type="file" className="w-full text-sm" />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
            <input type="checkbox" name="proofRequired" defaultChecked className="rounded border-slate-300" />
            Require photo/video proof before this task can be marked complete
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}
