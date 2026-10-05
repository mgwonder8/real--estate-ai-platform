"use client";

import { useState } from "react";
import { TaskLine } from "@/components/task-line";

type LineProps = Omit<React.ComponentProps<typeof TaskLine>, "onOpen" | "open" | "href">;

/** A task row that opens its details in place when tapped. */
export function ExpandableTask({ children, ...line }: LineProps & { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <TaskLine {...line} open={open} onOpen={() => setOpen((v) => !v)} />
      {open && (
        <div className={`animate-fade-up border-t border-slate-100 px-4 pb-5 pt-4 sm:pl-16 sm:pr-5 ${line.state !== "none" ? "bg-emerald-50/30" : "bg-slate-50/50"}`}>
          {children}
        </div>
      )}
    </div>
  );
}
