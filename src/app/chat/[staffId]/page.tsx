import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone } from "lucide-react";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { getStaff } from "@/lib/data/staff";
import { listMessagesBetween, markConversationRead } from "@/lib/data/messages";
import { ChatWindow } from "./chat-window";

export default async function ChatConversationPage({ params }: { params: Promise<{ staffId: string }> }) {
  const session = await auth();
  const { staffId } = await params;

  const [partner, messages] = await Promise.all([
    getStaff(staffId),
    listMessagesBetween(session!.user.id, staffId),
  ]);

  if (!partner) notFound();

  await markConversationRead(session!.user.id, staffId);

  return (
    <AppShell role={session!.user.role} name={session!.user.name}>
      <div className="flex h-[calc(100dvh-8rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm lg:h-[calc(100vh-6rem)]">
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3.5">
          <Link href="/chat" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 lg:hidden">
            <ArrowLeft size={18} />
          </Link>
          <div className="relative shrink-0">
            <Avatar name={partner.name} size="md" />
            {partner.active && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" title="Active" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{partner.name}</p>
            <p className="text-xs text-slate-500">
              {partner.role === "owner" ? "Owner" : partner.role === "office_staff" ? "Office" : "Site staff"}
            </p>
          </div>
          {partner.phone && (
            <a
              href={`tel:${partner.phone}`}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-brand-navy hover:text-white"
              title={`Call ${partner.phone}`}
            >
              <Phone size={17} />
            </a>
          )}
        </div>

        <ChatWindow partner={partner} myStaffId={session!.user.id} initial={messages} />
      </div>
    </AppShell>
  );
}
