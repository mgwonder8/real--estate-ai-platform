import { mkdir, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "proofs");

/**
 * Stores an uploaded proof file on local disk under public/uploads/proofs and
 * returns a URL served directly by Next.js. This is a stopgap for local/VPS
 * deployment: it will NOT persist on serverless hosts (e.g. Vercel) with an
 * ephemeral filesystem, swap for S3/Cloudinary/GCS before deploying there.
 */
export async function saveProofFileLocally(file: {
  name: string;
  buffer: Buffer;
}): Promise<{ url: string }> {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}-${safeName}`;
  await writeFile(path.join(UPLOAD_DIR, filename), file.buffer);

  return { url: `/uploads/proofs/${filename}` };
}
