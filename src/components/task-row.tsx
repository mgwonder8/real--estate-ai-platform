import Link from "next/link";
import { ChevronRight, MessageSquare, Camera, MapPin } from "lucide-react";
import { AvatarStack } from "@/components/ui/avatar";
import { DueBadge, PriorityDot, StatusPill } from "@/components/ui/status-pill";
import { STATUS_META } from "@/lib/task-meta";
import type { Task } from "@/lib/data/types";

export function TaskRow({
  task,
  siteName,
  assigneeNames,
  comments = 0,
  proofs = 0,
}: {
  task: Task;
  siteName?: string;
  assigneeNames: string[];
  comments?: number;
  proofs?: number;
}) {
  return (
    <Link
      href={`/tasks/${task.id}`}
      className="group relative flex items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50/80 sm:px-5"
    >
      <span className={`absolute inset-y-3 left-0 w-1 rounded-r-full ${STATUS_META[task.status].dot}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <PriorityDot priority={task.priority} />
          <p className="truncate text-sm font-medium text-slate-900">{task.title}</p>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          {siteName && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} /> {siteName}
            </span>
          )}
          {comments > 0 && (
            <span className="inline-flex items-center gap-1">
              <MessageSquare size={11} /> {comments}
            </span>
          )}
          {proofs > 0 && (
            <span className="inline-flex items-center gap-1">
              <Camera size={11} /> {proofs}
            </span>
          )}
          <span className="sm:hidden">
            <StatusPill status={task.status} />
          </span>
        </div>
      </div>
      <div className="hidden w-20 justify-end sm:flex">
        <DueBadge task={task} />
      </div>
      <div className="hidden w-32 sm:block">
        <StatusPill status={task.status} />
      </div>
      <div className="flex w-16 justify-end">
        <AvatarStack names={assigneeNames} />
      </div>
      <ChevronRight size={16} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
    </Link>
  );
}
