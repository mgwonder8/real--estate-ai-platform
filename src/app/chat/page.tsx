import Link from "next/link";
import { MessageCircle, Plus } from "lucide-react";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Card, EmptyState } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/page-header";
import { listStaff } from "@/lib/data/staff";
import { listConversations } from "@/lib/data/messages";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default async function ChatPage() {
  const session = await auth();
  const [allStaff, conversations] = await Promise.all([
    listStaff(),
    listConversations(session!.user.id),
  ]);

  const staffById = Object.fromEntries(allStaff.map((s) => [s.id, s]));
  const others = allStaff.filter((s) => s.id !== session!.user.id && s.active);
  const conversationPartnerIds = new Set(conversations.map((c) => c.partnerId));
  const newChats = others.filter((s) => !conversationPartnerIds.has(s.id));

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <PageHeader title="Team chat" />

      {conversations.length === 0 && newChats.length === 0 && (
        <Card>
          <EmptyState icon={<MessageCircle size={20} />} title="No conversations yet" />
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
                    <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(last.createdAt)}</span>
                  </div>
                  <p className={`mt-0.5 truncate text-xs ${unread ? "font-medium text-slate-700" : "text-slate-400"}`}>
                    {mine ? "You: " : ""}
                    {last.message || (last.attachmentUrl ? `📎 ${last.attachmentName}` : "")}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {newChats.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Start a conversation</p>
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
                  <p className="text-xs text-slate-400">{s.role === "owner" ? "Owner" : s.role === "office_staff" ? "Office" : "Site staff"}</p>
                </div>
                <Plus size={16} className="shrink-0 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
