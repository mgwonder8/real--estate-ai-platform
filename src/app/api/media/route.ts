import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const blobUrl = req.nextUrl.searchParams.get("u");
  const originalName = req.nextUrl.searchParams.get("n") ?? "";
  const disposition = req.nextUrl.searchParams.get("d"); // "attachment" to force download

  if (!blobUrl || !blobUrl.includes(".blob.vercel-storage.com")) {
    return NextResponse.json({ error: "Invalid media reference" }, { status: 400 });
  }

  try {
    const result = await get(blobUrl, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const contentType = result.blob.contentType || "application/octet-stream";
    const safeName = (originalName || result.blob.pathname.split("/").pop() || "file").replace(/"/g, "");
    const contentDisposition =
      disposition === "attachment"
        ? `attachment; filename="${safeName}"`
        : `inline; filename="${safeName}"`;

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[/api/media] failed to fetch blob", err);
    return NextResponse.json({ error: "Could not load media" }, { status: 500 });
  }
}
