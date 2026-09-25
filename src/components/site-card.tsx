import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { AvatarStack } from "@/components/ui/avatar";
import { ProgressRing, StatusBar } from "@/components/ui/progress";
import { isOverdue, statusCounts } from "@/lib/task-meta";
import type { Site, Staff, Task } from "@/lib/data/types";

export function SiteCard({ site, tasks, people }: { site: Site; tasks: Task[]; people: Staff[] }) {
  const counts = statusCounts(tasks);
  const late = tasks.filter(isOverdue).length;
  const pct = tasks.length ? (counts.approved / tasks.length) * 100 : 0;
  const open = counts.pending + counts.in_progress;

  return (
    <Link
      href={`/sites/${site.id}`}
      className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900">{site.name}</p>
          {site.address && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
              <MapPin size={11} /> {site.address}
            </p>
          )}
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition group-hover:bg-brand-navy group-hover:text-white">
          <ArrowUpRight size={16} />
        </span>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <ProgressRing value={pct} size={52} stroke={5} />
        <div className="grid flex-1 grid-cols-3 gap-2 text-center">
          <Metric value={open} label="Open" tone="text-amber-600" />
          <Metric value={counts.completed} label="Review" tone="text-violet-600" />
          <Metric value={late} label="Late" tone={late ? "text-red-600" : "text-slate-400"} />
        </div>
      </div>

      <StatusBar counts={counts} className="mt-4 h-1.5" />

      <div className="mt-4 flex items-center justify-between">
        <AvatarStack names={people.map((p) => p.name)} max={4} size="sm" />
        <span className="text-xs text-slate-400">{tasks.length} tasks</span>
      </div>
    </Link>
  );
}

function Metric({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div>
      <p className={`text-lg font-semibold leading-none ${value ? tone : "text-slate-300"}`}>{value}</p>
      <p className="mt-1 text-[11px] text-slate-400">{label}</p>
    </div>
  );
}
