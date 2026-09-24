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
  X,
} from "lucide-react";

const ownerNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/sites", label: "Sites", icon: Building2 },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/queries", label: "Queries", icon: MessageCircleQuestion },
  { href: "/insights", label: "Insights", icon: BarChart3 },
];

const siteStaffNav = [{ href: "/site", label: "My Tasks", icon: ClipboardList }];

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
  const nav = role === "site_staff" ? siteStaffNav : ownerNav;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 transform flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navy text-sm font-bold text-brand-gold">
              C
            </span>
            <span className="text-sm font-semibold text-slate-900">Chai Labs Real Estate</span>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 lg:hidden" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-navy text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon size={18} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 text-xs text-slate-400">Chai Labs Real Estate</div>
      </aside>
    </>
  );
}
