"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

// Chat polls on its own; forms shouldn't re-render under someone who is typing.
const SKIP = [/^\/chat/, /\/new$/, /\/edit$/];

/**
 * Quietly refreshes server data while the tab is visible, and once when the
 * user comes back to the tab. A stand-in for websockets on serverless hosting.
 */
export function LiveRefresh({ intervalMs = 45000 }: { intervalMs?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const skip = SKIP.some((re) => re.test(pathname ?? ""));

  useEffect(() => {
    if (skip) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    function onVisible() {
      if (document.visibilityState === "visible") router.refresh();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs, router, skip]);

  return null;
}
