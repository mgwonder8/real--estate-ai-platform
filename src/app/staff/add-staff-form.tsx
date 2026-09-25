"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { createStaffAction, type CreateStaffState } from "@/app/staff/actions";
import type { Role, Site } from "@/lib/data/types";

const initialState: CreateStaffState = { status: "idle" };

const ROLES: { value: Role; label: string }[] = [
  { value: "site_staff", label: "Site staff" },
  { value: "office_staff", label: "Office" },
  { value: "owner", label: "Owner" },
];

export function AddStaffForm({ sites }: { sites: Site[] }) {
  const [state, formAction, pending] = useActionState(createStaffAction, initialState);
  const [role, setRole] = useState<Role>("site_staff");

  if (state.status === "success") {
    return (
      <div className="text-center">
        <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
        <p className="mt-3 text-lg font-semibold text-slate-900">{state.name} is added</p>
        <div className="mx-auto mt-4 max-w-sm space-y-2 rounded-xl bg-slate-50 p-4 text-left text-sm">
          <p className="flex justify-between gap-3">
            <span className="text-slate-500">Login</span>
            <span className="truncate font-mono text-slate-900">{state.email}</span>
          </p>
          <p className="flex justify-between gap-3">
            <span className="text-slate-500">Password</span>
            <span className="font-mono font-semibold text-slate-900">{state.tempPassword}</span>
          </p>
        </div>
        <p className="mt-3 text-xs text-slate-500">Share these now. The password is shown only once.</p>
        <Link href="/staff" className="mt-5 inline-block text-sm font-medium text-brand-navy hover:underline">
          Back to team
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.status === "error" && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-100">{state.message}</p>
      )}
      <input type="hidden" name="role" value={role} />

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
          <input name="name" required autoFocus className={inputClass} />
        </Field>
        <Field label="Phone" hint="Optional">
          <input name="phone" type="tel" className={inputClass} />
        </Field>
        <Field label="Email" className="sm:col-span-2">
          <input name="email" type="email" required className={inputClass} placeholder="Used to sign in" />
        </Field>
        {role === "site_staff" && (
          <Field label="Site" className="sm:col-span-2">
            <select name="siteId" defaultValue="" className={inputClass}>
              <option value="">Choose a site</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={pending} className="min-w-32">
          {pending && <Loader2 size={16} className="animate-spin" />}
          Add person
        </Button>
      </div>
    </form>
  );
}
