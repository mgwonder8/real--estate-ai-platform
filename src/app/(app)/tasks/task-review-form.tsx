"use client";

import { useState } from "react";
import { Check, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { approveTaskAction, requestTaskChangesAction } from "@/app/(app)/tasks/actions";
import { useT } from "@/lib/i18n/client";

export function TaskReviewForm({ taskId }: { taskId: string }) {
  const t = useT();
  const [comment, setComment] = useState("");

  return (
    <form className="space-y-3 rounded-xl bg-emerald-50/60 p-3 ring-1 ring-emerald-100">
      <p className="text-sm font-medium text-emerald-900">{t("rv.prompt")}</p>
      <input type="hidden" name="taskId" value={taskId} />
      <textarea
        name="comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder={t("rv.notePh")}
        className={`${inputClass} resize-none`}
      />
      <div className="flex flex-wrap gap-2">
        <Button formAction={approveTaskAction} type="submit">
          <Check size={16} /> {t("rv.approve")}
        </Button>
        <Button formAction={requestTaskChangesAction} type="submit" variant="secondary" disabled={comment.trim().length === 0}>
          <Undo2 size={16} /> {t("rv.sendBack")}
        </Button>
      </div>
    </form>
  );
}
