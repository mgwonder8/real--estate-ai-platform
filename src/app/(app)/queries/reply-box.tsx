"use client";

import { SendHorizontal } from "lucide-react";
import { replyToQueryAction } from "@/app/(app)/queries/actions";
import { useT } from "@/lib/i18n/client";

export function ReplyBox({ queryId }: { queryId: string }) {
  const t = useT();
  return (
    <form action={replyToQueryAction} className="flex items-center gap-2">
      <input type="hidden" name="queryId" value={queryId} />
      <input
        name="reply"
        required
        autoComplete="off"
        placeholder={t("q.reply")}
        className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 text-sm placeholder:text-slate-400 focus:border-brand-navy focus:outline-none"
      />
      <button
        type="submit"
        aria-label={t("q.sendReply")}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-white transition hover:bg-brand-navy-soft active:scale-95"
      >
        <SendHorizontal size={16} />
      </button>
    </form>
  );
}
