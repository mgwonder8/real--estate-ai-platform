import { put } from "@vercel/blob";
import { saveProofFileLocally } from "@/lib/storage/local-upload";

export type UploadCategory = "proof" | "chat" | "resource" | "brief";

/** Vercel injects env vars prefixed by the connection name — support both standard and prefixed names. */
export function blobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN;
}

export function blobStoreId(): string | undefined {
  return process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN_STORE_ID;
}

/**
 * Saves an uploaded file to persistent storage and returns a URL the app can
 * serve back to logged-in users. Uses Vercel Blob (private, proxied through
 * /api/media) when a Blob token is configured; falls back to local disk for
 * dev / VPS hosts.
 */
export async function saveUploadedFile(
  file: { name: string; buffer: Buffer },
  category: UploadCategory = "proof"
): Promise<{ url: string; name: string }> {
  const token = blobToken();
  const storeId = blobStoreId();

  if (token) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const blob = await put(`${category}/${Date.now()}-${safeName}`, file.buffer, {
      access: "private",
      addRandomSuffix: true,
      token,
      ...(storeId ? { storeId } : {}),
    });
    return {
      url: `/api/media?u=${encodeURIComponent(blob.url)}&n=${encodeURIComponent(file.name)}`,
      name: file.name,
    };
  }

  if (process.env.VERCEL) {
    console.error(
      "[storage] No Blob token found (checked BLOB_READ_WRITE_TOKEN and BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN). Uploads will be lost on Vercel."
    );
  }
  const result = await saveProofFileLocally(file, `${category}s`);
  return { url: result.url, name: file.name };
}

export async function saveProofFile(file: { name: string; buffer: Buffer }): Promise<{ url: string }> {
  const result = await saveUploadedFile(file, "proof");
  return { url: result.url };
}
