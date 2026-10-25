"use client";

import { FlaskConical, ImageIcon } from "lucide-react";
import { useData } from "@/lib/hooks/useData";
import { MetricComparison } from "@/components/learning/MetricComparison";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export default function LearningImpactPage() {
  const { data: evaluation, loading } = useData((ds) => ds.getLatestEvaluation());
  const { data: inspections } = useData((ds) => ds.listInspections());
  const verified = inspections?.filter((i) => ["approved", "human_verified", "marked_normal"].includes(i.status)).length;

  return (
    <>
      <PageHeader title="Learning Impact" />
      <div className="mx-auto w-full max-w-4xl space-y-6 px-6 py-6">
        <p className="text-[13px] text-muted">
          Does verified human feedback improve the model? The baseline (v0) and the feedback-adapted model (v1) are scored on
          the same sealed holdout set, which never contains feedback images.
        </p>

        {!loading && !evaluation && (
          <div className="rounded-lg border border-border bg-surface">
            <EmptyState icon={FlaskConical} title="No evaluation run yet">
              Results appear here only after the backend trains an adapted model on verified feedback and evaluates both
              versions on the holdout split. Nothing is estimated in the meantime.
              {verified !== undefined && (
                <p className="mt-3 text-text">
                  {verified} verified annotation{verified === 1 ? "" : "s"} collected in this data source.
                </p>
              )}
            </EmptyState>
          </div>
        )}

        {evaluation && (
          <>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border border-border bg-surface px-4 py-3 text-[12px]">
              <span>
                <span className="text-muted">Holdout split </span>
                <span className="font-mono">{evaluation.split.id}</span>
              </span>
              <span className="font-mono text-muted" title="Split manifest SHA-256">
                {evaluation.split.manifest_sha256.slice(0, 12)}…
              </span>
              <span className="text-muted">
                {evaluation.split.n_images} images ({evaluation.split.n_defective} defective, {evaluation.split.n_normal} normal)
              </span>
              <span className="ml-auto text-muted">{new Date(evaluation.created_at).toLocaleDateString()}</span>
            </div>

            <div className="rounded-lg border border-border bg-surface">
              <div className="grid grid-cols-[160px_1fr_1fr_110px] gap-6 border-b border-border px-4 py-2 text-[11.5px] text-muted">
                <span>Metric</span>
                <span className="font-mono">Baseline · {evaluation.baseline_version}</span>
                <span className="font-mono">Adapted · {evaluation.adapted_version}</span>
                <span className="text-right">Change</span>
              </div>
              {evaluation.metrics.map((m) => (
                <MetricComparison key={m.key} metric={m} />
              ))}
            </div>

            {evaluation.caveats.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-[12px] text-muted">
                {evaluation.caveats.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            )}

            {evaluation.images_uri && (
              <a href={evaluation.images_uri} target="_blank" rel="noreferrer">
                <Button>
                  <ImageIcon size={14} strokeWidth={1.75} /> Evaluation images
                </Button>
              </a>
            )}
          </>
        )}
      </div>
    </>
  );
}
