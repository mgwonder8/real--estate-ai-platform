"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Check, CornerDownLeft, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { VoiceInputButton } from "@/components/voice-input-button";
import { AssigneePicker } from "@/components/assignee-picker";
import { parseTaskChatAction, type ChatParseState } from "@/app/dashboard/actions";
import { createTaskAction } from "@/app/tasks/actions";
import type { Site, Staff, TaskPriority } from "@/lib/data/types";

const initialState: ChatParseState = { status: "idle" };

export function AiTaskChat({ sites, staff }: { sites: Site[]; staff: Staff[] }) {
  const [state, formAction, parsing] = useActionState(parseTaskChatAction, initialState);
  const [dismissedFor, setDismissedFor] = useState<ChatParseState | null>(null);
  const [created, setCreated] = useState(false);
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const showDraft = state.status === "success" && dismissedFor !== state;

  return (
    <div>
      <form
        ref={formRef}
        action={(fd) => {
          setCreated(false);
          formAction(fd);
        }}
        className="flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-lg shadow-black/10"
      >
        <input
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type or speak a task"
          className="h-10 min-w-0 flex-1 bg-transparent px-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
          required
        />
        <VoiceInputButton
          onTranscribed={(text) => {
            setMessage(text);
            requestAnimationFrame(() => formRef.current?.requestSubmit());
          }}
        />
        <Button type="submit" disabled={parsing || !message.trim()} className="shrink-0">
          {parsing ? <Loader2 size={16} className="animate-spin" /> : <CornerDownLeft size={16} />}
          Enter
        </Button>
      </form>

      {created && !showDraft && (
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-100">
          <Check size={14} /> Task created
        </p>
      )}

      {state.status === "error" && dismissedFor !== state && (
        <p className="mt-3 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-100">{state.message}</p>
      )}

      {showDraft && (
        <DraftCard
          key={state.rawMessage}
          draft={state.draft}
          sites={sites}
          staff={staff}
          onCancel={() => setDismissedFor(state)}
          onCreated={() => {
            setDismissedFor(state);
            setCreated(true);
            setMessage("");
          }}
        />
      )}
    </div>
  );
}

function DraftCard({
  draft,
  sites,
  staff,
  onCancel,
  onCreated,
}: {
  draft: Extract<ChatParseState, { status: "success" }>["draft"];
  sites: Site[];
  staff: Staff[];
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [siteId, setSiteId] = useState(draft.siteId ?? "");
  const [assignees, setAssignees] = useState<string[]>(draft.assigneeIds.filter((id) => staff.some((s) => s.id === id)));
  const [priority, setPriority] = useState<TaskPriority>(draft.priority);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const ready = !!siteId && assignees.length > 0;

  return (
    <form
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          try {
            await createTaskAction(fd);
            onCreated();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not create the task.");
          }
        });
      }}
      className="animate-fade-up mt-3 space-y-4 rounded-2xl bg-white p-4 text-slate-900 shadow-xl sm:p-5"
    >
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="priority" value={priority} />
      <input type="hidden" name="proofRequired" value={draft.proofRequired ? "on" : ""} />

      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-gold">
          <Sparkles size={13} /> Check and create
        </span>
        <button type="button" onClick={onCancel} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
          <X size={16} />
        </button>
      </div>

      <input name="title" defaultValue={draft.title} required className={`${inputClass} text-base font-medium`} />
      {draft.brief && draft.brief !== draft.title && (
        <textarea name="brief" defaultValue={draft.brief} rows={2} className={`${inputClass} resize-none`} />
      )}

      <div className="flex flex-wrap gap-1.5">
        {sites.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSiteId(s.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              siteId === s.id ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      <AssigneePicker staff={staff} sites={sites} siteId={siteId} selected={assignees} onChange={setAssignees} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {(["low", "normal", "urgent"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                priority === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <input
          name="deadline"
          type="date"
          defaultValue={draft.deadline ?? ""}
          aria-label="Due date"
          className="h-9 rounded-xl border border-slate-200 px-2.5 text-sm text-slate-700 focus:border-brand-navy focus:outline-none"
        />
        <Button type="submit" disabled={!ready || pending} className="ml-auto">
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Create
        </Button>
      </div>

      {draft.confidence !== "high" && draft.notes && <p className="text-xs text-amber-700">{draft.notes}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
