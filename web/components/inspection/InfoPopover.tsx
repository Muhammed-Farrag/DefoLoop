"use client";

import * as Popover from "@radix-ui/react-popover";
import { Info } from "lucide-react";
import type { Inspection } from "@/lib/api/types";
import { getDataSource } from "@/lib/api";

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted">{k}</dt>
      <dd className="truncate font-mono text-[11px]" title={typeof v === "string" ? v : undefined}>
        {v ?? "—"}
      </dd>
    </>
  );
}

/** Technical details, hidden until asked for. */
export function InfoPopover({ inspection, open, onOpenChange }: { inspection: Inspection; open: boolean; onOpenChange: (o: boolean) => void }) {
  const p = inspection.prediction;
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger
        className="rounded-md p-1.5 text-faint hover:bg-surface-2 hover:text-text"
        aria-label="Inspection details (I)"
        title="Details (I)"
      >
        <Info size={16} strokeWidth={1.75} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-40 w-80 rounded-lg border border-border bg-surface p-3 text-[12px] shadow-md"
        >
          <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5">
            <Row k="Image" v={`${inspection.image.filename}`} />
            <Row k="Resolution" v={`${inspection.image.width} × ${inspection.image.height}`} />
            <Row k="Source" v={inspection.sample ? `${inspection.sample.dataset} (${inspection.sample.license})` : "Upload"} />
            <Row k="Model version" v={p?.model_version ?? "none"} />
            <Row k="Output type" v={p ? (p.provenance === "model" ? "DefoLoop inference" : "Illustrative, precomputed") : "—"} />
            <Row k="Image score" v={p?.image_score?.toFixed(3)} />
            <Row k="Decision" v={p?.image_decision} />
            <Row k="Threshold" v={p?.threshold?.toFixed(2)} />
            <Row k="Inference" v={p?.inference_ms != null ? `${p.inference_ms} ms` : null} />
            <Row k="Created" v={new Date(inspection.created_at).toLocaleString()} />
            <Row k="Data source" v={getDataSource().kind === "local" ? "Local demo store" : "DefoLoop API"} />
          </dl>
          {inspection.sample?.note && <p className="mt-2 text-muted">{inspection.sample.note}</p>}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
