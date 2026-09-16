import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listSites } from "@/lib/data/sites";
import { listStaff } from "@/lib/data/staff";
import { createSiteAction, updateSiteBriefAction } from "@/app/sites/actions";

export default async function SitesPage() {
  const session = await auth();
  const [sites, staff] = await Promise.all([listSites(), listStaff()]);

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Sites</h1>
        <p className="text-sm text-slate-500">The portfolio of properties being managed.</p>
      </div>

      <Card className="mb-6">
        <CardHeader title="Add Site" subtitle="Optionally attach a project brief that site staff will be able to see." />
        <form action={createSiteAction} className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input name="name" required className={inputClass} placeholder="e.g. Sunrise Residency" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
            <input name="address" className={inputClass} placeholder="Street, city" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Project brief (text)</label>
            <textarea name="briefText" rows={3} className={inputClass} placeholder="Scope, key dates, points of contact…" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Project brief (file, optional)</label>
            <input name="briefFile" type="file" className="w-full text-sm" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Add Site</Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title={`All Sites (${sites.length})`} />
        <div className="divide-y divide-slate-100">
          {sites.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-slate-500">No sites yet. Add one above.</p>
          )}
          {sites.map((site) => {
            const siteStaff = staff.filter((s) => s.siteId === site.id && s.role === "site_staff");
            return (
              <div key={site.id} className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{site.name}</p>
                    <p className="text-sm text-slate-500">{site.address || "No address on file"}</p>
                  </div>
                  <div className="text-sm text-slate-500">{siteStaff.length} site staff</div>
                </div>
                {(site.briefText || site.briefFileUrl) && (
                  <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm">
                    {site.briefText && <p className="text-slate-700">{site.briefText}</p>}
                    {site.briefFileUrl && (
                      <a href={site.briefFileUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-brand-navy hover:underline">
                        📎 {site.briefFileName || "View document"}
                      </a>
                    )}
                  </div>
                )}
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-medium text-brand-navy">
                    {site.briefText || site.briefFileUrl ? "Update brief" : "Add project brief"}
                  </summary>
                  <form action={updateSiteBriefAction} className="mt-2 space-y-2">
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
                </details>
              </div>
            );
          })}
        </div>
      </Card>
    </AppShell>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none";
