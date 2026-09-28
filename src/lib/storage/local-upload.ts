import { mkdir, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

/**
 * Stores an uploaded file on local disk under public/uploads/<category>/ and
 * returns a URL served directly by Next.js. This is a stopgap for local dev
 * and persistent VPS/container hosts. It will NOT persist on serverless hosts
 * (e.g. Vercel) with an ephemeral filesystem, use Vercel Blob there.
 */
export async function saveProofFileLocally(
  file: { name: string; buffer: Buffer },
  category = "proofs"
): Promise<{ url: string }> {
  const dir = path.join(UPLOAD_ROOT, category);
  await mkdir(dir, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}-${safeName}`;
  await writeFile(path.join(dir, filename), file.buffer);

  return { url: `/uploads/${category}/${filename}` };
}
