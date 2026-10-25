"use client";

import { Brush, Eraser, Eye, EyeOff, Hand, Maximize, Pentagon, Redo2, Save, Trash2, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import type { ReactNode } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import type { Tool } from "./MaskCanvas";

const TOOLS: { id: Tool; label: string; key: string; icon: typeof Brush }[] = [
  { id: "brush", label: "Brush", key: "B", icon: Brush },
  { id: "eraser", label: "Eraser", key: "E", icon: Eraser },
  { id: "polygon", label: "Polygon", key: "P", icon: Pentagon },
  { id: "pan", label: "Pan", key: "H or hold Space", icon: Hand },
];

const Divider = () => <span className="mx-1 h-5 w-px bg-border" aria-hidden />;

export function MaskToolbar({
  tool,
  onTool,
  size,
  onSize,
  maxSize,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onZoomIn,
  onZoomOut,
  onFit,
  showReference,
  onToggleReference,
  hasReference,
  onSave,
  saving,
  details,
}: {
  tool: Tool;
  onTool: (t: Tool) => void;
  size: number;
  onSize: (n: number) => void;
  maxSize: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  showReference: boolean;
  onToggleReference: () => void;
  hasReference: boolean;
  onSave: () => void;
  saving: boolean;
  details: ReactNode;
}) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-0.5 rounded-lg border border-border bg-surface px-1.5" role="toolbar" aria-label="Mask tools">
      {TOOLS.map((t) => (
        <IconButton key={t.id} label={`${t.label} (${t.key})`} active={tool === t.id} onClick={() => onTool(t.id)}>
          <t.icon size={16} strokeWidth={1.75} />
        </IconButton>
      ))}
      <Divider />
      <label className="flex items-center gap-2 px-1 text-[12px] text-muted" title="Brush size ([ and ])">
        Size
        <input
          type="range"
          min={1}
          max={maxSize}
          value={size}
          onChange={(e) => onSize(Number(e.target.value))}
          className="w-24"
          disabled={tool === "polygon" || tool === "pan"}
        />
        <span className="w-9 font-mono text-[11px] text-text tabular-nums">{size}px</span>
      </label>
      <Divider />
      <IconButton label="Undo (⌘Z)" onClick={onUndo} disabled={!canUndo}>
        <Undo2 size={16} strokeWidth={1.75} />
      </IconButton>
      <IconButton label="Redo (⇧⌘Z)" onClick={onRedo} disabled={!canRedo}>
        <Redo2 size={16} strokeWidth={1.75} />
      </IconButton>
      <IconButton label="Clear mask" onClick={onClear}>
        <Trash2 size={15} strokeWidth={1.75} />
      </IconButton>
      <Divider />
      <IconButton label="Zoom out (−)" onClick={onZoomOut}>
        <ZoomOut size={16} strokeWidth={1.75} />
      </IconButton>
      <IconButton label="Zoom in (+)" onClick={onZoomIn}>
        <ZoomIn size={16} strokeWidth={1.75} />
      </IconButton>
      <IconButton label="Fit to screen (0)" onClick={onFit}>
        <Maximize size={15} strokeWidth={1.75} />
      </IconButton>
      {hasReference && (
        <IconButton
          label={showReference ? "Hide model prediction (R)" : "Show model prediction (R)"}
          active={showReference}
          onClick={onToggleReference}
        >
          {showReference ? <Eye size={16} strokeWidth={1.75} /> : <EyeOff size={16} strokeWidth={1.75} />}
        </IconButton>
      )}
      <div className="ml-auto flex items-center gap-2">
        {details}
        <Button variant="primary" onClick={onSave} disabled={saving} title="Save correction (⌘S)">
          <Save size={14} strokeWidth={1.75} />
          {saving ? "Saving…" : "Save correction"}
        </Button>
      </div>
    </div>
  );
}
