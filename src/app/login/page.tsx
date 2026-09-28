import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
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
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-navy p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-gold/15 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <span className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white p-2 shadow-xl shadow-black/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Chai Labs" className="h-full w-full object-contain" />
          </span>
          <span className="leading-tight">
            <span className="block text-2xl font-semibold tracking-tight">Chai Labs</span>
            <span className="block text-sm font-medium text-brand-gold">Real Estate</span>
          </span>
        </div>
        <div className="relative">
          <h2 className="max-w-sm text-3xl font-semibold leading-snug">Run every site, from one screen.</h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-300">
            Assign work, see photo proof, and chat with your team in one place.
          </p>
        </div>
        <p className="relative text-xs text-slate-400">© {new Date().getFullYear()} Chai Labs Real Estate</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-col items-center text-center lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Chai Labs" className="h-20 w-20 object-contain" />
            <span className="mt-2 text-base font-semibold text-slate-900">Chai Labs</span>
            <span className="text-xs font-medium text-brand-gold">Real Estate</span>
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
