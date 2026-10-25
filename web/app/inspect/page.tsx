"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDataSource } from "@/lib/api";
import { loadSamples, sampleUri, type SampleEntry } from "@/lib/samples";
import { useData } from "@/lib/hooks/useData";
import { PageHeader } from "@/components/ui/PageHeader";
import { UploadDropzone } from "@/components/inspection/UploadDropzone";
import { ProvenanceTag } from "@/components/status/ProvenanceTag";
import { useToast } from "@/components/ui/Toast";

export default function InspectPage() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const { data: samples } = useData(() => loadSamples());

  async function open(create: () => Promise<{ inspection_id: string }>) {
    setBusy(true);
    try {
      const ds = getDataSource();
      const inspection = await create();
      // Ask the model for output. The local demo store reports "unavailable".
      if (ds.kind === "http") await ds.predict(inspection.inspection_id);
      router.push(`/inspect/${inspection.inspection_id}`);
    } catch (e) {
      toast((e as Error).message, "error");
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="New inspection" />
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <UploadDropzone busy={busy} onFile={(f) => open(() => getDataSource().createFromUpload(f))} />

        {samples && samples.length > 0 && (
          <section className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-[13px] font-medium">Sample images</h2>
              <ProvenanceTag provenance="illustrative" />
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
              {samples.map((s: SampleEntry) => (
                <button
                  key={s.id}
                  disabled={busy}
                  onClick={() => open(() => getDataSource().createFromSample(s))}
                  className="group overflow-hidden rounded-lg border border-border bg-surface text-left hover:border-border-strong"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sampleUri(s.image)} alt="" className="aspect-square w-full bg-canvas object-cover" />
                  <div className="px-2 py-1.5">
                    <p className="truncate text-[12px] font-medium">{s.id}</p>
                    <p className="truncate text-[11px] text-muted">{s.dataset}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
