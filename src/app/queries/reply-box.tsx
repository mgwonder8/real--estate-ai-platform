"use client";

import { SendHorizontal } from "lucide-react";
import { replyToQueryAction } from "@/app/queries/actions";

export function ReplyBox({ queryId }: { queryId: string }) {
  return (
    <form action={replyToQueryAction} className="flex items-center gap-2">
      <input type="hidden" name="queryId" value={queryId} />
      <input
        name="reply"
        required
        autoComplete="off"
        placeholder="Reply"
        className="h-10 flex-1 rounded-xl border border-slate-200 px-3.5 text-sm placeholder:text-slate-400 focus:border-brand-navy focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Send reply"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-white transition hover:bg-brand-navy-soft active:scale-95"
      >
        <SendHorizontal size={16} />
      </button>
    </form>
  );
}
