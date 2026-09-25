"use client";

import { useActionState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { generateStaffSummaryAction, type AiTextState } from "@/app/insights/actions";

const initialState: AiTextState = { status: "idle" };

export function StaffSummaryButton({ staffId }: { staffId: string }) {
  const [state, formAction, pending] = useActionState(generateStaffSummaryAction, initialState);

  return (
    <div className="ml-[52px] mt-2">
      {state.status === "success" ? (
        <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">{state.text}</p>
      ) : (
        <form action={formAction}>
          <input type="hidden" name="staffId" value={staffId} />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-brand-navy/70 hover:bg-slate-100 hover:text-brand-navy disabled:opacity-60"
          >
            {pending ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            AI summary
          </button>
        </form>
      )}
      {state.status === "error" && <p className="mt-1 text-xs text-red-600">{state.message}</p>}
    </div>
  );
}
