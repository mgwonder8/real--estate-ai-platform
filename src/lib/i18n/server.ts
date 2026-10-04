import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/messages";
import { makeT, type T } from "@/lib/i18n/translate";

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Translator for server components, server actions and route handlers. */
export async function getT(): Promise<T> {
  const locale = await getLocale();
  return makeT(locale, dictionaries[locale]);
}
