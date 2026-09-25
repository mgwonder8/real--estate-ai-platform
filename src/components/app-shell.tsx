"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { MobileNav } from "@/components/mobile-nav";
import { LiveRefresh } from "@/components/live-refresh";
import { signOutAction } from "@/lib/sign-out-action";

export function AppShell({
  role,
  name,
  children,
}: {
  role: string;
  name: string;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isStaff = role === "site_staff";

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar role={role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar name={name} role={role} onMenuClick={() => setSidebarOpen(true)} signOutAction={signOutAction} />
        <main className={`mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 ${isStaff ? "" : "pb-28 lg:pb-8"}`}>
          {children}
        </main>
      </div>
      {!isStaff && <MobileNav />}
      <LiveRefresh />
    </div>
  );
}
