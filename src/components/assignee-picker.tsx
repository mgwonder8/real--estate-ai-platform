"use client";

import { Check } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import type { Site, Staff } from "@/lib/data/types";

export function AssigneePicker({
  staff,
  sites = [],
  siteId,
  selected,
  onChange,
}: {
  staff: Staff[];
  sites?: Site[];
  siteId?: string;
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const siteById = Object.fromEntries(sites.map((s) => [s.id, s]));
  const ordered = [...staff].sort((a, b) => {
    const am = siteId && a.siteId === siteId ? 0 : 1;
    const bm = siteId && b.siteId === siteId ? 0 : 1;
    return am - bm || a.name.localeCompare(b.name);
  });

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  if (staff.length === 0) return <p className="text-sm text-slate-400">No team members yet.</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {selected.map((id) => (
        <input key={id} type="hidden" name="assigneeIds" value={id} />
      ))}
      {ordered.map((s) => {
        const on = selected.includes(s.id);
        const atSite = !!siteId && s.siteId === siteId;
        const sub = s.role === "office_staff" ? "Office" : siteById[s.siteId]?.name;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => toggle(s.id)}
            aria-pressed={on}
            className={`group flex items-center gap-2.5 rounded-2xl border py-1.5 pl-1.5 pr-3.5 text-left transition active:scale-[0.98] ${
              on
                ? "border-brand-navy bg-brand-navy text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
            }`}
          >
            <span className="relative">
              <Avatar name={s.name} size="sm" />
              {on && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-gold text-brand-navy ring-2 ring-brand-navy">
                  <Check size={10} strokeWidth={3.5} />
                </span>
              )}
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-medium">{s.name}</span>
              {sub && (
                <span className={`block text-[11px] ${on ? "text-slate-300" : atSite ? "text-emerald-600" : "text-slate-400"}`}>
                  {sub}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
