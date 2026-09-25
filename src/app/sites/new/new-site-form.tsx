"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { createSiteAction } from "@/app/sites/actions";

export function NewSiteForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fileName, setFileName] = useState("");

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          await createSiteAction(fd);
          router.push("/sites");
        })
      }
      className="space-y-5"
    >
      <Field label="Site name">
        <input name="name" required autoFocus className={inputClass} placeholder="e.g. Govindham" />
      </Field>
      <Field label="Location">
        <input name="address" className={inputClass} placeholder="Area, city" />
      </Field>
      <Field label="Project brief" hint="Optional">
        <textarea name="briefText" rows={3} className={`${inputClass} resize-none`} placeholder="Scope, key dates, contacts" />
      </Field>
      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3.5 py-3 text-sm text-slate-500 hover:bg-slate-50">
        <Paperclip size={16} />
        <span className="truncate">{fileName || "Attach a document (optional)"}</span>
        <input name="briefFile" type="file" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending} className="min-w-28">
          {pending && <Loader2 size={16} className="animate-spin" />}
          Add site
        </Button>
      </div>
    </form>
  );
}
