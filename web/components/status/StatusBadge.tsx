import type { ReviewStatus } from "@/lib/api/types";

const STATUS: Record<ReviewStatus, { label: string; className: string; dot: string }> = {
  not_assessed: { label: "Not assessed", className: "bg-[var(--neutral-soft)] text-muted", dot: "bg-faint" },
  model_only: { label: "Model only", className: "bg-[var(--warn-soft)] text-[var(--warn)]", dot: "bg-[var(--warn)]" },
  approved: { label: "Approved", className: "bg-[var(--info-soft)] text-[var(--info)]", dot: "bg-[var(--info)]" },
  human_verified: { label: "Human verified", className: "bg-[var(--ok-soft)] text-[var(--ok)]", dot: "bg-[var(--ok)]" },
  marked_normal: { label: "Marked normal", className: "bg-[var(--neutral-soft)] text-text", dot: "bg-text" },
};

export const isPending = (s: ReviewStatus) => s === "not_assessed" || s === "model_only";

export function StatusBadge({ status }: { status: ReviewStatus }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-[11px] font-medium whitespace-nowrap ${s.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
      {s.label}
    </span>
  );
}
