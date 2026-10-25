"use client";

import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, Tag } from "lucide-react";
import { DEFECT_CLASSES, type DefectClass, type ReviewType } from "@/lib/api/types";

export const REVIEW_TYPES: { id: ReviewType; label: string }[] = [
  { id: "wrong_region", label: "Wrong region" },
  { id: "missed_defect", label: "Missed defect" },
  { id: "false_alarm", label: "False alarm" },
  { id: "wrong_label", label: "Wrong label" },
];

export interface ReviewDetails {
  defectClass: DefectClass;
  reviewType: ReviewType | "auto";
  note: string;
}

const field = "h-8 w-full rounded-md border border-border bg-surface px-2 text-[13px]";

/** Classification and notes stay secondary: a compact popover beside Save. */
export function ReviewDetailsPopover({
  value,
  onChange,
  autoLabel,
}: {
  value: ReviewDetails;
  onChange: (v: ReviewDetails) => void;
  autoLabel: string;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-[12.5px] text-muted hover:bg-surface-2 hover:text-text">
        <Tag size={13} strokeWidth={1.75} />
        <span className="max-w-32 truncate text-text">{value.defectClass}</span>
        <ChevronDown size={13} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={6} className="z-40 w-72 space-y-3 rounded-lg border border-border bg-surface p-3 text-[12px] shadow-md">
          <label className="block space-y-1">
            <span className="text-muted">Defect class</span>
            <select
              className={field}
              value={value.defectClass}
              onChange={(e) => onChange({ ...value, defectClass: e.target.value as DefectClass })}
            >
              {DEFECT_CLASSES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-muted">What was wrong</span>
            <select
              className={field}
              value={value.reviewType}
              onChange={(e) => onChange({ ...value, reviewType: e.target.value as ReviewDetails["reviewType"] })}
            >
              <option value="auto">Auto: {autoLabel}</option>
              {REVIEW_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-muted">Note</span>
            <textarea
              rows={2}
              className={`${field} h-auto py-1.5`}
              value={value.note}
              onChange={(e) => onChange({ ...value, note: e.target.value })}
              placeholder="Optional"
            />
          </label>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
