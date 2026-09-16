"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createStaffAction, type CreateStaffState } from "@/app/staff/actions";
import type { Site } from "@/lib/data/types";

const initialState: CreateStaffState = { status: "idle" };

export function AddStaffForm({ sites }: { sites: Site[] }) {
  const [state, formAction, pending] = useActionState(createStaffAction, initialState);

  return (
    <div>
      {state.status === "success" && (
        <div className="mx-5 mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-200">
          <p className="font-medium">{state.name} added.</p>
          <p>
            Login: <span className="font-mono">{state.email}</span> · Temp password:{" "}
            <span className="font-mono font-semibold">{state.tempPassword}</span>
          </p>
          <p className="mt-1 text-emerald-700">Share this with them now — it won&apos;t be shown again.</p>
        </div>
      )}
      {state.status === "error" && (
        <div className="mx-5 mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          {state.message}
        </div>
      )}
      <form action={formAction} className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
          <input name="name" required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email (login)</label>
          <input name="email" type="email" required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
          <select name="role" defaultValue="site_staff" className={inputClass}>
            <option value="owner">Owner</option>
            <option value="office_staff">Office Staff</option>
            <option value="site_staff">Site Staff</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Site (for site staff)</label>
          <select name="siteId" defaultValue="" className={inputClass}>
            <option value="">None</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
          <input name="phone" className={inputClass} />
        </div>
        <div className="flex items-end sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add Staff"}
          </Button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none";
