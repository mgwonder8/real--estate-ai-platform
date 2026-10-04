import type { T } from "@/lib/i18n/translate";

/** Old confirmations were plain text; newer ones also carry taskId. */
export function parseTaskConfirmation(msg: string): { title: string; due?: string } | null {
  const m = msg.match(/^(?:✅ )?Task assigned:\s*"(.+?)"(?:,?\s*(?:[—-]\s*)?due\s+(\S+))?$/);
  return m ? { title: m[1], due: m[2] } : null;
}

/** Text for a conversation list row; auto-generated task messages are shown in the reader's language. */
export function previewText(message: string, t: T): string {
  const conf = parseTaskConfirmation(message);
  return conf ? `${t("cw.taskAssigned")}: "${conf.title}"` : message;
}
