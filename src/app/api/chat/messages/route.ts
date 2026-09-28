import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { listMessagesAfter } from "@/lib/data/messages";
import { sendMessage } from "@/lib/data/messages";
import { getStaff } from "@/lib/data/staff";
import { notifyManyStaff } from "@/lib/push/send";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const withId = req.nextUrl.searchParams.get("with");
  const after = req.nextUrl.searchParams.get("after") ?? "";
  if (!withId) return NextResponse.json({ messages: [] });

  const messages = await listMessagesAfter(session.user.id, withId, after);
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { toStaffId, message } = await req.json();
  if (!toStaffId || !message?.trim()) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const msg = await sendMessage(session.user.id, toStaffId, message.trim());

  const sender = await getStaff(session.user.id);
  await notifyManyStaff([toStaffId], {
    title: `Message from ${sender?.name ?? "Someone"}`,
    body: message.length > 80 ? message.slice(0, 80) + "…" : message,
    url: `/chat/${session.user.id}`,
  });

  return NextResponse.json({ message: msg });
}
