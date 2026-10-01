"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import type { TaskStatus } from "@/lib/data/types";

/** none = open, half = ticked by staff and awaiting approval, full = done. */
export type CheckState = "none" | "half" | "full";

export function checkStateOf(status: TaskStatus): CheckState {
  if (status === "approved") return "full";
  if (status === "completed") return "half";
  return "none";
}

const LOOK: Record<CheckState, string> = {
  none: "border-2 border-slate-300 bg-white text-transparent hover:border-emerald-500 hover:text-emerald-300",
  half: "border-2 border-emerald-400 bg-emerald-100 text-emerald-600",
  full: "border-2 border-emerald-500 bg-emerald-500 text-white",
};

export function TaskCheck({
  id,
  state,
  next,
  action,
  label,
}: {
  id: string;
  state: CheckState;
  /** null renders a read-only marker. */
  next: CheckState | null;
  action: (id: string) => Promise<void>;
  label: string;
}) {
  const [shown, setShown] = useOptimistic(state);
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  if (!next) {
    return (
      <span
        aria-label={state === "none" ? "Not done" : "Done"}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
          state === "none" ? "border-2 border-dashed border-slate-200" : LOOK[state]
        }`}
      >
        {state !== "none" && <Check size={14} strokeWidth={3} />}
      </span>
    );
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={shown === "full" ? true : shown === "half" ? "mixed" : false}
      aria-label={label}
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setFailed(false);
        startTransition(async () => {
          setShown(next);
          try {
            await action(id);
          } catch {
            setFailed(true);
          }
        });
      }}
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition active:scale-90 ${LOOK[shown]} ${
        failed ? "ring-2 ring-red-400 ring-offset-1" : ""
      }`}
    >
      {pending && shown === "none" ? <Loader2 size={12} className="animate-spin text-slate-400" /> : <Check size={14} strokeWidth={3} />}
    </button>
  );
}
