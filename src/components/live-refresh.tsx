"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Polls the current route for fresh server-rendered data while the tab is
 * visible. This is a pragmatic stand-in for true real-time (websockets)
 * updates, Vercel's serverless functions don't hold persistent connections,
 * and this needs no extra infrastructure or paid service.
 */
export function LiveRefresh({ intervalMs = 20000 }: { intervalMs?: number }) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function start() {
      if (timerRef.current) return;
      timerRef.current = setInterval(() => {
        if (document.visibilityState === "visible") {
          router.refresh();
        }
      }, intervalMs);
    }
    function stop() {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    start();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    });

    return stop;
  }, [intervalMs, router]);

  return null;
}
