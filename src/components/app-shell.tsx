"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { MobileNav } from "@/components/mobile-nav";
import { LiveRefresh } from "@/components/live-refresh";
import { signOutAction } from "@/lib/sign-out-action";

export function AppShell({
  role,
  name,
  unreadChats = 0,
  unreadPersonal = 0,
  children,
}: {
  role: string;
  name: string;
  unreadChats?: number;
  unreadPersonal?: number;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isChatThread = /^\/(chat|personal)\/[^/]+$/.test(pathname ?? "");
  const mainPadding = isChatThread
    ? "pb-[calc(4rem_+_env(safe-area-inset-bottom))] lg:px-8 lg:py-6"
    : "px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8";

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        role={role}
        name={name}
        unreadChats={unreadChats}
        unreadPersonal={unreadPersonal}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        signOutAction={signOutAction}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar onMenuClick={() => setSidebarOpen(true)} />
        <main className={`mx-auto w-full max-w-6xl flex-1 ${mainPadding}`}>{children}</main>
      </div>
      <MobileNav role={role} unreadChats={unreadChats} unreadPersonal={unreadPersonal} />
      <LiveRefresh />
    </div>
  );
}
