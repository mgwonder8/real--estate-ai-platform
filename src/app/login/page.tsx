import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { LanguageMenu } from "@/components/language-switcher";
import { getT } from "@/lib/i18n/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const t = await getT();

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
        <div className="relative">
          <span className="flex w-44 items-center justify-center rounded-3xl bg-white p-3 shadow-xl shadow-black/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/millennium-logo.png" alt="Millennium Group" className="h-auto w-full object-contain" />
          </span>
        </div>
        <div className="relative">
          <h2 className="max-w-sm text-3xl font-semibold leading-snug">{t("login.tagline")}</h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-300">
            {t("login.taglineSub")}
          </p>
        </div>
        <p className="relative text-xs text-slate-400">{t("login.copyright", { year: new Date().getFullYear() })}</p>
      </div>

      <div className="relative flex flex-1 items-center justify-center bg-background px-4">
        <div className="absolute right-3 top-3">
          <LanguageMenu />
        </div>
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex justify-center lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/millennium-logo.png" alt="Millennium Group" className="h-auto w-40 object-contain" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">{t("login.welcome")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("login.signInContinue")}</p>

          <details className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <summary className="cursor-pointer font-medium text-slate-700">{t("login.demo")}</summary>
            <div className="mt-2 space-y-1">
              <p><span className="font-medium">{t("login.owners")}</span> Rahul@owner.com · Kedar@owner.com</p>
              <p><span className="font-medium">{t("login.staff")}</span> Vinayak@staff.com · ganesh@staff.com</p>
              <p className="text-slate-500">{t("login.passwordIs", { password: "milleniumgroup" })}</p>
            </div>
          </details>

          <form action={login} className="mt-6 space-y-4">
            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
                {t("login.invalid")}
              </p>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t("common.email")}</label>
              <input
                name="email"
                type="email"
                required
                autoFocus
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t("common.password")}</label>
              <input
                name="password"
                type="password"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none"
              />
            </div>
            <Button type="submit" className="w-full">
              {t("login.signIn")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
