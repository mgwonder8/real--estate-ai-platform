"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AssigneeCheckboxes } from "@/components/assignee-checkboxes";
import { createTaskAction } from "@/app/tasks/actions";
import type { Site, Staff } from "@/lib/data/types";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none";

export function NewTaskForm({
  sites,
  staff,
  presetSiteId,
}: {
  sites: Site[];
  staff: Staff[];
  presetSiteId?: string;
}) {
  const router = useRouter();

  return (
    <form
      action={async (fd) => {
        await createTaskAction(fd);
        router.push(presetSiteId ? `/sites/${presetSiteId}` : "/tasks");
      }}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      <Field label="Title" className="sm:col-span-2">
        <input name="title" required className={inputClass} placeholder="Short and clear" />
      </Field>

      <Field label="Brief" className="sm:col-span-2">
        <textarea name="brief" rows={3} className={inputClass} placeholder="Details for the person doing the work" />
      </Field>

      <Field label="Site">
        <select name="siteId" required defaultValue={presetSiteId ?? ""} className={inputClass}>
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

      <Field label="Assign to" className="sm:col-span-2">
        <AssigneeCheckboxes staff={staff} />
      </Field>

      <Field label="Deadline">
        <input name="deadline" type="date" className={inputClass} />
      </Field>

      <Field label="Link (optional)">
        <input name="resourceLink" type="url" placeholder="https://…" className={inputClass} />
      </Field>

      <Field label="Attach file (optional)" className="sm:col-span-2">
        <input name="resourceFile" type="file" className="w-full text-sm" />
      </Field>

      <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
        <input type="checkbox" name="proofRequired" defaultChecked className="rounded border-slate-300" />
        Require photo/video proof
      </label>

      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit">Create task</Button>
      </div>
    </form>
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
