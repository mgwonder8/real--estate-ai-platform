"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListChecks, Building2, MessageCircleQuestion, Plus } from "lucide-react";
import { isActivePath } from "@/components/app-sidebar";

const items = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/tasks/new", label: "New", icon: Plus, primary: true },
  { href: "/sites", label: "Sites", icon: Building2 },
  { href: "/queries", label: "Queries", icon: MessageCircleQuestion },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          if (item.primary) {
            return (
              <Link key={item.href} href={item.href} aria-label="New task" className="flex items-center justify-center py-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-navy text-white shadow-lg shadow-brand-navy/20">
                  <Icon size={22} strokeWidth={2.5} />
                </span>
              </Link>
            );
          }
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium ${
                active ? "text-brand-navy" : "text-slate-400"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
