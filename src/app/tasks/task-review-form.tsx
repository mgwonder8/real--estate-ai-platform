"use client";

import { useState } from "react";
import { Check, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { approveTaskAction, requestTaskChangesAction } from "@/app/tasks/actions";

export function TaskReviewForm({ taskId }: { taskId: string }) {
  const [comment, setComment] = useState("");

  return (
    <form className="space-y-3 rounded-xl bg-violet-50/60 p-3 ring-1 ring-violet-100">
      <p className="text-sm font-medium text-violet-900">Work is done. Check the proof and decide.</p>
      <input type="hidden" name="taskId" value={taskId} />
      <textarea
        name="comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Note (needed to send back)"
        className={`${inputClass} resize-none`}
      />
      <div className="flex flex-wrap gap-2">
        <Button formAction={approveTaskAction} type="submit">
          <Check size={16} /> Approve
        </Button>
        <Button formAction={requestTaskChangesAction} type="submit" variant="secondary" disabled={comment.trim().length === 0}>
          <Undo2 size={16} /> Send back
        </Button>
      </div>
    </form>
  );
}
