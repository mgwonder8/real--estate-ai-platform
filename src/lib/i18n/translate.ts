import { LOCALE_TAG, type Locale } from "@/lib/i18n/config";
import type { Messages, MessageKey, PluralKey } from "@/lib/i18n/messages";

type Vars = Record<string, string | number>;

export type T = {
  (key: MessageKey, vars?: Vars): string;
  /** Picks the singular or plural wording for a count, and fills in {n}. */
  n: (key: PluralKey, count: number, vars?: Vars) => string;
  locale: Locale;
};

function fill(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
}

export function makeT(locale: Locale, messages: Messages): T {
  const t = ((key: MessageKey, vars?: Vars) => fill(messages[key] ?? key, vars)) as T;
  t.n = (key, count, vars) => fill(messages[`${key}_${count === 1 ? "one" : "other"}` as MessageKey] ?? key, { n: count, ...vars });
  t.locale = locale;
  return t;
}

/** "5 Oct" in the person's language, always with Latin digits. */
export function shortDate(date: Date, locale: Locale): string {
  return date.toLocaleDateString(LOCALE_TAG[locale], { day: "numeric", month: "short" });
}
