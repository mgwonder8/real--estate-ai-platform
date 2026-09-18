"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { submitProofAction, type SubmitProofState } from "@/app/site/actions";
import { useGeolocation } from "@/lib/use-geolocation";

const initialState: SubmitProofState = { status: "idle" };

export function ProofForm({ taskId }: { taskId: string }) {
  const [state, formAction, pending] = useActionState(submitProofAction, initialState);
  const { locating, lat, lng, denied } = useGeolocation();

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
      <input type="hidden" name="gpsLat" value={lat} />
      <input type="hidden" name="gpsLng" value={lng} />

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
      {denied && <p className="text-xs text-amber-700">Location permission denied — proof will be submitted without GPS tagging.</p>}
      {state.status === "error" && <p className="text-xs text-red-600">{state.message}</p>}
      <Button type="submit" variant="secondary" disabled={pending} className="w-full">
        {pending ? (locating ? "Getting location…" : "Submitting…") : "Submit Proof"}
      </Button>
    </form>
  );
}
