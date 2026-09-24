"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, LogOut, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { NotificationsToggle } from "@/components/notifications-toggle";

export function AppTopbar({
  name,
  role,
  onMenuClick,
  signOutAction,
}: {
  name: string;
  role: string;
  onMenuClick: () => void;
  signOutAction: () => Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2 sm:gap-3">
        <NotificationsToggle />

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-100"
          >
            <Avatar name={name} size="sm" />
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight text-slate-800">{name}</span>
              <span className="block text-xs capitalize leading-tight text-slate-400">{role.replace("_", " ")}</span>
            </span>
            <ChevronDown size={16} className="hidden text-slate-400 sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <div className="border-b border-slate-100 px-3 py-2 sm:hidden">
                <p className="text-sm font-medium text-slate-800">{name}</p>
                <p className="text-xs capitalize text-slate-400">{role.replace("_", " ")}</p>
              </div>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
