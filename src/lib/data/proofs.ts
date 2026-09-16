import { appendRow, readTable } from "@/lib/google/sheet-table";
import { newId } from "@/lib/ids";
import type { Proof } from "@/lib/data/types";

const TAB = "Proofs";

function toProof(data: Record<string, string>): Proof {
  return {
    id: data.id,
    taskId: data.task_id,
    submittedBy: data.submitted_by,
    photoUrl: data.photo_url,
    videoUrl: data.video_url,
    gpsLat: data.gps_lat,
    gpsLng: data.gps_lng,
    notes: data.notes,
    submittedAt: data.submitted_at,
  };
}

export async function listAllProofs(): Promise<Proof[]> {
  const { rows } = await readTable(TAB);
  return rows.map((r) => toProof(r.data)).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
}

export async function listProofsForTask(taskId: string): Promise<Proof[]> {
  const all = await listAllProofs();
  return all.filter((p) => p.taskId === taskId);
}

export async function addProof(input: {
  taskId: string;
  submittedBy: string;
  photoUrl?: string;
  videoUrl?: string;
  gpsLat?: string;
  gpsLng?: string;
  notes?: string;
}): Promise<Proof> {
  const proof: Proof = {
    id: newId("proof"),
    taskId: input.taskId,
    submittedBy: input.submittedBy,
    photoUrl: input.photoUrl ?? "",
    videoUrl: input.videoUrl ?? "",
    gpsLat: input.gpsLat ?? "",
    gpsLng: input.gpsLng ?? "",
    notes: input.notes ?? "",
    submittedAt: new Date().toISOString(),
  };
  await appendRow(TAB, {
    id: proof.id,
    task_id: proof.taskId,
    submitted_by: proof.submittedBy,
    photo_url: proof.photoUrl,
    video_url: proof.videoUrl,
    gps_lat: proof.gpsLat,
    gps_lng: proof.gpsLng,
    notes: proof.notes,
    submitted_at: proof.submittedAt,
  });
  return proof;
}
