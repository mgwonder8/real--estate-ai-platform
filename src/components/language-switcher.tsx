"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Globe } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { setLocaleAction } from "@/lib/i18n/actions";
import { LOCALES, LOCALE_NAME, LOCALE_SHORT, type Locale } from "@/lib/i18n/config";

function useSwitch() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function choose(locale: Locale) {
    startTransition(async () => {
      await setLocaleAction(locale);
      router.refresh();
    });
  }
  return { choose, pending };
}

/** Three side-by-side buttons, used in the menu drawer and sidebar. */
export function LanguageSegmented() {
  const t = useT();
  const { choose, pending } = useSwitch();
  return (
    <div role="radiogroup" aria-label={t("lang.choose")} className={`grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 ${pending ? "opacity-70" : ""}`}>
      {LOCALES.map((l) => {
        const on = t.locale === l;
        return (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={on}
            lang={l}
            onClick={() => !on && choose(l)}
            className={`min-h-10 rounded-lg px-2 text-[13px] font-medium transition ${
              on ? "bg-white text-brand-navy shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {LOCALE_NAME[l]}
          </button>
        );
      })}
    </div>
  );
}

/** A small globe button that opens a list of languages, used in the phone top bar and on the login page. */
export function LanguageMenu({ align = "right" }: { align?: "left" | "right" }) {
  const t = useT();
  const { choose, pending } = useSwitch();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("lang.choose")}
        className={`flex h-11 items-center gap-1.5 rounded-xl px-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-95 ${pending ? "opacity-60" : ""}`}
      >
        <Globe size={18} className="text-slate-500" />
        <span lang={t.locale}>{LOCALE_SHORT[t.locale]}</span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={t("lang.choose")}
          className={`absolute top-full z-50 mt-1 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-xl ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {LOCALES.map((l) => {
            const on = t.locale === l;
            return (
              <li key={l} role="option" aria-selected={on}>
                <button
                  type="button"
                  lang={l}
                  onClick={() => {
                    setOpen(false);
                    if (!on) choose(l);
                  }}
                  className={`flex min-h-11 w-full items-center justify-between gap-2 px-4 text-left text-sm transition hover:bg-slate-50 ${
                    on ? "font-semibold text-brand-navy" : "text-slate-700"
                  }`}
                >
                  {LOCALE_NAME[l]}
                  {on && <Check size={15} className="text-brand-gold" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
