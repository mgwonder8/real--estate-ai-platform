"use client";

import { useState } from "react";
import { FileText, Paperclip, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { updateSiteBriefAction } from "@/app/sites/actions";
import type { Site } from "@/lib/data/types";

export function SiteBriefForm({ site }: { site: Site }) {
  const hasBrief = !!(site.briefText || site.briefFileUrl);
  const [editing, setEditing] = useState(!hasBrief);
  const [fileName, setFileName] = useState("");

  if (!editing) {
    return (
      <div>
        {site.briefText && <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{site.briefText}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {site.briefFileUrl && (
            <a
              href={site.briefFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-brand-navy ring-1 ring-slate-200 hover:bg-slate-100"
            >
              <FileText size={14} /> {site.briefFileName || "Document"}
            </a>
          )}
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
          >
            <Pencil size={13} /> Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      action={async (fd) => {
        await updateSiteBriefAction(fd);
        setEditing(false);
      }}
      className="space-y-2"
    >
      <input type="hidden" name="siteId" value={site.id} />
      <textarea
        name="briefText"
        rows={4}
        defaultValue={site.briefText}
        className={`${inputClass} resize-none`}
        placeholder="Scope, key dates, contacts"
      />
      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3.5 py-2.5 text-sm text-slate-500 hover:bg-slate-50">
        <Paperclip size={15} />
        <span className="truncate">{fileName || "Attach a document"}</span>
        <input name="briefFile" type="file" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm">Save</Button>
        {hasBrief && (
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
