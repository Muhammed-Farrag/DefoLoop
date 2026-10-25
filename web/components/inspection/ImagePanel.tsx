"use client";

import type { ReactNode } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import type { Provenance } from "@/lib/api/types";
import { ProvenanceTag } from "@/components/status/ProvenanceTag";

export function ImagePanel({
  title,
  provenance,
  provenanceTitle,
  footer,
  empty,
  focused,
  onToggleFocus,
  shortcut,
  actions,
  children,
}: {
  /** Small controls placed in the header. */
  actions?: ReactNode;
  title: string;
  provenance?: Provenance | null;
  provenanceTitle?: string;
  footer?: ReactNode;
  /** When set, replaces the image area with an explanatory empty state. */
  empty?: { title: string; detail?: string } | null;
  focused?: boolean;
  onToggleFocus?: () => void;
  shortcut?: string;
  children?: ReactNode;
}) {
  return (
    <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <header className="flex h-9 shrink-0 items-center gap-2 border-b border-border px-3">
        <h2 className="text-[12.5px] font-medium">{title}</h2>
        {provenance && <ProvenanceTag provenance={provenance} title={provenanceTitle} />}
        <span className="ml-auto" />
        {actions}
        {onToggleFocus && (
          <button
            onClick={onToggleFocus}
            className="rounded p-1 text-faint hover:bg-surface-2 hover:text-text"
            title={`${focused ? "Back to grid" : "Enlarge"}${shortcut ? ` (${shortcut})` : ""}`}
            aria-label={focused ? `Back to grid` : `Enlarge ${title}`}
          >
            {focused ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        )}
      </header>
      <div className="relative min-h-0 flex-1 bg-canvas" onDoubleClick={onToggleFocus}>
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-4 text-center">
            <p className="text-[13px] font-medium text-muted">{empty.title}</p>
            {empty.detail && <p className="max-w-[260px] text-[12px] text-faint">{empty.detail}</p>}
          </div>
        ) : (
          children
        )}
      </div>
      {footer && !empty && (
        <footer className="flex h-8 shrink-0 items-center gap-3 border-t border-border px-3 text-[11.5px] text-muted">
          {footer}
        </footer>
      )}
    </section>
  );
}
