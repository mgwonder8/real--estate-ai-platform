import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { countUnread } from "@/lib/data/messages";

export default async function SignedInLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const unread = await countUnread(session.user.id).catch(() => ({ team: 0, personal: 0 }));

  return (
    <AppShell role={session.user.role} name={session.user.name} unreadChats={unread.team} unreadPersonal={unread.personal}>
      {children}
    </AppShell>
  );
}
