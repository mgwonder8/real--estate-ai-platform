const PALETTE = [
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700",
];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SIZES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function Avatar({ name, size = "sm" }: { name: string; size?: keyof typeof SIZES }) {
  return (
    <span
      title={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${colorFor(name)} ${SIZES[size]}`}
    >
      {initialsFor(name)}
    </span>
  );
}

export function AvatarStack({
  names,
  max = 3,
  size = "xs",
}: {
  names: string[];
  max?: number;
  size?: keyof typeof SIZES;
}) {
  const visible = names.slice(0, max);
  const extra = names.length - visible.length;
  if (names.length === 0) {
    return <span className="text-xs text-slate-400">Unassigned</span>;
  }
  return (
    <span className="flex items-center -space-x-1.5" title={names.join(", ")}>
      {visible.map((name, i) => (
        <span key={i} className="rounded-full ring-2 ring-white">
          <Avatar name={name} size={size} />
        </span>
      ))}
      {extra > 0 && (
        <span className={`flex items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-600 ring-2 ring-white ${SIZES[size]}`}>
          +{extra}
        </span>
      )}
    </span>
  );
}
