"use server";

import { auth } from "@/auth";
import { listSites } from "@/lib/data/sites";
import { listStaff } from "@/lib/data/staff";
import { parseTaskFromChat, type ParsedTaskDraft } from "@/lib/ai/openai";

export type ChatParseState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; draft: ParsedTaskDraft; rawMessage: string };

export async function parseTaskChatAction(_prev: ChatParseState, formData: FormData): Promise<ChatParseState> {
  const session = await auth();
  if (!session?.user) return { status: "error", message: "Not authenticated" };

  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { status: "error", message: "Type an instruction first." };

  try {
    const [sites, staff] = await Promise.all([listSites(), listStaff()]);
    const draft = await parseTaskFromChat({
      message,
      sites: sites.map((s) => ({ id: s.id, name: s.name })),
      staff: staff
        .filter((s) => s.active)
        .map((s) => ({ id: s.id, name: s.name, role: s.role, siteId: s.siteId })),
    });
    return { status: "success", draft, rawMessage: message };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "AI parsing failed" };
  }
}
