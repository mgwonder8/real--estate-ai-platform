"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X, SearchX } from "lucide-react";
import { Card, EmptyState } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { TaskRow } from "@/components/task-row";
import { STATUS_META, STATUS_ORDER, isOverdue, sortByUrgency, firstName } from "@/lib/task-meta";
import type { Site, Staff, Task, TaskStatus } from "@/lib/data/types";

type StatusFilter = TaskStatus | "all" | "late";

export type TaskFilters = { status: StatusFilter; site: string; staff: string; q: string };

export function TaskBrowser({
  tasks,
  sites,
  staff,
  commentCounts,
  proofCounts,
  initial,
}: {
  tasks: Task[];
  sites: Site[];
  staff: Staff[];
  commentCounts: Record<string, number>;
  proofCounts: Record<string, number>;
  initial: TaskFilters;
}) {
  const [status, setStatus] = useState<StatusFilter>(initial.status);
  const [site, setSite] = useState(initial.site);
  const [person, setPerson] = useState(initial.staff);
  const [q, setQ] = useState(initial.q);

  const siteById = useMemo(() => Object.fromEntries(sites.map((s) => [s.id, s])), [sites]);
  const staffById = useMemo(() => Object.fromEntries(staff.map((s) => [s.id, s])), [staff]);
  const people = useMemo(
    () => staff.filter((s) => s.role !== "owner" && tasks.some((t) => t.assigneeIds.includes(s.id))),
    [staff, tasks]
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (site !== "all") params.set("site", site);
    if (person !== "all") params.set("staff", person);
    if (q.trim()) params.set("q", q.trim());
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/tasks?${qs}` : "/tasks");
  }, [status, site, person, q]);

  const scoped = useMemo(() => {
    const term = q.trim().toLowerCase();
    return tasks.filter((t) => {
      if (site !== "all" && t.siteId !== site) return false;
      if (person !== "all" && !t.assigneeIds.includes(person)) return false;
      if (!term) return true;
      const hay = [t.title, t.brief, siteById[t.siteId]?.name, ...t.assigneeIds.map((id) => staffById[id]?.name)]
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    });
  }, [tasks, site, person, q, siteById, staffById]);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: scoped.length, late: 0, pending: 0, in_progress: 0, completed: 0, approved: 0 };
    for (const t of scoped) {
      c[t.status] += 1;
      if (isOverdue(t)) c.late += 1;
    }
    return c;
  }, [scoped]);

  const visible = useMemo(() => {
    const list = scoped.filter((t) => (status === "all" ? true : status === "late" ? isOverdue(t) : t.status === status));
    return sortByUrgency(list);
  }, [scoped, status]);

  const anyFilter = status !== "all" || site !== "all" || person !== "all" || !!q.trim();

  const statusTabs: { key: StatusFilter; label: string; dot?: string }[] = [
    { key: "all", label: "All" },
    ...STATUS_ORDER.map((s) => ({ key: s as StatusFilter, label: STATUS_META[s].label, dot: STATUS_META[s].dot })),
    { key: "late", label: "Late", dot: "bg-red-500" },
  ];

  return (
    <div className="space-y-4">
      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {statusTabs.map((tab) => {
          const on = status === tab.key;
          if (tab.key === "late" && counts.late === 0 && !on) return null;
          return (
            <button
              key={tab.key}
              onClick={() => setStatus(tab.key)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                on ? "bg-brand-navy text-white shadow-sm" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.dot && <span className={`h-2 w-2 rounded-full ${tab.dot}`} />}
              {tab.label}
              <span className={`rounded-md px-1.5 text-xs ${on ? "bg-white/15" : "bg-slate-100 text-slate-500"}`}>
                {counts[tab.key]}
              </span>
            </button>
          );
        })}
      </div>

      <Card className="p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative lg:w-64">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tasks"
              className="h-10 w-full rounded-xl bg-slate-50 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy/15"
            />
          </div>

          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
            <Chip on={site === "all"} onClick={() => setSite("all")}>All sites</Chip>
            {sites.map((s) => (
              <Chip key={s.id} on={site === s.id} onClick={() => setSite(site === s.id ? "all" : s.id)}>
                {s.name}
              </Chip>
            ))}
          </div>

          <div className="hidden h-6 w-px bg-slate-200 lg:block" />

          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
            {people.map((p) => {
              const on = person === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPerson(on ? "all" : p.id)}
                  title={p.name}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2.5 text-xs font-medium transition ${
                    on ? "bg-brand-navy text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Avatar name={p.name} size="xs" />
                  {firstName(p.name)}
                </button>
              );
            })}
          </div>

          {anyFilter && (
            <button
              onClick={() => {
                setStatus("all");
                setSite("all");
                setPerson("all");
                setQ("");
              }}
              className="flex shrink-0 items-center gap-1 self-start rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 lg:ml-auto lg:self-auto"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        {visible.length === 0 ? (
          <EmptyState icon={<SearchX size={20} />} title={tasks.length === 0 ? "No tasks yet" : "Nothing matches these filters"} />
        ) : (
          <div className="divide-y divide-slate-100">
            {visible.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                siteName={site === "all" ? siteById[t.siteId]?.name : undefined}
                assigneeNames={t.assigneeIds.map((id) => staffById[id]?.name ?? "?")}
                comments={commentCounts[t.id]}
                proofs={proofCounts[t.id]}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
        on ? "bg-brand-navy text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}
