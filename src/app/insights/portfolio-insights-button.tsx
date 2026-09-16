"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { generatePortfolioInsightsAction, type AiTextState } from "@/app/insights/actions";

const initialState: AiTextState = { status: "idle" };

export function PortfolioInsightsButton() {
  const [state, formAction, pending] = useActionState(generatePortfolioInsightsAction, initialState);

  return (
    <div>
      <form action={formAction}>
        <Button type="submit" disabled={pending}>
          {pending ? "Analyzing…" : "Generate AI Portfolio Briefing"}
        </Button>
      </form>
      {state.status === "success" && (
        <p className="mt-3 whitespace-pre-line rounded-lg bg-amber-50/60 p-3 text-sm text-slate-800 ring-1 ring-inset ring-brand-gold/30">
          {state.text}
        </p>
      )}
      {state.status === "error" && <p className="mt-3 text-sm text-red-600">{state.message}</p>}
    </div>
  );
}
