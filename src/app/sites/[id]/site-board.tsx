"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { DueBadge, PriorityDot } from "@/components/ui/status-pill";
import { STATUS_META, STATUS_ORDER, firstName, sortByUrgency } from "@/lib/task-meta";
import type { Staff, Task } from "@/lib/data/types";

export function SiteBoard({ tasks, people, staffById }: { tasks: Task[]; people: Staff[]; staffById: Record<string, Staff> }) {
  const [person, setPerson] = useState("all");

  const visible = useMemo(
    () => (person === "all" ? tasks : tasks.filter((t) => t.assigneeIds.includes(person))),
    [tasks, person]
  );

  return (
    <div>
      {people.length > 1 && (
        <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto">
          <button
            onClick={() => setPerson("all")}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              person === "all" ? "bg-brand-navy text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            Everyone
          </button>
          {people.map((p) => {
            const on = person === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPerson(on ? "all" : p.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-3 text-xs font-medium transition ${
                  on ? "bg-brand-navy text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                <Avatar name={p.name} size="xs" />
                {firstName(p.name)}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {STATUS_ORDER.map((status) => {
          const col = sortByUrgency(visible.filter((t) => t.status === status));
          const m = STATUS_META[status];
          return (
            <div key={status} className={`rounded-2xl p-2.5 ${m.soft}`}>
              <div className="mb-2 flex items-center justify-between px-1.5 pt-0.5">
                <span className={`flex items-center gap-2 text-sm font-semibold ${m.text}`}>
                  <span className={`h-2 w-2 rounded-full ${m.dot}`} />
                  {m.label}
                </span>
                <span className="rounded-md bg-white/70 px-1.5 text-xs font-medium text-slate-500">{col.length}</span>
              </div>
              <div className="space-y-2">
                {col.length === 0 && <p className="px-1.5 py-3 text-center text-xs text-slate-400">Empty</p>}
                {col.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tasks/${t.id}`}
                    className="block rounded-xl bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-1.5">
                        <PriorityDot priority={t.priority} />
                      </span>
                      <p className="line-clamp-2 flex-1 text-sm font-medium text-slate-900">{t.title}</p>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <AvatarStack names={t.assigneeIds.map((id) => staffById[id]?.name ?? "?")} />
                      <DueBadge task={t} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
