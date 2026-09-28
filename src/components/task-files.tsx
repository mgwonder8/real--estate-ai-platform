import { FileText, MapPin, Paperclip } from "lucide-react";
import { PhotoGrid, type Photo } from "@/components/photo-grid";
import { fileNameFromUrl, isImageFile, isPdfFile, isProbablyImageUrl } from "@/lib/files";
import { timeAgo } from "@/lib/task-meta";

export type RefFile = { url: string; name: string; type: string; by: string; at: string; viaChat?: boolean };
export type ProofFile = { photoUrl: string; videoUrl: string; by: string; at: string; notes: string; lat: string; lng: string };

/** Reference files from the office and proof from the site, shown the same way to everyone. */
export function TaskFiles({
  references,
  proofs,
  compact = false,
  referenceTitle = "Reference files",
  proofTitle = "Proof of work",
}: {
  references: RefFile[];
  proofs: ProofFile[];
  compact?: boolean;
  referenceTitle?: string;
  proofTitle?: string;
}) {
  const refPhotos: Photo[] = [];
  const refDocs: RefFile[] = [];
  for (const r of references) {
    if (isImageFile(r.name, r.type)) {
      refPhotos.push({ url: r.url, kind: "image", caption: r.by, sub: `${r.viaChat ? "Sent in chat, " : ""}${timeAgo(r.at)}` });
    } else if (r.type.startsWith("video/")) {
      refPhotos.push({ url: r.url, kind: "video", caption: r.by, sub: timeAgo(r.at) });
    } else {
      refDocs.push(r);
    }
  }

  const proofPhotos: Photo[] = [];
  const proofDocs: RefFile[] = [];
  const located = proofs.filter((p) => p.lat && p.lng);
  for (const p of proofs) {
    const sub = `${p.notes === "Sent in chat" ? "Sent in chat, " : ""}${timeAgo(p.at)}`;
    if (p.videoUrl) proofPhotos.push({ url: p.videoUrl, kind: "video", caption: p.by, sub });
    if (p.photoUrl) {
      if (isProbablyImageUrl(p.photoUrl)) proofPhotos.push({ url: p.photoUrl, kind: "image", caption: p.by, sub });
      else proofDocs.push({ url: p.photoUrl, name: fileNameFromUrl(p.photoUrl) || "Proof file", type: "", by: p.by, at: p.at });
    }
  }

  const hasRefs = refPhotos.length + refDocs.length > 0;
  const hasProofs = proofPhotos.length + proofDocs.length > 0;
  if (!hasRefs && !hasProofs) return null;

  const heading = "mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500";

  return (
    <div className="space-y-5">
      {hasRefs && (
        <section>
          <p className={heading}>
            <span>{referenceTitle}</span>
            <span className="font-medium normal-case tracking-normal text-slate-400">{refPhotos.length + refDocs.length}</span>
          </p>
          {refPhotos.length > 0 && <PhotoGrid photos={refPhotos} size={compact ? "sm" : "md"} />}
          {refDocs.length > 0 && (
            <div className={`space-y-2 ${refPhotos.length ? "mt-2" : ""}`}>
              {refDocs.map((d, i) => (
                <DocCard key={`${d.url}-${i}`} file={d} />
              ))}
            </div>
          )}
        </section>
      )}

      {hasProofs && (
        <section>
          <p className={heading}>
            <span>{proofTitle}</span>
            <span className="font-medium normal-case tracking-normal text-slate-400">{proofPhotos.length + proofDocs.length}</span>
          </p>
          {proofPhotos.length > 0 && <PhotoGrid photos={proofPhotos} size={compact ? "sm" : "md"} />}
          {proofDocs.length > 0 && (
            <div className={`space-y-2 ${proofPhotos.length ? "mt-2" : ""}`}>
              {proofDocs.map((d, i) => (
                <DocCard key={`${d.url}-${i}`} file={d} />
              ))}
            </div>
          )}
          {!compact && located.length > 0 && (
            <a
              href={`https://maps.google.com/?q=${located.at(-1)!.lat},${located.at(-1)!.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-navy hover:underline"
            >
              <MapPin size={12} /> Where the last proof was taken
            </a>
          )}
        </section>
      )}
    </div>
  );
}

function DocCard({ file }: { file: RefFile }) {
  const pdf = isPdfFile(file.name, file.type);
  return (
    <a
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-200 transition hover:bg-slate-100"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${pdf ? "bg-red-50 text-red-600" : "bg-white text-slate-500 ring-1 ring-slate-200"}`}>
        {pdf ? <FileText size={18} /> : <Paperclip size={18} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-slate-800">{file.name}</span>
        <span className="block truncate text-xs text-slate-500">
          {file.by}
          {file.viaChat ? ", sent in chat" : ""} · {timeAgo(file.at)}
        </span>
      </span>
    </a>
  );
}
