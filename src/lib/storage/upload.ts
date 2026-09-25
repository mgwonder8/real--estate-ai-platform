import { put } from "@vercel/blob";
import { saveProofFileLocally } from "@/lib/storage/local-upload";

/**
 * Saves an uploaded proof file and returns a URL the app can serve back to
 * logged-in users. Uses Vercel Blob (private access, proof photos of real
 * client sites shouldn't be world-readable) when BLOB_READ_WRITE_TOKEN is
 * configured, proxied through /api/media since private blobs need our
 * server's token to read; otherwise falls back to local disk for local dev
 * or a persistent VPS/container host.
 */
export async function saveProofFile(file: { name: string; buffer: Buffer }): Promise<{ url: string }> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const blob = await put(`proofs/${Date.now()}-${safeName}`, file.buffer, {
      access: "private",
      addRandomSuffix: true,
    });
    return { url: `/api/media?u=${encodeURIComponent(blob.url)}` };
  }

  return saveProofFileLocally(file);
}
