export const LOCALES = ["en", "hi", "mr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "lang";

/** How each language names itself, so people can find theirs even when the page is in another language. */
export const LOCALE_NAME: Record<Locale, string> = {
  en: "English",
  hi: "हिंदी",
  mr: "मराठी",
};

/** Short form for tight spaces such as the phone top bar. */
export const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  hi: "हिं",
  mr: "मरा",
};

/** Latin digits in every language keep numbers consistent with task numbers and times. */
export const LOCALE_TAG: Record<Locale, string> = {
  en: "en-IN",
  hi: "hi-IN-u-nu-latn",
  mr: "mr-IN-u-nu-latn",
};

/** Language names as the AI should be told to write them. */
export const LOCALE_AI_NAME: Record<Locale, string> = {
  en: "English",
  hi: "proper Hindi in Devanagari script, using Hindi words rather than English ones wherever a common Hindi word exists (for example कार्य for task, स्थल for site)",
  mr: "proper Marathi in Devanagari script, using Marathi words rather than English ones wherever a common Marathi word exists (for example कार्य for task, स्थळ for site)",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
