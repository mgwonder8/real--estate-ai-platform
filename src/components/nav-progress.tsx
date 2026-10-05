"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * A thin gold bar at the top that starts the moment someone taps a link and
 * finishes when the new page arrives, so moving around never feels stuck.
 */
export function NavProgress() {
  const pathname = usePathname();
  // The page we were on when the tap happened; once the path changes, the bar finishes.
  const [from, setFrom] = useState<string | null>(null);
  const fallback = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loading = from !== null && from === pathname;
  const finishing = from !== null && from !== pathname;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("tel:") || href.startsWith("mailto:")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      setFrom(window.location.pathname);
      if (fallback.current) clearTimeout(fallback.current);
      fallback.current = setTimeout(() => setFrom(null), 12000);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!finishing) return;
    if (fallback.current) clearTimeout(fallback.current);
    const done = setTimeout(() => setFrom(null), 350);
    return () => clearTimeout(done);
  }, [finishing]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]">
      <div
        className={`h-full rounded-r-full bg-gradient-to-r from-brand-gold to-amber-300 shadow-[0_0_8px_rgba(193,154,91,0.6)] ${
          loading
            ? "w-[85%] opacity-100 transition-[width] duration-[6000ms] ease-out"
            : finishing
              ? "w-full opacity-0 transition-[width,opacity] duration-300 ease-out"
              : "w-0 opacity-0"
        }`}
      />
    </div>
  );
}
