"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { updateStaffAction, type UpdateStaffState } from "@/app/staff/actions";
import type { Role, Site, Staff } from "@/lib/data/types";

const initialState: UpdateStaffState = { status: "idle" };

const ROLES: { value: Role; label: string }[] = [
  { value: "site_staff", label: "Site staff" },
  { value: "office_staff", label: "Office" },
  { value: "owner", label: "Owner" },
];

export function EditStaffForm({ staff, sites }: { staff: Staff; sites: Site[] }) {
  const [state, formAction, pending] = useActionState(updateStaffAction, initialState);
  const [role, setRole] = useState<Role>(staff.role);
  const [primarySiteId, setPrimarySiteId] = useState(staff.siteId);
  const [extraSiteIds, setExtraSiteIds] = useState<string[]>(staff.extraSiteIds);
  const router = useRouter();

  if (state.status === "success") {
    return (
      <div className="text-center py-8">
        <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
        <p className="mt-3 text-lg font-semibold text-slate-900">Changes saved</p>
        <button
          onClick={() => router.push("/staff")}
          className="mt-5 text-sm font-medium text-brand-navy hover:underline"
        >
          Back to team
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

      <div>
        <p className="mb-1.5 text-sm font-medium text-slate-800">Role</p>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`rounded-lg py-2 text-sm font-medium transition ${
                role === r.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name">
          <input name="name" required defaultValue={staff.name} className={inputClass} />
        </Field>
        <Field label="Phone" hint="Optional">
          <input name="phone" type="tel" defaultValue={staff.phone} className={inputClass} />
        </Field>
      </div>

      {role === "site_staff" && (
        <>
          <Field label="Primary site">
            <select
              value={primarySiteId}
              onChange={(e) => {
                const newPrimary = e.target.value;
                setPrimarySiteId(newPrimary);
                setExtraSiteIds((prev) => prev.filter((x) => x !== newPrimary));
              }}
              className={inputClass}
            >
              <option value="">No site</option>
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
                Also works at{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {availableForExtra.map((s) => {
                  const on = extraSiteIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleExtra(s.id)}
                      className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition active:scale-95 ${
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

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
        <Button type="submit" disabled={pending} className="min-w-32">
          {pending && <Loader2 size={16} className="animate-spin" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}
