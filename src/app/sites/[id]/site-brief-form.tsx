"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateSiteBriefAction } from "@/app/sites/actions";
import type { Site } from "@/lib/data/types";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none";

export function SiteBriefForm({ site }: { site: Site }) {
  const hasBrief = !!(site.briefText || site.briefFileUrl);
  const [editing, setEditing] = useState(!hasBrief);

  if (!editing) {
    return (
      <div>
        {site.briefText && <p className="whitespace-pre-line text-sm text-slate-700">{site.briefText}</p>}
        {site.briefFileUrl && (
          <a
            href={site.briefFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-brand-navy hover:underline"
          >
            📎 {site.briefFileName || "View document"}
          </a>
        )}
        <button
          onClick={() => setEditing(true)}
          className="mt-3 text-xs font-medium text-brand-navy hover:underline"
        >
          Edit
        </button>
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
        className={inputClass}
        placeholder="Scope, key dates, points of contact…"
      />
      <input name="briefFile" type="file" className="w-full text-sm" />
      <div className="flex gap-2">
        <Button type="submit" variant="secondary">Save</Button>
        {hasBrief && (
          <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        )}
      </div>
    </form>
  );
}
