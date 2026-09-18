"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { VoiceInputButton } from "@/components/voice-input-button";
import { parseTaskChatAction, type ChatParseState } from "@/app/dashboard/actions";
import { createTaskAction } from "@/app/tasks/actions";
import type { Site, Staff } from "@/lib/data/types";

const initialState: ChatParseState = { status: "idle" };

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none";

export function AiTaskChat({ sites, staff }: { sites: Site[]; staff: Staff[] }) {
  const [state, formAction, pending] = useActionState(parseTaskChatAction, initialState);
  const [dismissed, setDismissed] = useState(false);
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const showDraft = state.status === "success" && !dismissed;

  return (
    <div className="space-y-3">
      <form
        ref={formRef}
        action={(fd) => {
          setDismissed(false);
          formAction(fd);
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <input
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder='Try: "Urgent — check waterproofing on 5th floor at One World, assign to Ramesh, due Friday"'
          className={`${inputClass} flex-1`}
          required
        />
        <VoiceInputButton
          onTranscribed={(text) => {
            setMessage(text);
            requestAnimationFrame(() => formRef.current?.requestSubmit());
          }}
        />
        <Button type="submit" disabled={pending} className="sm:w-auto">
          {pending ? "Thinking…" : "Parse with AI"}
        </Button>
      </form>

      {state.status === "error" && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          {state.message}
        </p>
      )}

      {showDraft && (
        <div className="rounded-lg border border-brand-gold/40 bg-amber-50/40 p-4">
          <p className="mb-3 text-xs font-medium text-slate-600">
            AI read: “{state.draft.notes ? state.draft.notes : "looks clear"}” — review before creating.
            {state.draft.confidence !== "high" && (
              <span className="ml-1 text-amber-700">(confidence: {state.draft.confidence})</span>
            )}
          </p>
          <form
            action={async (fd) => {
              await createTaskAction(fd);
              setDismissed(true);
            }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">Title</label>
              <input name="title" defaultValue={state.draft.title} required className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">Brief</label>
              <textarea name="brief" defaultValue={state.draft.brief} rows={2} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Site</label>
              <select name="siteId" defaultValue={state.draft.siteId ?? ""} required className={inputClass}>
                <option value="">Select site</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Assign to</label>
              <select name="assigneeId" defaultValue={state.draft.assigneeId ?? ""} required className={inputClass}>
                <option value="">Select staff</option>
                {staff.filter((s) => s.active).map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role.replace("_", " ")})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Priority</label>
              <select name="priority" defaultValue={state.draft.priority} className={inputClass}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Deadline</label>
              <input name="deadline" type="date" defaultValue={state.draft.deadline ?? ""} className={inputClass} />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
              <input type="checkbox" name="proofRequired" defaultChecked={state.draft.proofRequired} className="rounded border-slate-300" />
              Require photo/video proof before this task can be marked complete
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit">Create Task</Button>
              <Button type="button" variant="ghost" onClick={() => setDismissed(true)}>Discard</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
