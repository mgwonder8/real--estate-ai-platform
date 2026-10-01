import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import { auth } from "@/auth";
import { Avatar } from "@/components/ui/avatar";
import { ChatSwitch } from "@/components/chat-switch";
import { ROLE_LABEL } from "@/lib/roles";
import { listStaff } from "@/lib/data/staff";
import { countUnread, listConversations } from "@/lib/data/messages";
import { listPersonalTasksFor } from "@/lib/data/personal-tasks";
import { timeAgo } from "@/lib/task-meta";

export default async function PersonalPage() {
  const session = await auth();
  const me = session!.user.id;
  const [staff, convos, tasks, unread] = await Promise.all([
    listStaff(),
    listConversations(me, "personal"),
    listPersonalTasksFor(me),
    countUnread(me),
  ]);

  const people = staff.filter((s) => s.id !== me && s.active);
  const rows = people.map((p) => {
    const convo = convos.find((c) => c.partnerId === p.id);
    const theirs = tasks.filter((t) => t.fromId === p.id || t.toId === p.id);
    const open = theirs.filter((t) => !t.done);
    const lastTask = theirs.at(-1);
    const lastAt = [convo?.last.createdAt, lastTask?.createdAt, ...theirs.map((t) => t.doneAt)].filter(Boolean).sort().at(-1) ?? "";
    return { p, convo, open, lastAt };
  });
  const active = rows.filter((r) => r.lastAt).sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  const fresh = rows.filter((r) => !r.lastAt).sort((a, b) => a.p.name.localeCompare(b.p.name));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">Chat</h1>
      <ChatSwitch active="personal" teamUnread={unread.team} personalUnread={unread.personal} />

      <div className="mb-5 flex items-start gap-3 rounded-2xl bg-brand-navy px-4 py-3.5 text-white">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-gold">
          <Lock size={17} />
        </span>
        <div>
          <p className="text-sm font-semibold">Private between two people</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-300">
            Tasks and messages here are seen only by you and the other person. They never appear on site task lists or reports.
          </p>
        </div>
      </div>

      {active.length > 0 && (
        <div className="mb-6 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {active.map(({ p, convo, open }) => {
            const preview = convo
              ? `${convo.last.fromId === me ? "You: " : ""}${convo.last.message || (convo.last.attachmentUrl ? convo.last.attachmentName || "File" : "")}`
              : "";
            return (
              <Link key={p.id} href={`/personal/${p.id}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50 active:bg-slate-100">
                <div className="relative shrink-0">
                  <Avatar name={p.name} size="md" />
                  {convo && convo.unread > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-gold px-1 text-[10px] font-bold text-white">
                      {convo.unread}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`truncate text-sm ${convo?.unread ? "font-semibold text-slate-900" : "font-medium text-slate-800"}`}>{p.name}</p>
                    {convo && <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(convo.last.createdAt)}</span>}
                  </div>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                    {open.length > 0 && (
                      <span className="shrink-0 rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-700">
                        {open.length} open {open.length === 1 ? "task" : "tasks"}
                      </span>
                    )}
                    <span className="truncate text-slate-400">{preview}</span>
                  </p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-slate-300" />
              </Link>
            );
          })}
        </div>
      )}

      {fresh.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Start a private thread</p>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {fresh.map(({ p }) => (
              <Link key={p.id} href={`/personal/${p.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 active:bg-slate-100">
                <Avatar name={p.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-400">{ROLE_LABEL[p.role] ?? p.role}</p>
                </div>
                <Lock size={14} className="shrink-0 text-slate-300" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
