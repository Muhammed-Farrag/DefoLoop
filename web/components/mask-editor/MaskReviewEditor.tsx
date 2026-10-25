"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getDataSource } from "@/lib/api";
import { DEFECT_CLASSES, type DefectClass, type InspectionDetail, type ReviewType } from "@/lib/api/types";
import { useHotkeys } from "@/lib/hooks/useHotkeys";
import { useInspectionLayers } from "@/lib/hooks/useInspectionLayers";
import { useViewport, type View } from "@/lib/hooks/useViewport";
import { countOn, encodeMaskPng, type Raster } from "@/lib/mask/raster";
import { StatusBadge } from "@/components/status/StatusBadge";
import { ProvenanceTag } from "@/components/status/ProvenanceTag";
import { useToast } from "@/components/ui/Toast";
import { MaskCanvas, type HistoryState, type MaskCanvasHandle, type Tool } from "./MaskCanvas";
import { MaskToolbar } from "./MaskToolbar";
import { REVIEW_TYPES, ReviewDetailsPopover, type ReviewDetails } from "./ReviewDetailsPopover";

const EDIT_COLOR = "#2563eb";

export function MaskReviewEditor({
  detail,
  initialThreshold,
  initialView,
  onSaved,
}: {
  detail: InspectionDetail;
  initialThreshold: number | null;
  initialView: View | null;
  onSaved: () => void;
}) {
  const { inspection } = detail;
  const { width, height } = inspection.image;
  const prediction = inspection.prediction;
  const toast = useToast();
  const editor = useRef<MaskCanvasHandle>(null);

  const layers = useInspectionLayers(detail, initialThreshold ?? prediction?.threshold ?? 0.5);
  const { view, setView, fit, zoomBy } = useViewport(width, height, initialView);

  const [tool, setTool] = useState<Tool>("brush");
  const maxSize = Math.max(8, Math.round(Math.max(width, height) / 8));
  const [size, setSize] = useState(() => Math.max(2, Math.round(Math.max(width, height) / 60)));
  const [panHeld, setPanHeld] = useState(false);
  const [showReference, setShowReference] = useState(true);
  const [history, setHistory] = useState<HistoryState>({ canUndo: false, canRedo: false, dirty: false });
  const [saving, setSaving] = useState(false);
  const suggested = DEFECT_CLASSES.includes(prediction?.suggested_class as DefectClass)
    ? (prediction!.suggested_class as DefectClass)
    : "unknown";
  const lastClass = detail.reviews.findLast((r) => r.defect_class)?.defect_class;
  const [details, setDetails] = useState<ReviewDetails>({
    defectClass: lastClass ?? suggested,
    reviewType: "auto",
    note: "",
  });

  // Start from the latest verified revision, else the model's mask, else empty.
  // Captured once: reloading after a save must not reset the canvas.
  const [start, setStart] = useState<{ raster: Raster | null; from: string } | null>(null);
  if (!start && layers.ready) {
    setStart(
      layers.humanMask
        ? { raster: layers.humanMask, from: "latest verified revision" }
        : layers.segmentation
          ? { raster: layers.segmentation.raster, from: "model prediction" }
          : { raster: null, from: "empty mask" },
    );
  }

  const autoType = (pixels: number): ReviewType =>
    pixels === 0 ? (prediction ? "false_alarm" : "missed_defect") : prediction ? "wrong_region" : "missed_defect";
  const autoLabel = REVIEW_TYPES.find((t) => t.id === autoType(1))?.label ?? "";

  async function save() {
    if (!editor.current || saving) return;
    setSaving(true);
    try {
      const raster = editor.current.getRaster();
      const pixels = countOn(raster);
      await getDataSource().addReview(inspection.inspection_id, {
        review_type: details.reviewType === "auto" ? autoType(pixels) : details.reviewType,
        defect_class: pixels === 0 ? null : details.defectClass,
        note: details.note,
        mask: { png: await encodeMaskPng(raster), width, height, pixel_count: pixels },
      });
      editor.current.markSaved();
      toast(`Correction saved as human-verified annotation (revision ${detail.mask_revisions.length + 1})`);
      onSaved();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  useHotkeys({
    b: () => setTool("brush"),
    e: () => setTool("eraser"),
    p: () => setTool("polygon"),
    h: () => setTool("pan"),
    r: () => setShowReference((s) => !s),
    "[": () => setSize((s) => Math.max(1, Math.round(s / 1.25))),
    "]": () => setSize((s) => Math.min(maxSize, Math.round(s * 1.25) + 1)),
    "mod+z": () => editor.current?.undo(),
    "mod+shift+z": () => editor.current?.redo(),
    "mod+y": () => editor.current?.redo(),
    "mod+s": save,
    enter: (e) => editor.current?.closePolygon(e.altKey),
    escape: () => editor.current?.cancelPolygon(),
    "0": fit,
    "=": () => zoomBy(1.25),
    "+": () => zoomBy(1.25),
    "-": () => zoomBy(0.8),
    " ": (e) => !e.repeat && setPanHeld(true),
  });
  // Space is held to pan; release is handled here.
  useEffect(() => {
    const up = (e: KeyboardEvent) => e.key === " " && setPanHeld(false);
    window.addEventListener("keyup", up);
    return () => window.removeEventListener("keyup", up);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
        <Link
          href={`/inspect/${inspection.inspection_id}`}
          className="rounded-md p-1.5 text-faint hover:bg-surface-2 hover:text-text"
          aria-label="Back to inspection"
          title="Back to inspection"
        >
          <ArrowLeft size={16} />
        </Link>
        <h1 className="font-mono text-[13px] font-medium">{inspection.inspection_id}</h1>
        <StatusBadge status={inspection.status} />
        <span className="text-[12px] text-muted">
          {start && `Started from ${start.from}`}
          {history.dirty && " · unsaved changes"}
        </span>
        <div className="ml-auto flex items-center gap-3 text-[11.5px] text-muted">
          {layers.segmentation && showReference && (
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 bg-pred" /> Model prediction
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm opacity-60" style={{ background: EDIT_COLOR }} /> Your mask
          </span>
          {prediction && <ProvenanceTag provenance={prediction.provenance} />}
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-canvas">
          {start && (
            <MaskCanvas
              ref={editor}
              width={width}
              height={height}
              imageUrl={layers.imageUrl}
              initial={start.raster}
              reference={layers.segmentation?.outline ?? null}
              showReference={showReference}
              tool={tool}
              size={size}
              color={EDIT_COLOR}
              view={view}
              onViewChange={setView}
              panHeld={panHeld}
              onHistory={setHistory}
            />
          )}
          {tool === "polygon" && (
            <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md bg-text/80 px-2.5 py-1 text-[11.5px] text-white">
              Click to add points · Enter or click the first point to fill · Alt subtracts · Esc cancels
            </p>
          )}
        </div>
        <MaskToolbar
          tool={tool}
          onTool={setTool}
          size={size}
          onSize={setSize}
          maxSize={maxSize}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onUndo={() => editor.current?.undo()}
          onRedo={() => editor.current?.redo()}
          onClear={() => editor.current?.clear()}
          onZoomIn={() => zoomBy(1.25)}
          onZoomOut={() => zoomBy(0.8)}
          onFit={fit}
          showReference={showReference}
          onToggleReference={() => setShowReference((s) => !s)}
          hasReference={Boolean(layers.segmentation)}
          onSave={save}
          saving={saving}
          details={<ReviewDetailsPopover value={details} onChange={setDetails} autoLabel={autoLabel} />}
        />
      </div>
    </div>
  );
}
