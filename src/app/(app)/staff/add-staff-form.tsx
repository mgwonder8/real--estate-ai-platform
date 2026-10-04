"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { createStaffAction, type CreateStaffState } from "@/app/(app)/staff/actions";
import type { Role, Site } from "@/lib/data/types";
import { useT } from "@/lib/i18n/client";
import type { MessageKey } from "@/lib/i18n/messages";

const initialState: CreateStaffState = { status: "idle" };

const ROLES: { value: Role; label: MessageKey }[] = [
  { value: "site_staff", label: "role.siteStaff" },
  { value: "office_staff", label: "role.office" },
  { value: "owner", label: "role.owner" },
];

export function AddStaffForm({ sites }: { sites: Site[] }) {
  const t = useT();
  const [state, formAction, pending] = useActionState(createStaffAction, initialState);
  const [role, setRole] = useState<Role>("site_staff");
  const [primarySiteId, setPrimarySiteId] = useState("");
  const [extraSiteIds, setExtraSiteIds] = useState<string[]>([]);

  if (state.status === "success") {
    return (
      <div className="text-center">
        <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
        <p className="mt-3 text-lg font-semibold text-slate-900">{t("as.added", { name: state.name })}</p>
        <div className="mx-auto mt-4 max-w-sm space-y-2 rounded-xl bg-slate-50 p-4 text-left text-sm">
          <p className="flex justify-between gap-3">
            <span className="text-slate-500">{t("as.login")}</span>
            <span className="truncate font-mono text-slate-900">{state.email}</span>
          </p>
          <p className="flex justify-between gap-3">
            <span className="text-slate-500">{t("common.password")}</span>
            <span className="font-mono font-semibold text-slate-900">{state.tempPassword}</span>
          </p>
        </div>
        <p className="mt-3 text-xs text-slate-500">{t("as.shareNow")}</p>
        <Link href="/staff" className="mt-5 inline-block text-sm font-medium text-brand-navy hover:underline">
          {t("as.backToTeam")}
        </Link>
      </div>
    );
  }

  function toggleExtra(siteId: string) {
    setExtraSiteIds((prev) =>
      prev.includes(siteId) ? prev.filter((x) => x !== siteId) : [...prev, siteId]
    );
  }

  const availableForExtra = sites.filter((s) => s.id !== primarySiteId);

  return (
    <form action={formAction} className="space-y-5">
      {state.status === "error" && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-100">{state.message}</p>
      )}
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="siteId" value={primarySiteId} />
      {extraSiteIds.map((id) => (
        <input key={id} type="hidden" name="extraSiteIds" value={id} />
      ))}

      <div>
        <p className="mb-1.5 text-sm font-medium text-slate-800">{t("as.role")}</p>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`min-h-11 rounded-lg py-2 text-sm font-medium transition sm:min-h-0 ${
                role === r.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t(r.label)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("common.name")}>
          <input name="name" required autoFocus className={inputClass} />
        </Field>
        <Field label={t("common.phone")} hint={t("common.optional")}>
          <input name="phone" type="tel" className={inputClass} />
        </Field>
        <Field label={t("common.email")} className="sm:col-span-2">
          <input name="email" type="email" required className={inputClass} placeholder={t("as.emailPh")} />
        </Field>
      </div>

      {role === "site_staff" && (
        <>
          <Field label={t("as.primarySite")}>
            <select
              value={primarySiteId}
              onChange={(e) => {
                const newPrimary = e.target.value;
                setPrimarySiteId(newPrimary);
                setExtraSiteIds((prev) => prev.filter((x) => x !== newPrimary));
              }}
              className={inputClass}
            >
              <option value="">{t("as.chooseSite")}</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>

          {availableForExtra.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-800">
                {t("as.alsoWorks")}{" "}
                <span className="text-slate-400 font-normal">({t("common.optional")})</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {availableForExtra.map((s) => {
                  const on = extraSiteIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleExtra(s.id)}
                      className={`min-h-11 rounded-xl border px-3.5 py-2 text-sm font-medium transition active:scale-95 sm:min-h-0 sm:px-3 sm:py-1.5 ${
                        on
                          ? "border-brand-navy bg-brand-navy text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={pending} className="min-w-32">
          {pending && <Loader2 size={16} className="animate-spin" />}
          {t("st.add")}
        </Button>
      </div>
    </form>
  );
}
