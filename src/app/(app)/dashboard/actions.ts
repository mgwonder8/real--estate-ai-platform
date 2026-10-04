"use server";

import { auth } from "@/auth";
import { listSites } from "@/lib/data/sites";
import { listStaff } from "@/lib/data/staff";
import { parseTaskFromChat, type ParsedTaskDraft } from "@/lib/ai/openai";
import { getT } from "@/lib/i18n/server";

export type ChatParseState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; draft: ParsedTaskDraft; rawMessage: string };

export async function parseTaskChatAction(_prev: ChatParseState, formData: FormData): Promise<ChatParseState> {
  const t = await getT();
  const session = await auth();
  if (!session?.user) return { status: "error", message: t("common.notAuthenticated") };

  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { status: "error", message: t("dash.typeFirst") };

  try {
    const [sites, staff] = await Promise.all([listSites(), listStaff()]);
    const draft = await parseTaskFromChat({
      message,
      language: t.locale,
      sites: sites.map((s) => ({ id: s.id, name: s.name })),
      staff: staff
        .filter((s) => s.active)
        .map((s) => ({ id: s.id, name: s.name, role: s.role, siteId: s.siteId })),
    });
    return { status: "success", draft, rawMessage: message };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : t("dash.aiFailed") };
  }
}
