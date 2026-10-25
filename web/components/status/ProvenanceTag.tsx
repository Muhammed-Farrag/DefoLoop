import type { Provenance } from "@/lib/api/types";

const LABELS: Record<Provenance, string> = {
  model: "Model output · provisional",
  illustrative: "Illustrative · not DefoLoop output",
  benchmark: "Benchmark mask",
  human: "Human verified",
};

const STYLES: Record<Provenance, string> = {
  model: "border-[var(--warn)]/30 text-[var(--warn)]",
  illustrative: "border-dashed border-border-strong text-muted",
  benchmark: "border-border-strong text-muted",
  human: "border-[var(--ok)]/30 text-[var(--ok)]",
};

export function ProvenanceTag({ provenance, title }: { provenance: Provenance; title?: string }) {
  return (
    <span
      title={title}
      className={`inline-flex h-5 items-center rounded border px-1.5 text-[10.5px] whitespace-nowrap ${STYLES[provenance]}`}
    >
      {LABELS[provenance]}
    </span>
  );
}
