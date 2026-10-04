"use client";

import { useState } from "react";
import { FileText, Paperclip, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { updateSiteBriefAction } from "@/app/(app)/sites/actions";
import { useT } from "@/lib/i18n/client";
import type { Site } from "@/lib/data/types";

export function SiteBriefForm({ site }: { site: Site }) {
  const t = useT();
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
              className="inline-flex min-h-11 max-w-full items-center gap-1.5 break-all rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-brand-navy ring-1 ring-slate-200 hover:bg-slate-100"
            >
              <FileText size={14} /> {site.briefFileName || t("ss.document")}
            </a>
          )}
          <button
            onClick={() => setEditing(true)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
          >
            <Pencil size={13} /> {t("common.edit")}
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
        placeholder={t("ns.briefPh")}
      />
      <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3.5 py-2.5 text-sm text-slate-500 hover:bg-slate-50">
        <Paperclip size={15} />
        <span className="min-w-0 break-all">{fileName || t("ns.attach")}</span>
        <input name="briefFile" type="file" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm">{t("common.save")}</Button>
        {hasBrief && (
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
            {t("common.cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
