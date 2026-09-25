"use client";

import { useActionState, useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { generatePortfolioInsightsAction, type AiTextState } from "@/app/insights/actions";

const initialState: AiTextState = { status: "idle" };

export function PortfolioInsightsPanel() {
  const [state, formAction, pending] = useActionState(generatePortfolioInsightsAction, initialState);
  const autoRan = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (autoRan.current) return;
    autoRan.current = true;
    formRef.current?.requestSubmit();
  }, []);

  return (
    <div>
      {pending ? (
        <div className="space-y-2.5">
          <div className="h-3 w-4/5 animate-pulse rounded-full bg-slate-100" />
          <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
          <div className="h-3 w-3/4 animate-pulse rounded-full bg-slate-100" />
          <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-100" />
        </div>
      ) : state.status === "success" ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{state.text}</p>
      ) : state.status === "error" ? (
        <p className="text-sm text-red-600">{state.message}</p>
      ) : null}

      <form ref={formRef} action={formAction} className="mt-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 disabled:opacity-50"
        >
          <RefreshCw size={12} className={pending ? "animate-spin" : ""} /> Refresh
        </button>
      </form>
    </div>
  );
}
