"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { submitProofAction, type SubmitProofState } from "@/app/site/actions";

const initialState: SubmitProofState = { status: "idle" };

export function ProofForm({ taskId }: { taskId: string }) {
  const [state, formAction, pending] = useActionState(submitProofAction, initialState);
  const [locating, setLocating] = useState(() => typeof navigator !== "undefined" && !!navigator.geolocation);
  const latRef = useRef<HTMLInputElement>(null);
  const lngRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (latRef.current) latRef.current.value = String(pos.coords.latitude);
        if (lngRef.current) lngRef.current.value = String(pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }, []);

  if (state.status === "success") {
    return (
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-200">
        Proof submitted.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <input type="hidden" name="taskId" value={taskId} />
      <input ref={latRef} type="hidden" name="gpsLat" />
      <input ref={lngRef} type="hidden" name="gpsLng" />

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Photo / video</label>
        <input
          type="file"
          name="photo"
          accept="image/*,video/*"
          capture="environment"
          className="w-full text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Notes</label>
        <textarea
          name="notes"
          rows={2}
          placeholder="Progress, issues, materials used…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none"
        />
      </div>
      {state.status === "error" && <p className="text-xs text-red-600">{state.message}</p>}
      <Button type="submit" variant="secondary" disabled={pending} className="w-full">
        {pending ? (locating ? "Getting location…" : "Submitting…") : "Submit Proof"}
      </Button>
    </form>
  );
}
