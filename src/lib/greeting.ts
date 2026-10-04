import type { T } from "@/lib/i18n/translate";

/** "Good morning" / "Good afternoon" / "Good evening" by the current time in India, in the chosen language. */
export function greetingIST(t: T, now = new Date()): string {
  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(now));
  if (hour >= 5 && hour < 12) return t("greet.morning");
  if (hour >= 12 && hour < 17) return t("greet.afternoon");
  return t("greet.evening");
}

/** The name in the greeting: everyone's own first name, owner or staff. */
export function greetingName(name: string | undefined): string {
  return (name ?? "").trim().split(/\s+/)[0] || "there";
}
