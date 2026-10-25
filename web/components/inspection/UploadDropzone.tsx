"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { ACCEPTED_TYPES, MAX_UPLOAD_BYTES } from "@/lib/image";

export function UploadDropzone({ onFile, busy }: { onFile: (f: File) => void; busy: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = (f: File | undefined) => {
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) return setError("Use a PNG or JPEG image.");
    if (f.size > MAX_UPLOAD_BYTES) return setError("Image is larger than 50 MB.");
    setError(null);
    onFile(f);
  };

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          accept(e.dataTransfer.files[0]);
        }}
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-16 transition-colors ${
          over ? "border-accent bg-accent-soft" : "border-border-strong bg-surface hover:bg-surface-2/60"
        }`}
      >
        <Upload size={22} strokeWidth={1.5} className="text-muted" />
        <span className="text-[14px] font-medium">{busy ? "Uploading…" : "Drop a product image or click to upload"}</span>
        <span className="text-[12px] text-muted">PNG or JPEG · original resolution is preserved</span>
      </button>
      <input
        ref={input}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          accept(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {error && <p className="mt-2 text-[12px] text-pred">{error}</p>}
    </div>
  );
}
