"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListChecks, Building2, MessageCircle, Plus, ClipboardList, Lock, type LucideIcon } from "lucide-react";
import { isActivePath } from "@/components/app-sidebar";
import { useT } from "@/lib/i18n/client";
import type { MessageKey } from "@/lib/i18n/messages";

type Item = {
  href: string;
  label: MessageKey;
  icon: LucideIcon;
  primary?: boolean;
  badge?: "chat" | "personal" | "both";
  /** Extra sections this tab stands for. */
  also?: string[];
};

// The owner's bar is full, so its Chat tab covers both team and personal (switch at the top of the page).
const ownerItems: Item[] = [
  { href: "/dashboard", label: "nav.home", icon: LayoutDashboard },
  { href: "/tasks", label: "nav.tasks", icon: ListChecks },
  { href: "/tasks/new", label: "nav.newTask", icon: Plus, primary: true },
  { href: "/sites", label: "nav.sites", icon: Building2 },
  { href: "/chat", label: "nav.chat", icon: MessageCircle, badge: "both", also: ["/personal"] },
];

const staffItems: Item[] = [
  { href: "/site", label: "nav.myTasks", icon: ClipboardList },
  { href: "/chat", label: "nav.chat", icon: MessageCircle, badge: "chat" },
  { href: "/personal", label: "nav.personal", icon: Lock, badge: "personal" },
];

const COLS: Record<number, string> = { 3: "grid-cols-3", 5: "grid-cols-5" };

export function MobileNav({ role, unreadChats, unreadPersonal }: { role: string; unreadChats: number; unreadPersonal: number }) {
  const t = useT();
  const pathname = usePathname();
  const items = role === "site_staff" ? staffItems : ownerItems;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className={`mx-auto grid h-16 max-w-md ${COLS[items.length]}`}>
        {items.map((item) => {
          const Icon = item.icon;
          if (item.primary) {
            return (
              <Link key={item.href} href={item.href} aria-label={t(item.label)} className="flex items-center justify-center py-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-navy text-white shadow-md shadow-brand-navy/20 transition active:scale-95">
                  <Icon size={22} strokeWidth={2.5} />
                </span>
              </Link>
            );
          }
          const active = [item.href, ...(item.also ?? [])].some((h) => isActivePath(pathname, h));
          const count =
            item.badge === "chat" ? unreadChats : item.badge === "personal" ? unreadPersonal : item.badge === "both" ? unreadChats + unreadPersonal : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                active ? "text-brand-navy" : "text-slate-400"
              }`}
            >
              {active && <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-brand-gold" />}
              <span className="relative">
                <Icon size={21} strokeWidth={active ? 2.25 : 2} />
                {count > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-gold px-1 text-[10px] font-semibold text-white">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </span>
              {t(item.label)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
