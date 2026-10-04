import { NextRequest, NextResponse, after } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { listMessagesAfter, parseChannel, sendMessage } from "@/lib/data/messages";
import { getStaff } from "@/lib/data/staff";
import { notifyManyStaff } from "@/lib/push/send";
import { saveChatFileToTask, type SavedToTask } from "@/lib/chat-task-files";
import { getT } from "@/lib/i18n/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const withId = req.nextUrl.searchParams.get("with");
  const after_ = req.nextUrl.searchParams.get("after") ?? "";
  const channel = parseChannel(req.nextUrl.searchParams.get("channel"));
  if (!withId) return NextResponse.json({ messages: [] });

  const messages = await listMessagesAfter(session.user.id, withId, after_, channel);
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  const t = await getT();
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: t("common.notAuthenticated") }, { status: 401 });

  const body = await req.json();
  const { toStaffId, message, attachment } = body;
  const channel = parseChannel(body.channel);
  // Private chat never feeds site tasks.
  const taskId = channel === "team" ? body.taskId : undefined;
  const trimmed = String(message ?? "").trim();
  if (!toStaffId || (!trimmed && !attachment?.url)) {
    return NextResponse.json({ error: t("cw.missingFields") }, { status: 400 });
  }

  let saved: SavedToTask | null = null;
  if (taskId && attachment?.url) {
    try {
      saved = await saveChatFileToTask({
        taskId,
        senderId: session.user.id,
        senderRole: session.user.role,
        attachment,
      });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : t("cw.couldNotSave") }, { status: 400 });
    }
  }

  let msg;
  try {
    msg = await sendMessage(session.user.id, toStaffId, trimmed, attachment, saved?.taskId, channel);
  } catch {
    return NextResponse.json({ error: channel === "personal" ? t("cw.privateNotReady") : t("cw.notSent") }, { status: 500 });
  }

  if (saved) {
    revalidatePath("/tasks", "layout");
    revalidatePath("/site");
    revalidatePath("/dashboard");
  }

  const senderId = session.user.id;
  after(async () => {
    const sender = await getStaff(senderId);
    const bodyText = trimmed || (attachment?.name ? `Sent a file: ${attachment.name}` : "New message");
    await notifyManyStaff([toStaffId], {
      title: `${channel === "personal" ? "Private message" : "Message"} from ${sender?.name ?? "Someone"}`,
      body: bodyText.length > 80 ? bodyText.slice(0, 80) + "…" : bodyText,
      url: channel === "personal" ? `/personal/${senderId}?view=chat` : `/chat/${senderId}`,
    });
  });

  return NextResponse.json({ message: msg, saved });
}
