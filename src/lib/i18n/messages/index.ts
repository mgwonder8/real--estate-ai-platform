import { en } from "@/lib/i18n/messages/en";
import { hi } from "@/lib/i18n/messages/hi";
import { mr } from "@/lib/i18n/messages/mr";
import type { Locale } from "@/lib/i18n/config";

export type MessageKey = keyof typeof en;
/** Every language must provide every key, so a missing translation fails the build. */
export type Messages = Record<MessageKey, string>;

/** Keys that have _one and _other forms, referred to by the shared prefix. */
export type PluralKey = { [K in MessageKey]: K extends `${infer Base}_one` ? Base : never }[MessageKey];

export const dictionaries: Record<Locale, Messages> = { en, hi, mr };
