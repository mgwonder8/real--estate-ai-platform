import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { savePushSubscription } from "@/lib/data/push-subscriptions";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const authKey = body?.keys?.auth;

  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await savePushSubscription({
    staffId: session.user.id,
    endpoint,
    p256dh,
    auth: authKey,
  });

  return NextResponse.json({ ok: true });
}
