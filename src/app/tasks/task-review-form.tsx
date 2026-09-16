"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { approveTaskAction, requestTaskChangesAction } from "@/app/tasks/actions";

export function TaskReviewForm({ taskId }: { taskId: string }) {
  const [comment, setComment] = useState("");

  return (
    <form className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <input type="hidden" name="taskId" value={taskId} />
      <textarea
        name="comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Feedback for the site staff (required to request changes, optional to approve)…"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none"
      />
      <div className="flex gap-2">
        <Button formAction={approveTaskAction} type="submit" variant="primary">
          Approve
        </Button>
        <Button
          formAction={requestTaskChangesAction}
          type="submit"
          variant="secondary"
          disabled={comment.trim().length === 0}
        >
          Request Changes
        </Button>
      </div>
    </form>
  );
}
