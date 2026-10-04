"use client";

import { useEffect } from "react";
import { useT } from "@/lib/i18n/client";

export default function ChatError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error("Chat error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <h2 className="text-lg font-semibold text-slate-900">{t("chat.failed")}</h2>
      <p className="mt-2 text-sm text-slate-500">{error.message}</p>
      {error.digest && <p className="mt-1 text-xs text-slate-400">{t("chat.ref", { id: error.digest })}</p>}
      <button
        onClick={reset}
        className="mt-5 rounded-xl bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-soft"
      >
        {t("chat.tryAgain")}
      </button>
    </div>
  );
}
