"use client";

import { useActionState, useState } from "react";
import { Camera, CheckCircle2, Loader2, Send } from "lucide-react";
import { submitProofAction, type SubmitProofState } from "@/app/(app)/site/actions";
import { useGeolocation } from "@/lib/use-geolocation";
import { useT } from "@/lib/i18n/client";

const initialState: SubmitProofState = { status: "idle" };

/** One big button: pick or take a photo, then send it. Sending finishes the task and asks the office to approve. */
export function ProofForm({ taskId, required }: { taskId: string; required?: boolean }) {
  const t = useT();
  const [state, formAction, pending] = useActionState(submitProofAction, initialState);
  const { locating, lat, lng } = useGeolocation();
  const [chosen, setChosen] = useState(false);
  const [preview, setPreview] = useState("");

  if (state.status === "success") {
    return (
      <p className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-sky-100 px-4 text-sm font-semibold text-sky-900">
        <CheckCircle2 size={18} /> {t("pf.sentApproval")}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-2.5">
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="gpsLat" value={lat} />
      <input type="hidden" name="gpsLng" value={lng} />

      <label
        className={`flex min-h-14 cursor-pointer items-center justify-center gap-2.5 rounded-2xl px-4 text-[15px] font-semibold transition active:scale-[0.99] ${
          chosen ? "bg-white text-slate-700 ring-1 ring-slate-300" : "bg-brand-navy text-white shadow-sm hover:opacity-95"
        }`}
      >
        {chosen && preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-10 w-10 rounded-lg object-cover" />
        ) : (
          <Camera size={20} />
        )}
        {chosen ? t("pf.change") : t("pf.upload")}
        <input
          type="file"
          name="photo"
          accept="image/*,video/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setChosen(!!f);
            setPreview(f && f.type.startsWith("image/") ? URL.createObjectURL(f) : "");
          }}
        />
      </label>

      {!chosen && <p className="px-1 text-center text-xs text-slate-500">{required ? t("pf.needed") : t("pf.uploadHint")}</p>}

      {chosen && (
        <input
          name="notes"
          placeholder={t("pf.note")}
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm focus:border-brand-navy focus:outline-none"
        />
      )}

      {state.status === "error" && <p className="px-1 text-sm text-red-600">{state.message}</p>}

      {chosen && (
        <button
          type="submit"
          disabled={pending}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-[15px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60"
        >
          {pending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          {pending && locating ? t("pf.locating") : t("pf.sendApproval")}
        </button>
      )}

      {!chosen && !required && (
        <button
          type="submit"
          name="noPhoto"
          value="1"
          disabled={pending}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-white hover:text-slate-800 disabled:opacity-60"
        >
          {pending && <Loader2 size={15} className="animate-spin" />}
          {t("pf.noPhoto")}
        </button>
      )}
    </form>
  );
}
