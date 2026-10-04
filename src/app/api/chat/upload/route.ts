import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveUploadedFile } from "@/lib/storage/upload";
import { getT } from "@/lib/i18n/server";

export async function POST(req: NextRequest) {
  const t = await getT();
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: t("common.notAuthenticated") }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return NextResponse.json({ error: t("cw.noFile") }, { status: 400 });
  if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: t("cw.tooLarge") }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await saveUploadedFile({ name: file.name, buffer }, "chat");

  return NextResponse.json({
    url: uploaded.url,
    name: file.name,
    type: file.type || "application/octet-stream",
  });
}
