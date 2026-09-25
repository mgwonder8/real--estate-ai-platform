"use client";

import { useActionState, useState } from "react";
import { Camera, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitProofAction, type SubmitProofState } from "@/app/site/actions";
import { useGeolocation } from "@/lib/use-geolocation";

const initialState: SubmitProofState = { status: "idle" };

export function ProofForm({ taskId, required }: { taskId: string; required?: boolean }) {
  const [state, formAction, pending] = useActionState(submitProofAction, initialState);
  const { locating, lat, lng } = useGeolocation();
  const [preview, setPreview] = useState<string | null>(null);

  if (state.status === "success") {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800">
        <CheckCircle2 size={16} /> Photo sent
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="gpsLat" value={lat} />
      <input type="hidden" name="gpsLng" value={lng} />

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 p-3 transition hover:border-slate-300 hover:bg-slate-50">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-14 w-14 rounded-lg object-cover" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <Camera size={22} />
          </span>
        )}
        <span className="text-sm">
          <span className="block font-medium text-slate-800">{preview ? "Change photo" : "Take photo"}</span>
          {required && !preview && <span className="text-xs text-amber-700">Needed before done</span>}
        </span>
        <input
          type="file"
          name="photo"
          accept="image/*,video/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setPreview(f && f.type.startsWith("image/") ? URL.createObjectURL(f) : f ? "" : null);
          }}
        />
      </label>

      {preview !== null && (
        <>
          <input
            name="notes"
            placeholder="Note (optional)"
            className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-sm focus:border-brand-navy focus:outline-none"
          />
          {state.status === "error" && <p className="text-xs text-red-600">{state.message}</p>}
          <Button type="submit" variant="secondary" disabled={pending} className="w-full">
            {pending && <Loader2 size={15} className="animate-spin" />}
            {pending && locating ? "Getting location" : "Send photo"}
          </Button>
        </>
      )}
    </form>
  );
}
