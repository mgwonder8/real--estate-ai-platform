import { notFound } from "next/navigation";
import { after } from "next/server";
import Link from "next/link";
import { ArrowLeft, Phone } from "lucide-react";
import { auth } from "@/auth";
import { Avatar } from "@/components/ui/avatar";
import { ROLE_LABEL } from "@/lib/roles";
import { getStaff } from "@/lib/data/staff";
import { listTasks } from "@/lib/data/tasks";
import { listMessagesBetween, markConversationRead } from "@/lib/data/messages";
import { ChatWindow, type TaskOption } from "./chat-window";

const STATUS_RANK: Record<string, number> = { in_progress: 0, pending: 1, completed: 2, approved: 3 };

export default async function ChatConversationPage({ params }: { params: Promise<{ staffId: string }> }) {
  const session = await auth();
  const { staffId } = await params;
  const me = session!.user.id;
  const myRole = session!.user.role;

  const [partner, messages, tasks] = await Promise.all([
    getStaff(staffId),
    listMessagesBetween(me, staffId),
    listTasks(),
  ]);
  if (!partner) notFound();

  after(() => markConversationRead(me, staffId));

  const involved = tasks.filter((t) =>
    [me, staffId].some((id) => t.assigneeIds.includes(id) || t.createdBy === id)
  );
  const taskIndex: Record<string, TaskOption> = Object.fromEntries(
    involved.map((t) => [t.id, { id: t.id, title: t.title, status: t.status, deadline: t.deadline }])
  );

  // Tasks a file from this chat can be saved to: staff can only add to their own work;
  // the office adds references to work assigned to (or raised by) the person they're chatting with.
  const options = involved
    .filter((t) =>
      myRole === "site_staff"
        ? t.assigneeIds.includes(me)
        : t.assigneeIds.includes(staffId) || t.createdBy === staffId
    )
    .filter((t) => t.status !== "approved")
    .sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || b.updatedAt.localeCompare(a.updatedAt))
    .map((t) => taskIndex[t.id]);

  const lastDiscussed = [...messages].reverse().find((m) => m.taskId && options.some((o) => o.id === m.taskId))?.taskId;
  const defaultTaskId = lastDiscussed ?? options[0]?.id ?? "";

  return (
    <div className="flex h-[calc(100dvh_-_7.75rem_-_env(safe-area-inset-bottom))] flex-col overflow-hidden bg-slate-50 lg:h-[calc(100vh_-_3rem)] lg:rounded-2xl lg:border lg:border-slate-200 lg:shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-2.5 lg:px-4 lg:py-3.5">
        <Link
          href="/chat"
          aria-label="Back to chats"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 lg:hidden"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="relative shrink-0">
          <Avatar name={partner.name} size="md" />
          {partner.active && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{partner.name}</p>
          <p className="text-xs text-slate-500">{ROLE_LABEL[partner.role] ?? partner.role}</p>
        </div>
        {partner.phone && (
          <a
            href={`tel:${partner.phone}`}
            aria-label={`Call ${partner.name}`}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition hover:bg-brand-navy hover:text-white"
          >
            <Phone size={17} />
          </a>
        )}
      </div>

      <ChatWindow
        partner={partner}
        myStaffId={me}
        myRole={myRole}
        initial={messages}
        taskIndex={taskIndex}
        taskOptions={options}
        defaultTaskId={defaultTaskId}
      />
    </div>
  );
}
