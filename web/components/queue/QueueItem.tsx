import Link from "next/link";
import type { Inspection } from "@/lib/api/types";
import { StatusBadge } from "@/components/status/StatusBadge";
import { Thumbnail } from "./Thumbnail";

export function QueueItem({ inspection }: { inspection: Inspection }) {
  const label =
    inspection.label ?? (inspection.prediction ? (inspection.prediction.suggested_class ?? "unknown defect") : "no prediction");
  return (
    <Link
      href={`/inspect/${inspection.inspection_id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-border-strong"
    >
      <Thumbnail uri={inspection.image.uri} className="aspect-square w-full" />
      <div className="space-y-1.5 px-2.5 py-2">
        <p className="truncate font-mono text-[12px] font-medium">{inspection.inspection_id}</p>
        <div className="flex items-center justify-between gap-2">
          <StatusBadge status={inspection.status} />
          <span className="truncate text-[11.5px] text-muted" title={label}>
            {label}
          </span>
        </div>
      </div>
    </Link>
  );
}
