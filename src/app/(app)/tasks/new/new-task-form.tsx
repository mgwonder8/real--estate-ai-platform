"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronDown, Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { inputClass } from "@/components/ui/field";
import { AssigneePicker } from "@/components/assignee-picker";
import { UrgencyPicker } from "@/components/urgency-picker";
import { VoiceInputButton } from "@/components/voice-input-button";
import { createTaskAction } from "@/app/(app)/tasks/actions";
import type { Site, Staff, TaskPriority } from "@/lib/data/types";

function isoInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const QUICK_DATES = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
];


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
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [siteId, setSiteId] = useState(presetSiteId ?? (sites.length === 1 ? sites[0].id : ""));
  const [assignees, setAssignees] = useState<string[]>([]);
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [deadline, setDeadline] = useState("");
  const [brief, setBrief] = useState("");
  const [more, setMore] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const missing = !title.trim() ? "Add a task name" : !siteId ? "Pick a site" : assignees.length === 0 ? "Pick who does it" : null;

  function pickSite(id: string) {
    setSiteId(id);
    if (assignees.length === 0) {
      const onSite = staff.filter((s) => s.siteId === id && s.role === "site_staff").map((s) => s.id);
      if (onSite.length === 1) setAssignees(onSite);
    }
  }

  return (
    <form
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          try {
            await createTaskAction(fd);
            router.push(presetSiteId ? `/sites/${presetSiteId}` : "/tasks");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not create the task.");
          }
        });
      }}
      className="space-y-4 pb-24"
    >
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="priority" value={priority} />
      <input type="hidden" name="deadline" value={deadline} />

      <Card className="p-5">
        <Step n={1} label="Task name" done={!!title.trim()} />
        <div className="flex items-center gap-2">
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            placeholder="e.g. Fix plaster on Block B"
            className={`${inputClass} !py-3 text-base`}
          />
          <VoiceInputButton size="lg" onTranscribed={(t) => setTitle(t)} />
        </div>
        <input
          name="brief"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Remark, one line (optional)"
          className={`${inputClass} mt-2`}
        />
      </Card>

      <Card className="p-5">
        <Step n={2} label="Which site?" done={!!siteId} />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {sites.map((s) => {
            const on = siteId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => pickSite(s.id)}
                aria-pressed={on}
                className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
                  on ? "border-brand-navy bg-brand-navy/[0.04] ring-2 ring-brand-navy" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${on ? "bg-brand-navy text-brand-gold" : "bg-slate-100 text-slate-500"}`}>
                  <Building2 size={17} />
                </span>
                <span className="min-w-0">
                  <span className="block break-words text-sm font-semibold text-slate-900">{s.name}</span>
                  {s.address && <span className="block break-words text-xs text-slate-500">{s.address}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <Step n={3} label="Who will do it?" done={assignees.length > 0} hint="Pick one or more" />
        <AssigneePicker staff={staff} sites={sites} siteId={siteId} selected={assignees} onChange={setAssignees} />
      </Card>

      <Card className="p-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-800">Urgency</p>
            <UrgencyPicker value={priority} onChange={setPriority} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-800">Due</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_DATES.map((q) => {
                const value = isoInDays(q.days);
                const on = deadline === value;
                return (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => setDeadline(on ? "" : value)}
                    className={`min-h-11 rounded-lg px-3.5 py-2 text-sm font-medium transition sm:min-h-0 ${
                      on ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {q.label}
                  </button>
                );
              })}
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                aria-label="Pick a date"
                className="min-h-11 min-w-0 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 focus:border-brand-navy focus:outline-none sm:min-h-0 sm:px-2"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMore((v) => !v)}
          className="mt-4 flex min-h-11 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ChevronDown size={16} className={`transition ${more ? "rotate-180" : ""}`} />
          More options
        </button>

        <div className={more ? "mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2" : "hidden"}>
          <input name="resourceLink" type="url" placeholder="Link (optional)" className={inputClass} />
          <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3.5 py-2.5 text-sm text-slate-500 hover:bg-slate-50">
            <Paperclip size={16} />
            <span className="min-w-0 break-all">{fileName || "Attach a file"}</span>
            <input
              name="resourceFile"
              type="file"
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            />
          </label>
          <label className="flex items-center gap-2.5 text-sm text-slate-700 sm:col-span-2">
            <input type="checkbox" name="proofRequired" defaultChecked className="h-4 w-4 rounded accent-brand-navy" />
            Ask for a photo when done
          </label>
        </div>
      </Card>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-100">{error}</p>
      )}

      <div className="fixed inset-x-0 bottom-[64px] z-10 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:left-64">
        <div className="mx-auto flex max-w-3xl items-center justify-end gap-3">
          {missing && <span className="mr-auto text-sm text-slate-400">{missing}</span>}
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={!!missing || pending} size="lg" className="min-w-36">
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Create task
          </Button>
        </div>
      </div>
    </form>
  );
}

function Step({ n, label, done, hint }: { n: number; label: string; done: boolean; hint?: string }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
          done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
        }`}
      >
        {done ? <Check size={13} strokeWidth={3} /> : n}
      </span>
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
  );
}
