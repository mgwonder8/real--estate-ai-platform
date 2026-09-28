"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListChecks, Building2, MessageCircle, Plus, ClipboardList, type LucideIcon } from "lucide-react";
import { isActivePath } from "@/components/app-sidebar";

type Item = { href: string; label: string; icon: LucideIcon; primary?: boolean; badge?: boolean };

const ownerItems: Item[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/tasks/new", label: "New task", icon: Plus, primary: true },
  { href: "/sites", label: "Sites", icon: Building2 },
  { href: "/chat", label: "Chat", icon: MessageCircle, badge: true },
];

const staffItems: Item[] = [
  { href: "/site", label: "My tasks", icon: ClipboardList },
  { href: "/chat", label: "Chat", icon: MessageCircle, badge: true },
];

export function MobileNav({ role, unreadChats }: { role: string; unreadChats: number }) {
  const pathname = usePathname();
  const items = role === "site_staff" ? staffItems : ownerItems;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className={`mx-auto grid h-16 max-w-md ${items.length === 2 ? "grid-cols-2" : "grid-cols-5"}`}>
        {items.map((item) => {
          const Icon = item.icon;
          if (item.primary) {
            return (
              <Link key={item.href} href={item.href} aria-label={item.label} className="flex items-center justify-center py-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-navy text-white shadow-md shadow-brand-navy/20 transition active:scale-95">
                  <Icon size={22} strokeWidth={2.5} />
                </span>
              </Link>
            );
          }
          const active = isActivePath(pathname, item.href);
          const count = item.badge ? unreadChats : 0;
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
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
