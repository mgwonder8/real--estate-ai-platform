import { addTaskCommentAction } from "@/app/tasks/actions";
import type { Staff, TaskComment } from "@/lib/data/types";

export function CommentThread({
  taskId,
  comments,
  staffById,
}: {
  taskId: string;
  comments: TaskComment[];
  staffById: Record<string, Staff>;
}) {
  return (
    <div className="mt-2 space-y-2">
      {comments.length > 0 && (
        <div className="space-y-1.5">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <p className="text-slate-700">{c.message}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {staffById[c.authorId]?.name ?? "Unknown"} ({c.authorRole.replace("_", " ")}) ·{" "}
                {new Date(c.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
      <form action={addTaskCommentAction} className="flex gap-2">
        <input type="hidden" name="taskId" value={taskId} />
        <input
          name="message"
          placeholder="Add a comment…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-navy focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-300"
        >
          Send
        </button>
      </form>
    </div>
  );
}
