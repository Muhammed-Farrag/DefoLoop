"use client";

import { Maximize, ZoomIn, ZoomOut } from "lucide-react";
import { IconButton } from "@/components/ui/Button";
import { TURBO_GRADIENT } from "@/lib/render/colormap";

export type VisMode = "overlay" | "outline" | "raw";

const MODES: { id: VisMode; label: string }[] = [
  { id: "overlay", label: "Overlay" },
  { id: "outline", label: "Outline" },
  { id: "raw", label: "Raw" },
];

export function VisualizationControls({
  mode,
  onMode,
  opacity,
  onOpacity,
  threshold,
  onThreshold,
  thresholdEnabled,
  zoom,
  onZoomIn,
  onZoomOut,
  onFit,
}: {
  mode: VisMode;
  onMode: (m: VisMode) => void;
  opacity: number;
  onOpacity: (v: number) => void;
  threshold: number;
  onThreshold: (v: number) => void;
  thresholdEnabled: boolean;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}) {
  return (
    <div className="flex h-11 shrink-0 flex-wrap items-center gap-x-5 gap-y-1 rounded-lg border border-border bg-surface px-2">
      <div className="flex rounded-md bg-surface-2 p-0.5" role="radiogroup" aria-label="Visualization">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="radio"
            aria-checked={mode === m.id}
            onClick={() => onMode(m.id)}
            title={`${m.label} (V cycles)`}
            className={`h-7 rounded px-2.5 text-[12px] ${
              mode === m.id ? "bg-surface font-medium text-text shadow-sm" : "text-muted hover:text-text"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-[12px] text-muted">
        Opacity
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(e) => onOpacity(Number(e.target.value))}
          className="w-24"
        />
      </label>

      <label
        className={`flex items-center gap-2 text-[12px] text-muted ${thresholdEnabled ? "" : "opacity-40"}`}
        title={thresholdEnabled ? "Anomaly threshold" : "No anomaly map to threshold"}
      >
        Threshold
        <span className="relative flex items-center">
          <span className="pointer-events-none absolute inset-x-0 h-1 rounded-full" style={{ background: TURBO_GRADIENT }} />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={threshold}
            disabled={!thresholdEnabled}
            onChange={(e) => onThreshold(Number(e.target.value))}
            className="relative w-32 appearance-none bg-transparent [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-text [&::-webkit-slider-thumb]:shadow"
          />
        </span>
        <span className="w-8 font-mono text-[11px] text-text tabular-nums">{threshold.toFixed(2)}</span>
      </label>

      <div className="ml-auto flex items-center gap-0.5">
        <IconButton label="Zoom out (−)" onClick={onZoomOut}>
          <ZoomOut size={16} strokeWidth={1.75} />
        </IconButton>
        <span className="w-11 text-center font-mono text-[11px] text-muted tabular-nums">{Math.round(zoom * 100)}%</span>
        <IconButton label="Zoom in (+)" onClick={onZoomIn}>
          <ZoomIn size={16} strokeWidth={1.75} />
        </IconButton>
        <IconButton label="Fit to screen (0)" onClick={onFit}>
          <Maximize size={15} strokeWidth={1.75} />
        </IconButton>
      </div>
    </div>
  );
}
