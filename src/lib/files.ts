const IMAGE_EXT = ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif", "avif", "bmp"];
const DOC_EXT = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "zip"];

/** Best-effort filename for a stored file URL (our /api/media URLs carry it in `n`). */
export function fileNameFromUrl(url: string): string {
  try {
    const u = new URL(url, "http://local");
    const n = u.searchParams.get("n");
    if (n) return n;
    return decodeURIComponent(u.pathname.split("/").pop() ?? "");
  } catch {
    return "";
  }
}

function ext(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

export function isImageFile(name: string, mime = ""): boolean {
  if (mime) return mime.startsWith("image/");
  return IMAGE_EXT.includes(ext(name));
}

/** Proof photos from the camera may have no extension; only rule out known document types. */
export function isProbablyImageUrl(url: string): boolean {
  return !DOC_EXT.includes(ext(fileNameFromUrl(url)));
}

export function isPdfFile(name: string, mime = ""): boolean {
  return mime === "application/pdf" || ext(name) === "pdf";
}
