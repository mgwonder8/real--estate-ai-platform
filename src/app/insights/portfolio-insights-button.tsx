"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { generatePortfolioInsightsAction, type AiTextState } from "@/app/insights/actions";

const initialState: AiTextState = { status: "idle" };

export function PortfolioInsightsPanel() {
  const [state, formAction, pending] = useActionState(generatePortfolioInsightsAction, initialState);
  const autoRan = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Auto-fetch the briefing on first render so the owner doesn't have to click.
  useEffect(() => {
    if (autoRan.current) return;
    autoRan.current = true;
    formRef.current?.requestSubmit();
  }, []);

  return (
    <div>
      {state.status === "success" ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{state.text}</p>
      ) : state.status === "error" ? (
        <p className="text-sm text-red-600">{state.message}</p>
      ) : pending ? (
        <div className="space-y-2">
          <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
        </div>
      ) : null}

      <form ref={formRef} action={formAction} className="mt-3">
        <Button type="submit" variant="ghost" disabled={pending} className="!px-0 text-xs">
          {pending ? "Analyzing…" : state.status === "success" ? "Regenerate" : "Generate"}
        </Button>
      </form>
    </div>
  );
}

// Keep the old export name working in case anything imports it.
export const PortfolioInsightsButton = PortfolioInsightsPanel;
