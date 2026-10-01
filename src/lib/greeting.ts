/** "Good morning" / "Good afternoon" / "Good evening" by the current time in India. */
export function greetingIST(now = new Date()): string {
  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(now));
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

/** The name in the greeting: everyone's own first name, owner or staff. */
export function greetingName(name: string | undefined): string {
  return (name ?? "").trim().split(/\s+/)[0] || "there";
}
