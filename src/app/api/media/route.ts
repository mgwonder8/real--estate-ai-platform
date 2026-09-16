import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const blobUrl = req.nextUrl.searchParams.get("u");
  if (!blobUrl || !blobUrl.includes(".blob.vercel-storage.com")) {
    return NextResponse.json({ error: "Invalid media reference" }, { status: 400 });
  }

  const result = await get(blobUrl, { access: "private" });
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
