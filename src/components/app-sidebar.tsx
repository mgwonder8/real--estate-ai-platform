"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  ListChecks,
  Users,
  MessageCircleQuestion,
  BarChart3,
  ClipboardList,
  Plus,
  X,
} from "lucide-react";

export const ownerNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/sites", label: "Sites", icon: Building2 },
  { href: "/staff", label: "Team", icon: Users },
  { href: "/queries", label: "Queries", icon: MessageCircleQuestion },
  { href: "/insights", label: "Insights", icon: BarChart3 },
];

export const siteStaffNav = [{ href: "/site", label: "My tasks", icon: ClipboardList }];

export function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/tasks") return pathname === "/tasks" || (pathname.startsWith("/tasks/") && pathname !== "/tasks/new");
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppSidebar({
  role,
  open,
  onClose,
}: {
  role: string;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const isStaff = role === "site_staff";
  const nav = isStaff ? siteStaffNav : ownerNav;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-brand-navy text-slate-300 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 pb-6 pt-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gold text-base font-bold text-brand-navy">
              C
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold text-white">Chai Labs</span>
              <span className="block text-[11px] text-slate-400">Real Estate</span>
            </span>
          </Link>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 lg:hidden" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        {!isStaff && (
          <div className="px-4 pb-5">
            <Link
              href="/tasks/new"
              onClick={onClose}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gold text-sm font-semibold text-brand-navy shadow-sm transition hover:brightness-105 active:scale-[0.98]"
            >
              <Plus size={18} strokeWidth={2.5} /> New task
            </Link>
          </div>
        )}

        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} className={active ? "text-brand-gold" : ""} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
