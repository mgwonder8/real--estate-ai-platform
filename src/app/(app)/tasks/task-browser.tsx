"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X, SearchX, Camera, MessageSquare, UserRound, Building2, List, Users, CheckCircle2 } from "lucide-react";
import { Card, EmptyState } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { TaskLine, TaskLineHeader } from "@/components/task-line";
import { TaskCheck } from "@/components/task-check";
import { toggleTaskDoneAction } from "@/app/(app)/tasks/actions";
import { checkStateOf, isFinished, isOpen, isOverdue, nextCheckStatus, serialLabel, sortByUrgency, firstName } from "@/lib/task-meta";
import { roleLabel } from "@/lib/roles";
import { assignerName } from "@/lib/roles";
import { useT } from "@/lib/i18n/client";
import type { MessageKey } from "@/lib/i18n/messages";
import type { Site, Staff, Task } from "@/lib/data/types";

type View = "all" | "open" | "review" | "done" | "late";

export type GroupBy = "person" | "site" | "none";

export type TaskFilters = { status: View; site: string; staff: string; by: string; q: string; group: GroupBy };

const GROUPS: { key: GroupBy; label: MessageKey; icon: typeof Users }[] = [
  { key: "person", label: "tasks.groupPerson", icon: Users },
  { key: "site", label: "tasks.groupSite", icon: Building2 },
  { key: "none", label: "tasks.groupNone", icon: List },
];

const VIEWS: { key: View; label: MessageKey; dot?: string }[] = [
  { key: "all", label: "views.all" },
  { key: "open", label: "views.open", dot: "bg-amber-400" },
  { key: "review", label: "views.review", dot: "bg-sky-500" },
  { key: "done", label: "views.done", dot: "bg-emerald-500" },
  { key: "late", label: "views.late", dot: "bg-red-500" },
];

function inView(t: Task, view: View): boolean {
  if (view === "open") return isOpen(t);
  if (view === "review") return t.status === "completed";
  if (view === "done") return t.status === "approved";
  if (view === "late") return isOverdue(t);
  return true;
}

/** Open work first (most urgent on top), then awaiting approval, then done (newest first). */
function arrange(tasks: Task[]): Task[] {
  const open = sortByUrgency(tasks.filter(isOpen));
  const review = tasks.filter((t) => t.status === "completed").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const done = tasks.filter((t) => t.status === "approved").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return [...open, ...review, ...done];
}

export function TaskBrowser({
  tasks,
  sites,
  staff,
  myRole,
  commentCounts,
  proofCounts,
  initial,
}: {
  tasks: Task[];
  sites: Site[];
  staff: Staff[];
  myRole: string;
  commentCounts: Record<string, number>;
  proofCounts: Record<string, number>;
  initial: TaskFilters;
}) {
  const t = useT();
  const [view, setView] = useState<View>(initial.status);
  const [site, setSite] = useState(initial.site);
  const [person, setPerson] = useState(initial.staff);
  const [by, setBy] = useState(initial.by);
  const [q, setQ] = useState(initial.q);
  const [group, setGroup] = useState<GroupBy>(initial.group);

  const siteById = useMemo(() => Object.fromEntries(sites.map((s) => [s.id, s])), [sites]);
  const staffById = useMemo(() => Object.fromEntries(staff.map((s) => [s.id, s])), [staff]);
  const people = useMemo(
    () => staff.filter((s) => s.role !== "owner" && tasks.some((t) => t.assigneeIds.includes(s.id))),
    [staff, tasks]
  );
  const assigners = useMemo(() => {
    const ids = Array.from(new Set(tasks.map((t) => t.createdBy)));
    return ids.map((id) => ({ id, name: assignerName(staffById[id], t) })).sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks, staffById, t]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (view !== "all") params.set("status", view);
    if (site !== "all") params.set("site", site);
    if (person !== "all") params.set("staff", person);
    if (by !== "all") params.set("by", by);
    if (q.trim()) params.set("q", q.trim());
    if (group !== "person") params.set("group", group);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/tasks?${qs}` : "/tasks");
  }, [view, site, person, by, q, group]);

  const scoped = useMemo(() => {
    const term = q.trim().toLowerCase().replace(/^#/, "");
    return tasks.filter((task) => {
      if (site !== "all" && task.siteId !== site) return false;
      if (person !== "all" && !task.assigneeIds.includes(person)) return false;
      if (by !== "all" && task.createdBy !== by) return false;
      if (!term) return true;
      if (String(task.serial) === term) return true;
      const hay = [task.title, task.brief, siteById[task.siteId]?.name, assignerName(staffById[task.createdBy], t), ...task.assigneeIds.map((id) => staffById[id]?.name)]
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    });
  }, [tasks, site, person, by, q, siteById, staffById, t]);

  const counts = useMemo(
    () => Object.fromEntries(VIEWS.map((v) => [v.key, scoped.filter((t) => inView(t, v.key)).length])) as Record<View, number>,
    [scoped]
  );

  const visible = useMemo(() => arrange(scoped.filter((t) => inView(t, view))), [scoped, view]);
  const groups = useMemo(() => {
    if (group === "none") return [{ key: "all", kind: "none" as const, title: "", sub: "", tasks: visible }];
    if (group === "site") {
      return sites
        .map((s) => ({ key: s.id, kind: "site" as const, title: s.name, sub: s.address, tasks: visible.filter((task) => task.siteId === s.id) }))
        .filter((g) => g.tasks.length > 0);
    }
    const ids = Array.from(new Set(visible.flatMap((task) => task.assigneeIds)));
    const byPerson = ids
      .map((id) => {
        const member = staffById[id];
        return {
          key: id,
          kind: "person" as const,
          title: member?.name ?? "?",
          sub: member ? roleLabel(member.role, t) : "",
          tasks: visible.filter((task) => task.assigneeIds.includes(id)),
        };
      })
      .sort((a, b) => b.tasks.filter(isOpen).length - a.tasks.filter(isOpen).length || a.title.localeCompare(b.title));
    const nobody = visible.filter((task) => task.assigneeIds.length === 0);
    return nobody.length
      ? [...byPerson, { key: "nobody", kind: "person" as const, title: t("common.unassigned"), sub: "", tasks: nobody }]
      : byPerson;
  }, [group, visible, sites, staffById, t]);

  const anyFilter = view !== "all" || site !== "all" || person !== "all" || by !== "all" || !!q.trim();

  return (
    <div className="space-y-4">
      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {VIEWS.map((tab) => {
          const on = view === tab.key;
          if (tab.key === "late" && counts.late === 0 && !on) return null;
          return (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                on ? "bg-brand-navy text-white shadow-sm" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.dot && <span className={`h-2 w-2 rounded-full ${tab.dot}`} />}
              {t(tab.label)}
              <span className={`rounded-md px-1.5 text-xs ${on ? "bg-white/15" : "bg-slate-100 text-slate-500"}`}>{counts[tab.key]}</span>
            </button>
          );
        })}
      </div>

      <Card className="p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative lg:w-60">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("tasks.search")}
              className="h-11 w-full rounded-xl bg-slate-50 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy/15 sm:h-10"
            />
          </div>

          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
            <Chip on={site === "all"} onClick={() => setSite("all")}>{t("tasks.allSites")}</Chip>
            {sites.map((s) => (
              <Chip key={s.id} on={site === s.id} onClick={() => setSite(site === s.id ? "all" : s.id)}>
                {s.name}
              </Chip>
            ))}
          </div>

          <label className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-slate-50 px-3 text-sm text-slate-600 focus-within:ring-2 focus-within:ring-brand-navy/15 sm:h-10">
            <UserRound size={15} className="text-slate-400" />
            <span className="whitespace-nowrap text-xs font-medium text-slate-500">{t("tasks.assignedBy")}</span>
            <select
              value={by}
              onChange={(e) => setBy(e.target.value)}
              className="min-w-0 bg-transparent text-sm font-medium text-slate-800 focus:outline-none"
            >
              <option value="all">{t("tasks.anyone")}</option>
              {assigners.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>

          {anyFilter && (
            <button
              onClick={() => {
                setView("all");
                setSite("all");
                setPerson("all");
                setBy("all");
                setQ("");
              }}
              className="flex min-h-10 shrink-0 items-center gap-1 self-start rounded-lg px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:bg-slate-100 lg:ml-auto lg:min-h-0 lg:self-auto lg:px-2 lg:text-xs"
            >
              <X size={13} /> {t("tasks.clear")}
            </button>
          )}
        </div>

        {people.length > 0 && (
          <div className="no-scrollbar mt-3 flex items-center gap-1.5 overflow-x-auto border-t border-slate-100 pt-3">
            <span className="mr-1 shrink-0 text-xs font-medium text-slate-400">{t("tasks.assignedTo")}</span>
            {people.map((p) => {
              const on = person === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPerson(on ? "all" : p.id)}
                  title={p.name}
                  className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-full py-0.5 pl-1 pr-3.5 text-[13px] font-medium transition sm:min-h-0 sm:pl-0.5 sm:pr-2.5 sm:text-xs ${
                    on ? "bg-brand-navy text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Avatar name={p.name} size="xs" />
                  {firstName(p.name)}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">{t("tasks.groupBy")}</p>
        <div role="radiogroup" aria-label={t("tasks.groupBy")} className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-slate-200">
          {GROUPS.map(({ key, label, icon: Icon }) => {
            const on = group === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setGroup(key)}
                className={`flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition ${
                  on ? "bg-brand-navy text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Icon size={14} />
                {t(label)}
              </button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState icon={<SearchX size={20} />} title={tasks.length === 0 ? t("tasks.none") : t("tasks.noMatch")} />
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((g, gi) => (
            <Card key={g.key} className="animate-fade-up overflow-hidden">
              {g.kind !== "none" && (
                <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3 sm:px-5">
                  {g.kind === "person" ? (
                    <Avatar name={g.title} size="md" />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-brand-gold">
                      <Building2 size={18} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-[15px] font-semibold text-slate-900">{g.title}</p>
                    {g.sub && <p className="break-words text-xs text-slate-500">{g.sub}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 text-xs font-semibold">
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700 ring-1 ring-inset ring-amber-200">
                      {t("sd.openCount", { n: g.tasks.filter(isOpen).length })}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      <CheckCircle2 size={12} /> {g.tasks.filter(isFinished).length}
                    </span>
                  </div>
                </div>
              )}
              {gi === 0 || g.kind === "none" ? <TaskLineHeader /> : null}
              <div className="divide-y divide-slate-100">
                {g.tasks.map((task) => {
                  const state = checkStateOf(task.status);
                  const next = nextCheckStatus(task.status, myRole);
                  return (
                    <TaskLine
                      key={task.id}
                      columns
                      serial={serialLabel(task.serial)}
                      title={task.title}
                      remark={task.brief}
                      priority={task.priority}
                      state={state}
                      due={task}
                      href={`/tasks/${task.id}`}
                      siteName={g.kind === "site" ? undefined : siteById[task.siteId]?.name}
                      byName={assignerName(staffById[task.createdBy], t)}
                      toNames={task.assigneeIds.map((id) => staffById[id]?.name ?? "?")}
                      extra={<Counts comments={commentCounts[task.id]} proofs={proofCounts[task.id]} />}
                      check={
                        <TaskCheck
                          id={task.id}
                          state={state}
                          next={next ? checkStateOf(next) : null}
                          action={toggleTaskDoneAction}
                          label={state === "full" ? t("tasks.reopen", { title: task.title }) : t("tasks.markDone", { title: task.title })}
                        />
                      }
                    />
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Counts({ comments = 0, proofs = 0 }: { comments?: number; proofs?: number }) {
  if (!comments && !proofs) return null;
  return (
    <>
      {comments > 0 && (
        <span className="inline-flex items-center gap-1 text-slate-400">
          <MessageSquare size={11} /> {comments}
        </span>
      )}
      {proofs > 0 && (
        <span className="inline-flex items-center gap-1 text-slate-400">
          <Camera size={11} /> {proofs}
        </span>
      )}
    </>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-10 shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-medium transition sm:min-h-0 sm:px-3 sm:py-1.5 sm:text-xs ${
        on ? "bg-brand-navy text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}
