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

export async function createSite(input: { name: string; address: string }): Promise<Site> {
  const site: Site = {
    id: newId("site"),
    name: input.name,
    address: input.address,
    status: "active",
    createdAt: new Date().toISOString(),
  };
  await appendRow(TAB, {
    id: site.id,
    name: site.name,
    address: site.address,
    status: site.status,
    created_at: site.createdAt,
  });
  return site;
}

export async function setSiteStatus(id: string, status: SiteStatus): Promise<void> {
  const row = await findRowById(TAB, id);
  if (!row) throw new Error(`Site not found: ${id}`);
  await updateRow(TAB, row.rowNumber, { ...row.data, status });
}
