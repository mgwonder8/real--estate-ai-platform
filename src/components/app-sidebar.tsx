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
  MessageCircle,
  Plus,
  X,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { NotificationsToggle } from "@/components/notifications-toggle";
import { ROLE_LABEL, displayName } from "@/lib/roles";

export type NavItem = { href: string; label: string; icon: LucideIcon; badge?: "chat" };
export type NavGroup = { title?: string; items: NavItem[] };

export const ownerNav: NavGroup[] = [
  {
    items: [
      { href: "/dashboard", label: "Home", icon: LayoutDashboard },
      { href: "/tasks", label: "Tasks", icon: ListChecks },
      { href: "/sites", label: "Sites", icon: Building2 },
    ],
  },
  {
    title: "People",
    items: [
      { href: "/chat", label: "Chat", icon: MessageCircle, badge: "chat" },
      { href: "/staff", label: "Team", icon: Users },
      { href: "/queries", label: "Queries", icon: MessageCircleQuestion },
    ],
  },
  {
    title: "Reports",
    items: [{ href: "/insights", label: "Insights", icon: BarChart3 }],
  },
];

export const siteStaffNav: NavGroup[] = [
  {
    items: [
      { href: "/site", label: "My tasks", icon: ClipboardList },
      { href: "/chat", label: "Chat", icon: MessageCircle, badge: "chat" },
    ],
  },
];

export function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/tasks") return pathname === "/tasks" || (pathname.startsWith("/tasks/") && pathname !== "/tasks/new");
  return pathname === href || pathname.startsWith(href + "/");
}

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "h-16 w-16" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.png" alt="Chai Labs" className={`${box} shrink-0 object-contain`} />
  );
}

export function AppSidebar({
  role,
  name,
  unreadChats,
  open,
  onClose,
  signOutAction,
}: {
  role: string;
  name: string;
  unreadChats: number;
  open: boolean;
  onClose: () => void;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const isStaff = role === "site_staff";
  const groups = isStaff ? siteStaffNav : ownerNav;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-[2px] lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 pb-5 pt-5">
          <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
            <Logo />
            <span className="leading-tight">
              <span className="block text-[15px] font-semibold tracking-tight text-slate-900">Chai Labs</span>
              <span className="block text-xs text-slate-500">Real Estate</span>
            </span>
          </Link>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        {!isStaff && (
          <div className="px-4 pb-4">
            <Link
              href="/tasks/new"
              onClick={onClose}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-navy text-sm font-medium text-white shadow-sm transition hover:bg-brand-navy-soft active:scale-[0.98]"
            >
              <Plus size={17} strokeWidth={2.5} /> New task
            </Link>
          </div>
        )}

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {groups.map((group, gi) => (
            <div key={gi}>
              {group.title && (
                <p className="mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">{group.title}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  const Icon = item.icon;
                  const count = item.badge === "chat" ? unreadChats : 0;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className={`relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-brand-navy/[0.06] font-semibold text-brand-navy"
                          : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-brand-gold" />}
                      <Icon size={18} className={active ? "text-brand-navy" : "text-slate-400"} />
                      <span className="flex-1">{item.label}</span>
                      {count > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-gold px-1.5 text-[11px] font-semibold text-white">
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
            <Avatar name={displayName(name, role)} size="sm" />
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-medium text-slate-800">{displayName(name, role)}</span>
              <span className="block text-xs text-slate-400">{ROLE_LABEL[role] ?? role}</span>
            </span>
            <NotificationsToggle />
            <form action={signOutAction}>
              <button
                type="submit"
                title="Sign out"
                aria-label="Sign out"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <LogOut size={17} />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
