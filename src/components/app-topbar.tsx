"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "@/components/app-sidebar";
import { NotificationsToggle } from "@/components/notifications-toggle";
import { LanguageMenu } from "@/components/language-switcher";
import { useT } from "@/lib/i18n/client";

/** Phone-only header. On desktop the sidebar carries the logo, account and sign-out. */
export function AppTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const t = useT();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-slate-200/70 bg-white/90 px-3 backdrop-blur lg:hidden">
      <button
        onClick={onMenuClick}
        className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95"
        aria-label={t("nav.openMenu")}
      >
        <Menu size={20} />
      </button>
      <Link href="/" className="flex min-h-11 items-center pr-2" aria-label="Millennium Group">
        <Logo size="sm" />
      </Link>
      <div className="flex-1" />
      <LanguageMenu />
      <NotificationsToggle />
    </header>
  );
}
