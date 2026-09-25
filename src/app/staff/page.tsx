import Link from "next/link";
import { Mail, MapPin, Pencil, Phone, Plus, Users } from "lucide-react";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card, EmptyState } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { MeterBar } from "@/components/ui/progress";
import { listStaff, allSiteIds } from "@/lib/data/staff";
import { listSites } from "@/lib/data/sites";
import { listTasks } from "@/lib/data/tasks";
import { isOpen, isOverdue } from "@/lib/task-meta";
import { toggleStaffActiveAction } from "@/app/staff/actions";

const ROLE_LABEL: Record<string, string> = { owner: "Owner", office_staff: "Office", site_staff: "Site staff" };
const ROLE_TONE: Record<string, string> = {
  owner: "bg-brand-navy text-white",
  office_staff: "bg-sky-50 text-sky-700",
  site_staff: "bg-amber-50 text-amber-800",
};

export default async function StaffPage() {
  const session = await auth();
  const [staff, sites, tasks] = await Promise.all([listStaff(), listSites(), listTasks()]);
  const siteById = Object.fromEntries(sites.map((s) => [s.id, s]));
  const order = { owner: 0, office_staff: 1, site_staff: 2 } as Record<string, number>;
  const sorted = [...staff].sort((a, b) => Number(b.active) - Number(a.active) || order[a.role] - order[b.role] || a.name.localeCompare(b.name));

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <PageHeader
        title="Team"
        actions={
          <ButtonLink href="/staff/new" variant="secondary">
            <Plus size={16} /> Add person
          </ButtonLink>
        }
      />

      {staff.length === 0 ? (
        <Card>
          <EmptyState icon={<Users size={20} />} title="No one added yet" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((s) => {
            const mine = tasks.filter((t) => t.assigneeIds.includes(s.id));
            const open = mine.filter(isOpen).length;
            const review = mine.filter((t) => t.status === "completed").length;
            const done = mine.filter((t) => t.status === "approved").length;
            const late = mine.filter(isOverdue).length;
            const rate = mine.length ? Math.round((done / mine.length) * 100) : 0;
            return (
              <Card key={s.id} className={`flex flex-col p-5 ${s.active ? "" : "opacity-60"}`}>
                <div className="flex items-start gap-3">
                  <Avatar name={s.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-slate-900">{s.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${ROLE_TONE[s.role]}`}>{ROLE_LABEL[s.role]}</span>
                      {allSiteIds(s).map((sid) => siteById[sid] && (
                        <span key={sid} className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <MapPin size={11} /> {siteById[sid].name}
                        </span>
                      ))}
                      {!s.active && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">Inactive</span>}
                    </div>
                  </div>
                  <Link
                    href={`/staff/${s.id}/edit`}
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    title="Edit"
                  >
                    <Pencil size={15} />
                  </Link>
                </div>

                <div className="mt-4 space-y-1 text-xs text-slate-500">
                  {s.phone && (
                    <a href={`tel:${s.phone}`} className="flex items-center gap-2 hover:text-brand-navy">
                      <Phone size={12} /> {s.phone}
                    </a>
                  )}
                  <a href={`mailto:${s.email}`} className="flex items-center gap-2 truncate hover:text-brand-navy">
                    <Mail size={12} /> {s.email}
                  </a>
                </div>

                {s.role !== "owner" && (
                  <Link href={`/tasks?staff=${s.id}`} className="mt-4 block rounded-xl bg-slate-50 p-3 transition hover:bg-slate-100">
                    <div className="grid grid-cols-4 gap-1 text-center">
                      <Mini value={open} label="Open" tone="text-amber-600" />
                      <Mini value={review} label="Review" tone="text-violet-600" />
                      <Mini value={done} label="Done" tone="text-emerald-600" />
                      <Mini value={late} label="Late" tone="text-red-600" />
                    </div>
                    <div className="mt-3">
                      <MeterBar value={rate} tone={rate >= 70 ? "emerald" : rate >= 40 ? "amber" : "slate"} />
                    </div>
                  </Link>
                )}

                {s.id !== session!.user.id && (
                  <form action={toggleStaffActiveAction} className="mt-3 flex justify-end">
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="active" value={(!s.active).toString()} />
                    <button type="submit" className="text-xs font-medium text-slate-400 hover:text-slate-700">
                      {s.active ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function Mini({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div>
      <p className={`text-base font-semibold leading-none ${value ? tone : "text-slate-300"}`}>{value}</p>
      <p className="mt-1 text-[10px] text-slate-400">{label}</p>
    </div>
  );
}
