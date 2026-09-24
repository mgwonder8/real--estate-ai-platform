import type { Staff } from "@/lib/data/types";

export function AssigneeCheckboxes({
  staff,
  defaultSelected = [],
}: {
  staff: Staff[];
  defaultSelected?: string[];
}) {
  return (
    <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-300 p-2">
      {staff.length === 0 && <p className="px-1 py-1 text-sm text-slate-400">No staff yet.</p>}
      {staff.map((s) => (
        <label key={s.id} className="flex items-center gap-2 rounded px-1 py-1 text-sm hover:bg-slate-50">
          <input
            type="checkbox"
            name="assigneeIds"
            value={s.id}
            defaultChecked={defaultSelected.includes(s.id)}
            className="rounded border-slate-300"
          />
          {s.name} <span className="text-xs text-slate-400">({s.role.replace("_", " ")})</span>
        </label>
      ))}
    </div>
  );
}
