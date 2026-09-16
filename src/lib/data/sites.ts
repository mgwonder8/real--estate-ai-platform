import { appendRow, readTable, updateRow, findRowById } from "@/lib/google/sheet-table";
import { newId } from "@/lib/ids";
import type { Site, SiteStatus } from "@/lib/data/types";

const TAB = "Sites";

function toSite(data: Record<string, string>): Site {
  return {
    id: data.id,
    name: data.name,
    address: data.address,
    status: (data.status as SiteStatus) || "active",
    createdAt: data.created_at,
    briefText: data.brief_text ?? "",
    briefFileUrl: data.brief_file_url ?? "",
    briefFileName: data.brief_file_name ?? "",
  };
}

export async function listSites(): Promise<Site[]> {
  const { rows } = await readTable(TAB);
  return rows.map((r) => toSite(r.data));
}

export async function getSite(id: string): Promise<Site | null> {
  const row = await findRowById(TAB, id);
  return row ? toSite(row.data) : null;
}

export async function createSite(input: {
  name: string;
  address: string;
  briefText?: string;
  briefFileUrl?: string;
  briefFileName?: string;
}): Promise<Site> {
  const site: Site = {
    id: newId("site"),
    name: input.name,
    address: input.address,
    status: "active",
    createdAt: new Date().toISOString(),
    briefText: input.briefText ?? "",
    briefFileUrl: input.briefFileUrl ?? "",
    briefFileName: input.briefFileName ?? "",
  };
  await appendRow(TAB, {
    id: site.id,
    name: site.name,
    address: site.address,
    status: site.status,
    created_at: site.createdAt,
    brief_text: site.briefText,
    brief_file_url: site.briefFileUrl,
    brief_file_name: site.briefFileName,
  });
  return site;
}

export async function setSiteStatus(id: string, status: SiteStatus): Promise<void> {
  const row = await findRowById(TAB, id);
  if (!row) throw new Error(`Site not found: ${id}`);
  await updateRow(TAB, row.rowNumber, { ...row.data, status });
}

export async function updateSiteBrief(id: string, input: {
  briefText?: string;
  briefFileUrl?: string;
  briefFileName?: string;
}): Promise<void> {
  const row = await findRowById(TAB, id);
  if (!row) throw new Error(`Site not found: ${id}`);
  await updateRow(TAB, row.rowNumber, {
    ...row.data,
    ...(input.briefText !== undefined ? { brief_text: input.briefText } : {}),
    ...(input.briefFileUrl !== undefined ? { brief_file_url: input.briefFileUrl } : {}),
    ...(input.briefFileName !== undefined ? { brief_file_name: input.briefFileName } : {}),
  });
}
