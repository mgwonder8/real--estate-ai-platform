import Link from "next/link";
import { Lock, MessageCircle } from "lucide-react";

export function ChatSwitch({ active, teamUnread, personalUnread }: { active: "team" | "personal"; teamUnread: number; personalUnread: number }) {
  const items = [
    { key: "team", href: "/chat", label: "Team chat", icon: MessageCircle, count: teamUnread },
    { key: "personal", href: "/personal", label: "Personal", icon: Lock, count: personalUnread },
  ] as const;
  return (
    <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-white p-1.5 ring-1 ring-slate-200/80 sm:max-w-sm">
      {items.map(({ key, href, label, icon: Icon, count }) => {
        const on = active === key;
        return (
          <Link
            key={key}
            href={href}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition ${
              on ? "bg-brand-navy text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Icon size={15} className={on ? "text-brand-gold" : ""} />
            {label}
            {count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-gold px-1.5 text-[11px] font-semibold text-white">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
