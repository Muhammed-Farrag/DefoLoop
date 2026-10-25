"use client";

import { Check, CircleSlash, PenLine } from "lucide-react";
import { Button, Kbd } from "@/components/ui/Button";

export function ReviewActions({
  canApprove,
  busy,
  onApprove,
  onCorrect,
  onMarkNormal,
}: {
  canApprove: boolean;
  busy: boolean;
  onApprove: () => void;
  onCorrect: () => void;
  onMarkNormal: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button onClick={onMarkNormal} disabled={busy} title="Mark as normal (N)">
        <CircleSlash size={14} strokeWidth={1.75} />
        Mark normal <Kbd>N</Kbd>
      </Button>
      <Button onClick={onCorrect} disabled={busy} title="Correct mask (C)">
        <PenLine size={14} strokeWidth={1.75} />
        Correct mask <Kbd>C</Kbd>
      </Button>
      <Button
        variant="primary"
        onClick={onApprove}
        disabled={busy || !canApprove}
        title={canApprove ? "Approve prediction (A)" : "No model prediction to approve"}
      >
        <Check size={14} strokeWidth={2} />
        Approve <kbd className="rounded bg-white/15 px-1 font-mono text-[10px]">A</kbd>
      </Button>
    </div>
  );
}
