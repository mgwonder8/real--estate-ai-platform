"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { generateStaffSummaryAction, type AiTextState } from "@/app/insights/actions";

const initialState: AiTextState = { status: "idle" };

export function StaffSummaryButton({ staffId }: { staffId: string }) {
  const [state, formAction, pending] = useActionState(generateStaffSummaryAction, initialState);

  return (
    <div className="mt-2">
      <form action={formAction}>
        <input type="hidden" name="staffId" value={staffId} />
        <Button type="submit" variant="ghost" disabled={pending} className="!px-0 text-xs">
          {pending ? "Generating…" : "Generate AI performance summary"}
        </Button>
      </form>
      {state.status === "success" && (
        <p className="mt-1 rounded-lg bg-slate-50 p-2 text-xs text-slate-700">{state.text}</p>
      )}
      {state.status === "error" && <p className="mt-1 text-xs text-red-600">{state.message}</p>}
    </div>
  );
}
