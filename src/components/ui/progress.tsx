import { STATUS_META, STATUS_ORDER } from "@/lib/task-meta";
import type { TaskStatus } from "@/lib/data/types";

export function StatusBar({
  counts,
  className = "h-2",
}: {
  counts: Record<TaskStatus, number>;
  className?: string;
}) {
  const total = STATUS_ORDER.reduce((sum, s) => sum + counts[s], 0);
  if (total === 0) return <div className={`w-full rounded-full bg-slate-100 ${className}`} />;
  return (
    <div className={`flex w-full gap-0.5 overflow-hidden rounded-full bg-slate-100 ${className}`}>
      {STATUS_ORDER.filter((s) => counts[s] > 0).map((s) => (
        <div
          key={s}
          title={`${STATUS_META[s].label}: ${counts[s]}`}
          className={`${STATUS_META[s].bar} h-full transition-all`}
          style={{ width: `${(counts[s] / total) * 100}%` }}
        />
      ))}
    </div>
  );
}

export function ProgressRing({ value, size = 44, stroke = 5 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-slate-100" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          className="stroke-emerald-500 transition-all"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-slate-800">
        {Math.round(pct)}%
      </span>
    </div>
  );
}

export function MeterBar({ value, tone = "emerald" }: { value: number; tone?: "emerald" | "amber" | "red" | "slate" }) {
  const tones = { emerald: "bg-emerald-500", amber: "bg-amber-400", red: "bg-red-500", slate: "bg-slate-400" };
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${tones[tone]}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
