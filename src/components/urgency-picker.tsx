"use client";

import { UrgencyDot } from "@/components/ui/status-pill";
import { PRIORITY_META, PRIORITY_OPTIONS } from "@/lib/task-meta";
import type { TaskPriority } from "@/lib/data/types";

export function UrgencyPicker({
  value,
  onChange,
  compact = false,
}: {
  value: TaskPriority;
  onChange: (p: TaskPriority) => void;
  compact?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Urgency" className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">
      {PRIORITY_OPTIONS.map((p) => {
        const on = value === p;
        return (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(p)}
            className={`flex items-center justify-center gap-1.5 rounded-lg font-medium transition ${compact ? "py-1.5 text-xs" : "py-2 text-sm"} ${
              on ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <UrgencyDot priority={p} still={!on} />
            {PRIORITY_META[p].label}
          </button>
        );
      })}
    </div>
  );
}
