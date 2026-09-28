import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveProofFile } from "@/lib/storage/upload";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "File too large (20 MB max)" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await saveProofFile({ name: file.name, buffer });

  return NextResponse.json({
    url: uploaded.url,
    name: file.name,
    type: file.type || "application/octet-stream",
  });
}
