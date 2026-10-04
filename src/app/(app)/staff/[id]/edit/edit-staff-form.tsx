"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { updateStaffAction, type UpdateStaffState } from "@/app/(app)/staff/actions";
import type { Role, Site, Staff } from "@/lib/data/types";
import { useT } from "@/lib/i18n/client";
import type { MessageKey } from "@/lib/i18n/messages";

const initialState: UpdateStaffState = { status: "idle" };

const ROLES: { value: Role; label: MessageKey }[] = [
  { value: "site_staff", label: "role.siteStaff" },
  { value: "office_staff", label: "role.office" },
  { value: "owner", label: "role.owner" },
];

export function EditStaffForm({ staff, sites }: { staff: Staff; sites: Site[] }) {
  const t = useT();
  const [state, formAction, pending] = useActionState(updateStaffAction, initialState);
  const [role, setRole] = useState<Role>(staff.role);
  const [primarySiteId, setPrimarySiteId] = useState(staff.siteId);
  const [extraSiteIds, setExtraSiteIds] = useState<string[]>(staff.extraSiteIds);
  const [teamView, setTeamView] = useState<string[]>(staff.teamViewSiteIds);
  const router = useRouter();

  const assignedSites = sites.filter((s) => s.id === primarySiteId || extraSiteIds.includes(s.id));

  if (state.status === "success") {
    return (
      <div className="text-center py-8">
        <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
        <p className="mt-3 text-lg font-semibold text-slate-900">{t("es.saved")}</p>
        <button
          onClick={() => router.push("/staff")}
          className="mt-5 text-sm font-medium text-brand-navy hover:underline"
        >
          {t("as.backToTeam")}
        </button>
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
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-100">
          {state.message}
        </p>
      )}

      <input type="hidden" name="id" value={staff.id} />
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="siteId" value={primarySiteId} />
      {extraSiteIds.map((id) => (
        <input key={id} type="hidden" name="extraSiteIds" value={id} />
      ))}
      {role === "site_staff" &&
        assignedSites
          .filter((s) => teamView.includes(s.id))
          .map((s) => <input key={s.id} type="hidden" name="teamViewSiteIds" value={s.id} />)}

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
          <input name="name" required defaultValue={staff.name} className={inputClass} />
        </Field>
        <Field label={t("common.phone")} hint={t("common.optional")}>
          <input name="phone" type="tel" defaultValue={staff.phone} className={inputClass} />
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
              <option value="">{t("es.noSite")}</option>
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

          {assignedSites.length > 0 && (
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <Eye size={15} className="text-brand-gold" /> {t("es.whatSee", { name: staff.name.split(" ")[0] })}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {t("es.whatSeeHelp")}
              </p>
              <div className="mt-3 divide-y divide-slate-100">
                {assignedSites.map((s) => {
                  const on = teamView.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="switch"
                      aria-checked={on}
                      onClick={() => setTeamView((prev) => (on ? prev.filter((x) => x !== s.id) : [...prev, s.id]))}
                      className="flex w-full items-center justify-between gap-3 py-2.5 text-left"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-800">{s.name}</span>
                        <span className="block text-xs text-slate-500">{on ? t("es.everyones") : t("es.onlyOwn")}</span>
                      </span>
                      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-emerald-500" : "bg-slate-200"}`}>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          {t("common.cancel")}
        </button>
        <Button type="submit" disabled={pending} className="min-w-32">
          {pending && <Loader2 size={16} className="animate-spin" />}
          {t("es.save")}
        </Button>
      </div>
    </form>
  );
}
