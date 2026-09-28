import { put } from "@vercel/blob";
import { saveProofFileLocally } from "@/lib/storage/local-upload";

export type UploadCategory = "proof" | "chat" | "resource" | "brief";

/**
 * Saves an uploaded file to a persistent backend and returns a URL the app can
 * serve back to logged-in users. Uses Vercel Blob (private access, files of
 * real client sites shouldn't be world-readable) when BLOB_READ_WRITE_TOKEN is
 * configured, proxied through /api/media since private blobs need our server's
 * token to read; otherwise falls back to local disk (dev / VPS only).
 */
export async function saveUploadedFile(
  file: { name: string; buffer: Buffer },
  category: UploadCategory = "proof"
): Promise<{ url: string; name: string }> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const blob = await put(`${category}/${Date.now()}-${safeName}`, file.buffer, {
      access: "private",
      addRandomSuffix: true,
    });
    return {
      url: `/api/media?u=${encodeURIComponent(blob.url)}&n=${encodeURIComponent(file.name)}`,
      name: file.name,
    };
  }

  // Warn loudly on serverless hosts — local disk won't persist between invocations.
  if (process.env.VERCEL) {
    console.error(
      "[storage] BLOB_READ_WRITE_TOKEN is not set on Vercel. Uploaded files will be lost. Configure Vercel Blob."
    );
  }
  const result = await saveProofFileLocally(file, `${category}s`);
  return { url: result.url, name: file.name };
}

/** Back-compat wrapper used by existing proof/task upload paths. */
export async function saveProofFile(file: { name: string; buffer: Buffer }): Promise<{ url: string }> {
  const result = await saveUploadedFile(file, "proof");
  return { url: result.url };
}
