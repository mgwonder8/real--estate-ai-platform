import Link from "next/link";
import { signOut } from "@/auth";

const ownerNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tasks", label: "Tasks" },
  { href: "/sites", label: "Sites" },
  { href: "/staff", label: "Staff" },
];

export function AppShell({
  role,
  name,
  children,
}: {
  role: string;
  name: string;
  children: React.ReactNode;
}) {
  const nav = role === "site_staff" ? [{ href: "/site", label: "My Tasks" }] : ownerNav;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-brand-navy text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-8">
            <span className="text-sm font-semibold tracking-wide">Pride Group AI Platform</span>
            <nav className="hidden gap-1 sm:flex">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-300 sm:inline">
              {name} · <span className="text-brand-gold">{role.replace("_", " ")}</span>
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button className="rounded-md bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20 cursor-pointer">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2 sm:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
