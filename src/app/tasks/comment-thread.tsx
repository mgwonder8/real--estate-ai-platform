"use client";

import { useRef } from "react";
import { SendHorizontal } from "lucide-react";
import { addTaskCommentAction } from "@/app/tasks/actions";

export function CommentBox({
  taskId,
  action = addTaskCommentAction,
  placeholder = "Write a message",
}: {
  taskId: string;
  action?: (fd: FormData) => Promise<void>;
  placeholder?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await action(fd);
        formRef.current?.reset();
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="taskId" value={taskId} />
      <input
        name="message"
        required
        autoComplete="off"
        placeholder={placeholder}
        className="h-11 flex-1 rounded-xl bg-slate-50 px-4 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy/15"
      />
      <button
        type="submit"
        aria-label="Send"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-white transition hover:bg-brand-navy-soft active:scale-95"
      >
        <SendHorizontal size={17} />
      </button>
    </form>
  );
}
