import { NextRequest, NextResponse, after } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { listMessagesAfter, sendMessage } from "@/lib/data/messages";
import { getStaff } from "@/lib/data/staff";
import { notifyManyStaff } from "@/lib/push/send";
import { saveChatFileToTask, type SavedToTask } from "@/lib/chat-task-files";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const withId = req.nextUrl.searchParams.get("with");
  const after_ = req.nextUrl.searchParams.get("after") ?? "";
  if (!withId) return NextResponse.json({ messages: [] });

  const messages = await listMessagesAfter(session.user.id, withId, after_);
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { toStaffId, message, attachment, taskId } = await req.json();
  const trimmed = String(message ?? "").trim();
  if (!toStaffId || (!trimmed && !attachment?.url)) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
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
      return NextResponse.json({ error: err instanceof Error ? err.message : "Could not save to task" }, { status: 400 });
    }
  }

  const msg = await sendMessage(session.user.id, toStaffId, trimmed, attachment, saved?.taskId);

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
      title: `Message from ${sender?.name ?? "Someone"}`,
      body: bodyText.length > 80 ? bodyText.slice(0, 80) + "…" : bodyText,
      url: `/chat/${senderId}`,
    });
  });

  return NextResponse.json({ message: msg, saved });
}
