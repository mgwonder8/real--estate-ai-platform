"use client";

import { useEffect } from "react";

export default function ChatError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Chat error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <h2 className="text-lg font-semibold text-slate-900">Chat failed to load</h2>
      <p className="mt-2 text-sm text-slate-500">{error.message}</p>
      {error.digest && <p className="mt-1 text-xs text-slate-400">Ref: {error.digest}</p>}
      <button
        onClick={reset}
        className="mt-5 rounded-xl bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-soft"
      >
        Try again
      </button>
    </div>
  );
}
