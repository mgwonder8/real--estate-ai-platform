import Link from "next/link";
import { MessageCircle, Plus } from "lucide-react";
import { auth } from "@/auth";
import { Card, EmptyState } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ChatSwitch } from "@/components/chat-switch";
import { listStaff } from "@/lib/data/staff";
import { countUnread, listConversations } from "@/lib/data/messages";
import { roleLabel } from "@/lib/roles";
import { timeAgo } from "@/lib/task-meta";
import { previewText } from "@/lib/chat-format";
import { getT } from "@/lib/i18n/server";

export default async function ChatPage() {
  const t = await getT();
  const session = await auth();
  const [allStaff, conversations, unread] = await Promise.all([
    listStaff(),
    listConversations(session!.user.id),
    countUnread(session!.user.id),
  ]);

  const staffById = Object.fromEntries(allStaff.map((s) => [s.id, s]));
  const others = allStaff.filter((s) => s.id !== session!.user.id && s.active);
  const conversationPartnerIds = new Set(conversations.map((c) => c.partnerId));
  const newChats = others.filter((s) => !conversationPartnerIds.has(s.id));

  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">{t("chat.title")}</h1>
      <ChatSwitch active="team" teamUnread={unread.team} personalUnread={unread.personal} />

      {conversations.length === 0 && newChats.length === 0 && (
        <Card>
          <EmptyState icon={<MessageCircle size={20} />} title={t("chat.none")} />
        </Card>
      )}

      {conversations.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
          {conversations.map(({ partnerId, last, unread }) => {
            const p = staffById[partnerId];
            if (!p) return null;
            const mine = last.fromId === session!.user.id;
            return (
              <Link
                key={partnerId}
                href={`/chat/${partnerId}`}
                className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50 active:bg-slate-100"
              >
                <div className="relative shrink-0">
                  <Avatar name={p.name} size="md" />
                  {unread > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-navy px-1 text-[10px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`truncate text-sm ${unread ? "font-semibold text-slate-900" : "font-medium text-slate-800"}`}>
                      {p.name}
                    </p>
                    <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(last.createdAt, t)}</span>
                  </div>
                  <p className={`mt-0.5 truncate text-xs ${unread ? "font-medium text-slate-700" : "text-slate-400"}`}>
                    {mine ? t("chat.youPrefix") : ""}
                    {previewText(last.message, t) || (last.attachmentUrl ? `📎 ${last.attachmentName}` : "")}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {newChats.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{t("chat.start")}</p>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
            {newChats.map((s) => (
              <Link
                key={s.id}
                href={`/chat/${s.id}`}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 active:bg-slate-100"
              >
                <Avatar name={s.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{s.name}</p>
                  <p className="text-xs text-slate-400">{roleLabel(s.role, t)}</p>
                </div>
                <Plus size={16} className="shrink-0 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
