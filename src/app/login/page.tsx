import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { Building2 } from "lucide-react";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/",
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect("/login?error=1");
      }
      throw err;
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between bg-brand-navy p-10 text-white lg:flex">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-lg font-bold text-brand-gold">C</span>
          <span className="text-base font-semibold">Chai Labs Real Estate</span>
        </div>
        <div>
          <Building2 size={40} className="mb-4 text-brand-gold" />
          <h2 className="max-w-sm text-2xl font-semibold leading-snug">
            Run every site, from one screen.
          </h2>
          <p className="mt-3 max-w-sm text-sm text-slate-300">
            Assign work, review proof of completion, and keep your whole portfolio on schedule,
            without another phone call.
          </p>
        </div>
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} Chai Labs Real Estate</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navy text-sm font-bold text-brand-gold">C</span>
            <span className="text-sm font-semibold text-slate-900">Chai Labs Real Estate</span>
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>

          <details className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <summary className="cursor-pointer font-medium text-slate-700">Demo logins</summary>
            <div className="mt-2 space-y-1">
              <p><span className="font-medium">Owners:</span> Rahul@owner.com · Kedar@owner.com</p>
              <p><span className="font-medium">Staff:</span> Vinayak@staff.com · ganesh@staff.com</p>
              <p className="text-slate-500">Password: milleniumgroup</p>
            </div>
          </details>

          <form action={login} className="mt-6 space-y-4">
            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
                Invalid email or password.
              </p>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                name="email"
                type="email"
                required
                autoFocus
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <input
                name="password"
                type="password"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none"
              />
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
