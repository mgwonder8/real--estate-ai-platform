"use client";

import { useRef, useState, useTransition } from "react";
import { CheckCircle2, Loader2, Lock, Plus, Trash2 } from "lucide-react";
import { ExpandableTask } from "@/components/expandable-task";
import { TaskCheck } from "@/components/task-check";
import { UrgencyPicker } from "@/components/urgency-picker";
import { sortByUrgency, timeAgo } from "@/lib/task-meta";
import { useT } from "@/lib/i18n/client";
import { addPersonalTaskAction, deletePersonalTaskAction, togglePersonalTaskAction } from "@/app/(app)/personal/actions";
import type { PersonalTask, TaskPriority } from "@/lib/data/types";

export function PersonalTaskBoard({
  me,
  partner,
  tasks,
}: {
  me: string;
  partner: { id: string; name: string };
  tasks: PersonalTask[];
}) {
  const tr = useT();
  const partnerFirst = partner.name.split(" ")[0];
  const [title, setTitle] = useState("");
  const [remark, setRemark] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [forWhom, setForWhom] = useState<"them" | "me">("them");
  const [error, setError] = useState<string | null>(null);
  const [adding, startAdding] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const titleRef = useRef<HTMLInputElement>(null);

  const serialOf = new Map(tasks.map((t, i) => [t.id, `P${i + 1}`]));
  // sortByUrgency needs deadline/status; personal tasks have neither, so give them neutral values.
  const open = sortByUrgency(tasks.filter((t) => !t.done).map((t) => ({ ...t, deadline: "", status: "pending" as const })));
  const done = tasks.filter((t) => t.done).sort((a, b) => b.doneAt.localeCompare(a.doneAt));

  const who = (id: string) => (id === me ? tr("common.you") : partnerFirst);

  function submit() {
    if (!title.trim() || adding) return;
    setError(null);
    const fd = new FormData();
    fd.set("partnerId", partner.id);
    fd.set("title", title.trim());
    fd.set("remark", remark.trim());
    fd.set("priority", priority);
    fd.set("for", forWhom);
    startAdding(async () => {
      try {
        await addPersonalTaskAction(fd);
        setTitle("");
        setRemark("");
        setPriority("normal");
        titleRef.current?.focus();
      } catch (err) {
        setError(err instanceof Error ? err.message : tr("pe.couldNotAdd"));
      }
    });
  }

  function render(t: PersonalTask) {
    return (
      <ExpandableTask
        key={t.id}
        serial={serialOf.get(t.id) ?? ""}
        title={t.title}
        remark={t.remark}
        priority={t.priority}
        state={t.done ? "full" : "none"}
        byName={who(t.fromId)}
        toNames={[t.forId === me ? tr("common.you") : partnerFirst]}
        check={
          <TaskCheck
            id={t.id}
            state={t.done ? "full" : "none"}
            next={t.done ? "none" : "full"}
            action={togglePersonalTaskAction}
            label={t.done ? tr("tasks.reopen", { title: t.title }) : tr("tasks.markDone", { title: t.title })}
          />
        }
      >
        <div className="space-y-3 text-sm">
          {t.remark && <p className="whitespace-pre-line leading-relaxed text-slate-700">{t.remark}</p>}
          <p className="text-xs text-slate-500">
            {tr("pe.addedBy", { who: who(t.fromId), when: timeAgo(t.createdAt, tr) })}
            {t.done && t.doneAt ? ` ${tr("pe.doneWhen", { when: timeAgo(t.doneAt, tr) })}` : ""}
          </p>
          {t.fromId === me && (
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                if (!confirm(tr("pe.confirmDelete", { title: t.title }))) return;
                startDeleting(async () => {
                  try {
                    await deletePersonalTaskAction(t.id);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : tr("pe.couldNotDelete"));
                  }
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={13} /> {tr("pe.delete")}
            </button>
          )}
        </div>
      </ExpandableTask>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="space-y-5 p-3 sm:p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/80"
        >
          <div className="flex items-center gap-2">
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={tr("pe.addWith", { name: partnerFirst })}
              className="h-11 min-w-0 flex-1 rounded-xl bg-slate-50 px-3.5 text-[15px] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy/15"
            />
            <button
              type="submit"
              disabled={!title.trim() || adding}
              aria-label={tr("pe.add")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-white transition hover:bg-brand-navy-soft active:scale-95 disabled:opacity-40"
            >
              {adding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={19} strokeWidth={2.5} />}
            </button>
          </div>

          {title.trim() && (
            <div className="animate-fade-up mt-3 space-y-3">
              <input
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder={tr("nt.remarkPh")}
                className="h-10 w-full rounded-xl bg-slate-50 px-3.5 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy/15"
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="sm:w-80">
                  <UrgencyPicker value={priority} onChange={setPriority} compact />
                </div>
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 sm:ml-auto">
                  {(["them", "me"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setForWhom(f)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        forWhom === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                      }`}
                    >
                      {f === "me" ? tr("pe.forMe") : tr("pe.forThem", { name: partnerFirst })}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        </form>

        <section>
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{tr("pe.todo")} · {open.length}</p>
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/80">
            {open.length === 0 ? (
              <p className="flex flex-col items-center gap-2 py-10 text-sm text-slate-400">
                {tasks.length === 0 ? (
                  <>
                    <Lock size={20} />
                    {tr("pe.noneYet")}
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} className="text-emerald-500" />
                    {tr("pe.allDone")}
                  </>
                )}
              </p>
            ) : (
              <div className="divide-y divide-slate-100">{open.map(render)}</div>
            )}
          </div>
        </section>

        {done.length > 0 && (
          <section>
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">{tr("pe.finished")} · {done.length}</p>
            <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-emerald-100">
              <div className="divide-y divide-emerald-100">{done.map(render)}</div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
