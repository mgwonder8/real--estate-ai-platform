import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { ArrowLeft, ListChecks, Lock, MessageCircle } from "lucide-react";
import { auth } from "@/auth";
import { Avatar } from "@/components/ui/avatar";
import { roleLabel } from "@/lib/roles";
import { getT } from "@/lib/i18n/server";
import { getStaff } from "@/lib/data/staff";
import { listMessagesBetween, markConversationRead } from "@/lib/data/messages";
import { listPersonalTasksBetween } from "@/lib/data/personal-tasks";
import { ChatWindow } from "@/app/(app)/chat/[staffId]/chat-window";
import { PersonalTaskBoard } from "./personal-task-board";

export default async function PersonalThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ staffId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const tr = await getT();
  const session = await auth();
  const me = session!.user.id;
  const { staffId } = await params;
  const { view } = await searchParams;
  if (staffId === me) notFound();

  const [partner, messages, tasks] = await Promise.all([
    getStaff(staffId),
    listMessagesBetween(me, staffId, "personal"),
    listPersonalTasksBetween(me, staffId),
  ]);
  if (!partner) notFound();

  const showChat = view === "chat";
  const unread = messages.filter((m) => m.toId === me && !m.readAt).length;
  if (showChat) after(() => markConversationRead(me, staffId, "personal"));

  const openCount = tasks.filter((t) => !t.done).length;
  const firstName = partner.name.split(" ")[0];

  return (
    <div className="flex h-[calc(100dvh_-_7.75rem_-_env(safe-area-inset-bottom))] flex-col overflow-hidden bg-slate-50 lg:h-[calc(100vh_-_3rem)] lg:rounded-2xl lg:border lg:border-slate-200 lg:shadow-sm">
      <div className="border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3 px-3 py-2.5 lg:px-4 lg:py-3">
          <Link
            href="/personal"
            aria-label={tr("pe.backTo")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
          >
            <ArrowLeft size={18} />
          </Link>
          <Avatar name={partner.name} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{partner.name}</p>
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <Lock size={11} className="text-brand-gold" /> {tr("pe.private")} · {roleLabel(partner.role, tr)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 px-3 lg:px-4">
          <Tab href={`/personal/${staffId}`} on={!showChat} icon={<ListChecks size={15} />} label={tr("pe.tasksTab")} count={openCount} />
          <Tab href={`/personal/${staffId}?view=chat`} on={showChat} icon={<MessageCircle size={15} />} label={tr("pe.chatTab")} count={unread} badge />
        </div>
      </div>

      {showChat ? (
        <ChatWindow
          channel="personal"
          partner={partner}
          myStaffId={me}
          myRole={session!.user.role}
          initial={messages}
          taskIndex={{}}
          taskOptions={[]}
          defaultTaskId=""
        />
      ) : (
        <PersonalTaskBoard me={me} partner={{ id: partner.id, name: partner.name }} tasks={tasks} />
      )}

      <p className="sr-only">{tr("cw.onlyYou", { name: firstName })}</p>
    </div>
  );
}

function Tab({
  href,
  on,
  icon,
  label,
  count,
  badge = false,
}: {
  href: string;
  on: boolean;
  icon: React.ReactNode;
  label: string;
  count: number;
  badge?: boolean;
}) {
  return (
    <Link
      href={href}
      replace
      className={`relative flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition ${
        on ? "text-brand-navy" : "text-slate-400 hover:text-slate-600"
      }`}
    >
      {icon}
      {label}
      {count > 0 && (
        <span
          className={`rounded-full px-1.5 text-[11px] font-semibold ${
            badge && !on ? "bg-brand-gold text-white" : on ? "bg-brand-navy/10 text-brand-navy" : "bg-slate-100 text-slate-500"
          }`}
        >
          {count}
        </span>
      )}
      {on && <span className="absolute inset-x-6 bottom-0 h-[3px] rounded-t-full bg-brand-gold" />}
    </Link>
  );
}
