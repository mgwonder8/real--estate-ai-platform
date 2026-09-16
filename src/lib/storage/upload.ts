import { put } from "@vercel/blob";
import { saveProofFileLocally } from "@/lib/storage/local-upload";

/**
 * Saves an uploaded proof file and returns a publicly reachable URL.
 * Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is configured (required on
 * Vercel, since its filesystem is ephemeral); otherwise falls back to local
 * disk, which is fine for local dev or a persistent VPS/container host.
 */
export async function saveProofFile(file: { name: string; buffer: Buffer }): Promise<{ url: string }> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const blob = await put(`proofs/${Date.now()}-${safeName}`, file.buffer, {
      access: "public",
      addRandomSuffix: true,
    });
    return { url: blob.url };
  }

  return saveProofFileLocally(file);
}
