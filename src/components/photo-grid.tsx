"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Play, X } from "lucide-react";

export type Photo = { url: string; kind: "image" | "video"; caption: string; sub?: string };

export function PhotoGrid({ photos, size = "md" }: { photos: Photo[]; size?: "sm" | "md" }) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (d: number) => setOpen((i) => (i === null ? i : (i + d + photos.length) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    if (open === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, step]);

  const current = open === null ? null : photos[open];

  return (
    <>
      <div className={`grid gap-2 ${size === "sm" ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3"}`}>
        {photos.map((p, i) => (
          <button
            key={`${p.url}-${i}`}
            type="button"
            onClick={() => setOpen(i)}
            className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy"
          >
            {p.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.url} alt={p.caption} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
            ) : (
              <>
                <video src={p.url} preload="metadata" muted className="h-full w-full object-cover" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white">
                    <Play size={18} fill="currentColor" />
                  </span>
                </span>
              </>
            )}
            {size === "md" && (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-4 text-left text-[10px] leading-tight text-white">
                <span className="block truncate font-medium">{p.caption}</span>
                {p.sub && <span className="block truncate opacity-80">{p.sub}</span>}
              </span>
            )}
          </button>
        ))}
      </div>

      {current && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm" onClick={close}>
          <div className="flex items-center justify-between gap-3 p-3 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="min-w-0 text-sm">
              <p className="truncate font-medium">{current.caption}</p>
              {current.sub && <p className="truncate text-xs text-white/70">{current.sub}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <a
                href={current.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open original"
                className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10"
              >
                <Download size={18} />
              </a>
              <button onClick={close} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10">
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-6" onClick={(e) => e.stopPropagation()}>
            {current.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.url} alt={current.caption} className="max-h-full max-w-full rounded-lg object-contain" />
            ) : (
              <video src={current.url} controls autoPlay className="max-h-full max-w-full rounded-lg" />
            )}
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => step(-1)}
                  aria-label="Previous"
                  className="absolute left-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  onClick={() => step(1)}
                  aria-label="Next"
                  className="absolute right-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
