"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateSiteBriefAction } from "@/app/sites/actions";
import type { Site, Staff } from "@/lib/data/types";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none";

export function SiteTable({ sites, staff }: { sites: Site[]; staff: Staff[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (sites.length === 0) {
    return <p className="px-5 py-10 text-center text-sm text-slate-500">No sites yet. Add one above.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-400">
            <th className="px-5 py-3 font-medium">Site</th>
            <th className="hidden px-3 py-3 font-medium sm:table-cell">Address</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="hidden px-3 py-3 font-medium md:table-cell">Site Staff</th>
            <th className="w-8 px-3 py-3" />
          </tr>
        </thead>
        <tbody>
          {sites.map((site) => {
            const isOpen = expandedId === site.id;
            const siteStaff = staff.filter((s) => s.siteId === site.id && s.role === "site_staff");
            return (
              <Fragment key={site.id}>
                <tr
                  onClick={() => setExpandedId(isOpen ? null : site.id)}
                  className="cursor-pointer border-b border-slate-50 hover:bg-slate-50"
                >
                  <td className="px-5 py-3 font-medium text-slate-800">{site.name}</td>
                  <td className="hidden px-3 py-3 text-slate-600 sm:table-cell">{site.address || "—"}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        site.status === "active"
                          ? "bg-emerald-100 text-emerald-800 ring-emerald-300"
                          : "bg-slate-100 text-slate-600 ring-slate-300"
                      }`}
                    >
                      {site.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="hidden px-3 py-3 text-slate-600 md:table-cell">{siteStaff.length}</td>
                  <td className="px-3 py-3 text-slate-400">
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </td>
                </tr>
                {isOpen && (
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <td colSpan={5} className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div>
                          <p className="mb-2 text-xs font-medium text-slate-500">Site staff</p>
                          {siteStaff.length === 0 ? (
                            <p className="text-sm text-slate-400">No site staff assigned yet.</p>
                          ) : (
                            <ul className="space-y-1 text-sm text-slate-700">
                              {siteStaff.map((s) => (
                                <li key={s.id}>{s.name} · {s.email}</li>
                              ))}
                            </ul>
                          )}
                          {(site.briefText || site.briefFileUrl) && (
                            <div className="mt-3 rounded-lg bg-white p-3 text-sm ring-1 ring-slate-100">
                              {site.briefText && <p className="text-slate-700">{site.briefText}</p>}
                              {site.briefFileUrl && (
                                <a href={site.briefFileUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-brand-navy hover:underline">
                                  📎 {site.briefFileName || "View document"}
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-medium text-slate-500">
                            {site.briefText || site.briefFileUrl ? "Update project brief" : "Add project brief"}
                          </p>
                          <form action={updateSiteBriefAction} className="space-y-2">
                            <input type="hidden" name="siteId" value={site.id} />
                            <textarea
                              name="briefText"
                              rows={2}
                              defaultValue={site.briefText}
                              className={inputClass}
                              placeholder="Scope, key dates, points of contact…"
                            />
                            <input name="briefFile" type="file" className="w-full text-sm" />
                            <Button type="submit" variant="secondary">Save Brief</Button>
                          </form>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
