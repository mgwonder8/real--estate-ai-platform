"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "@/components/app-sidebar";
import { NotificationsToggle } from "@/components/notifications-toggle";

/** Phone-only header. On desktop the sidebar carries the logo, account and sign-out. */
export function AppTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-slate-200/70 bg-white/90 px-3 backdrop-blur lg:hidden">
      <button
        onClick={onMenuClick}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <Link href="/" className="flex items-center gap-2">
        <Logo size="sm" />
        <span className="text-[15px] font-semibold tracking-tight text-slate-900">Chai Labs</span>
      </Link>
      <div className="flex-1" />
      <NotificationsToggle />
    </header>
  );
}
