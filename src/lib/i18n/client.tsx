"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { makeT, type T } from "@/lib/i18n/translate";

const I18nContext = createContext<T | null>(null);

export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Messages; children: React.ReactNode }) {
  const t = useMemo(() => makeT(locale, messages), [locale, messages]);
  return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>;
}

/** Translator for client components. */
export function useT(): T {
  const t = useContext(I18nContext);
  if (!t) throw new Error("useT must be used inside I18nProvider");
  return t;
}
