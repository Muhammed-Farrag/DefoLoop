"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play } from "lucide-react";
import { getDataSource } from "@/lib/api";
import { DEFECT_CLASSES, type DefectClass, type InspectionDetail } from "@/lib/api/types";
import { useHotkeys } from "@/lib/hooks/useHotkeys";
import { useInspectionLayers, type MaskLayers } from "@/lib/hooks/useInspectionLayers";
import { useViewport } from "@/lib/hooks/useViewport";
import { countOn, encodeMaskPng, type Raster } from "@/lib/mask/raster";
import { TURBO_GRADIENT } from "@/lib/render/colormap";
import { StatusBadge } from "@/components/status/StatusBadge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { CanvasLayer, ImageLayer } from "./CanvasLayer";
import { ImagePanel } from "./ImagePanel";
import { InfoPopover } from "./InfoPopover";
import { PanelGrid } from "./PanelGrid";
import { ReviewActions } from "./ReviewActions";
import { VisualizationControls, type VisMode } from "./VisualizationControls";
import { ZoomPane } from "./ZoomPane";

const MODE_ORDER: VisMode[] = ["overlay", "outline", "raw"];

function MaskView({ mask, image, mode, opacity }: { mask: MaskLayers; image: string | null; mode: VisMode; opacity: number }) {
  if (mode === "raw") return <CanvasLayer source={mask.binary} />;
  return (
    <>
      <ImageLayer src={image} alt="" />
      {mode === "overlay" && <CanvasLayer source={mask.fill} opacity={opacity * 0.6} />}
      <CanvasLayer source={mask.outline} />
    </>
  );
}

const pct = (n: number, total: number) => `${((n / total) * 100).toFixed(n / total < 0.01 ? 2 : 1)}%`;

export function InspectionWorkspace({ detail, onChanged }: { detail: InspectionDetail; onChanged: () => void }) {
  const { inspection } = detail;
  const { width, height } = inspection.image;
  const prediction = inspection.prediction;
  const router = useRouter();
  const toast = useToast();

  const [threshold, setThreshold] = useState(prediction?.threshold ?? 0.5);
  const [mode, setMode] = useState<VisMode>("overlay");
  const [opacity, setOpacity] = useState(0.6);
  const [focused, setFocused] = useState<number | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { view, setView, fit, zoomBy } = useViewport(width, height);

  const layers = useInspectionLayers(detail, threshold);
  const [gtChoice, setGtChoice] = useState<"human" | "benchmark">("human");
  const groundTruth =
    layers.humanTruth && layers.benchmarkTruth
      ? gtChoice === "human"
        ? layers.humanTruth
        : layers.benchmarkTruth
      : (layers.humanTruth ?? layers.benchmarkTruth);
  const area = width * height;
  const gtCount = useMemo(() => (groundTruth ? countOn(groundTruth.raster) : 0), [groundTruth]);
  const predCount = useMemo(() => (layers.segmentation ? countOn(layers.segmentation.raster) : 0), [layers.segmentation]);
  const suggestedClass: DefectClass = DEFECT_CLASSES.includes(prediction?.suggested_class as DefectClass)
    ? (prediction!.suggested_class as DefectClass)
    : "unknown";

  async function review(kind: "approved" | "marked_normal", mask: Raster) {
    setBusy(true);
    try {
      await getDataSource().addReview(inspection.inspection_id, {
        review_type: kind,
        defect_class: kind === "marked_normal" ? null : suggestedClass,
        note: "",
        mask: { png: await encodeMaskPng(mask), width, height, pixel_count: countOn(mask) },
      });
      toast(kind === "approved" ? "Prediction approved and saved as verified annotation" : "Marked as normal");
      onChanged();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  const approve = () => {
    if (layers.segmentation) review("approved", layers.segmentation.raster);
  };
  const markNormal = () => review("marked_normal", { width, height, data: new Uint8Array(width * height) });
  const correct = () => {
    const q = new URLSearchParams({ t: threshold.toFixed(2), v: [view.zoom, view.cx, view.cy].map((n) => n.toFixed(2)).join(",") });
    router.push(`/mask-review/${inspection.inspection_id}?${q}`);
  };

  async function runModel() {
    setBusy(true);
    const res = await getDataSource().predict(inspection.inspection_id);
    setBusy(false);
    if (res.status === "ok") {
      toast("Model output ready");
      onChanged();
    } else {
      toast(res.reason, "error");
    }
  }

  const toggleFocus = (i: number) => setFocused((f) => (f === i ? null : i));

  useHotkeys({
    a: () => !busy && layers.segmentation && approve(),
    c: correct,
    n: () => !busy && markNormal(),
    v: () => setMode((m) => MODE_ORDER[(MODE_ORDER.indexOf(m) + 1) % MODE_ORDER.length]),
    i: () => setInfoOpen((o) => !o),
    "0": fit,
    "=": () => zoomBy(1.25),
    "+": () => zoomBy(1.25),
    "-": () => zoomBy(0.8),
    "1": () => toggleFocus(0),
    "2": () => toggleFocus(1),
    "3": () => toggleFocus(2),
    "4": () => toggleFocus(3),
    escape: () => setFocused(null),
  });

  const pane = (children: React.ReactNode) => (
    <ZoomPane width={width} height={height} view={view} onViewChange={setView}>
      {children}
    </ZoomPane>
  );

  const noModel = { title: "Model not connected", detail: "No anomaly output for this image yet." };
  const modelTitle =
    prediction?.provenance === "illustrative"
      ? `Precomputed by ${prediction.model_version}; not produced by DefoLoop`
      : prediction
        ? `Model ${prediction.model_version}`
        : undefined;

  const panels = [
    <ImagePanel
      key="input"
      title="Input Image"
      provenance={inspection.source === "sample" ? "illustrative" : null}
      provenanceTitle={inspection.sample ? `${inspection.sample.dataset} · ${inspection.sample.license}` : undefined}
      focused={focused === 0}
      onToggleFocus={() => toggleFocus(0)}
      shortcut="1"
      footer={<span className="font-mono">{width} × {height}</span>}
    >
      {pane(<ImageLayer src={layers.imageUrl} alt={`Inspection ${inspection.inspection_id}`} />)}
    </ImagePanel>,

    <ImagePanel
      key="anomaly"
      title="Anomaly Map"
      provenance={layers.heatmap ? prediction?.provenance : null}
      provenanceTitle={modelTitle}
      empty={layers.heatmap ? null : noModel}
      focused={focused === 1}
      onToggleFocus={() => toggleFocus(1)}
      shortcut="2"
      footer={
        <>
          <span>Low</span>
          <span className="relative h-1.5 flex-1 rounded-full" style={{ background: TURBO_GRADIENT }}>
            <span
              className="absolute -top-1 h-3.5 w-0.5 bg-text"
              style={{ left: `${threshold * 100}%` }}
              title={`Threshold ${threshold.toFixed(2)}`}
            />
          </span>
          <span>High</span>
        </>
      }
    >
      {pane(
        <>
          {mode !== "raw" && <ImageLayer src={layers.imageUrl} alt="" />}
          <CanvasLayer source={layers.heatmap} opacity={mode === "raw" ? 1 : opacity} />
        </>,
      )}
    </ImagePanel>,

    <ImagePanel
      key="gt"
      title="Ground Truth"
      provenance={groundTruth?.provenance}
      actions={
        layers.humanTruth &&
        layers.benchmarkTruth && (
          <div className="flex rounded bg-surface-2 p-0.5 text-[11px]" role="radiogroup" aria-label="Ground truth source">
            {(["human", "benchmark"] as const).map((k) => (
              <button
                key={k}
                role="radio"
                aria-checked={gtChoice === k}
                onClick={() => setGtChoice(k)}
                className={`h-5 rounded px-1.5 ${gtChoice === k ? "bg-surface font-medium shadow-sm" : "text-muted"}`}
              >
                {k === "human" ? "Verified" : "Benchmark"}
              </button>
            ))}
          </div>
        )
      }
      empty={
        groundTruth
          ? null
          : { title: "Ground truth unavailable", detail: "Awaiting verification. Approve or correct the mask to create one." }
      }
      focused={focused === 2}
      onToggleFocus={() => toggleFocus(2)}
      shortcut="3"
      footer={
        groundTruth && (
          <>
            <span className="h-2 w-2 rounded-sm bg-gt" />
            {gtCount === 0 ? "No defect" : `Defect area ${pct(gtCount, area)}`}
          </>
        )
      }
    >
      {groundTruth && pane(<MaskView mask={groundTruth} image={layers.imageUrl} mode={mode} opacity={opacity} />)}
    </ImagePanel>,

    <ImagePanel
      key="seg"
      title="Segmentation Result"
      provenance={layers.segmentation ? prediction?.provenance : null}
      provenanceTitle={modelTitle}
      empty={layers.segmentation ? null : noModel}
      focused={focused === 3}
      onToggleFocus={() => toggleFocus(3)}
      shortcut="4"
      footer={
        layers.segmentation && (
          <>
            <span className="h-2 w-2 rounded-sm bg-pred" />
            <span>Predicted area {pct(predCount, area)}</span>
            {prediction?.suggested_class && <span className="truncate">· {prediction.suggested_class} (provisional)</span>}
          </>
        )
      }
    >
      {layers.segmentation && pane(<MaskView mask={layers.segmentation} image={layers.imageUrl} mode={mode} opacity={opacity} />)}
    </ImagePanel>,
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
        <Link href="/review" className="rounded-md p-1.5 text-faint hover:bg-surface-2 hover:text-text" aria-label="Back to queue">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="font-mono text-[13px] font-medium">{inspection.inspection_id}</h1>
        <StatusBadge status={inspection.status} />
        <InfoPopover inspection={inspection} open={infoOpen} onOpenChange={setInfoOpen} />
        <div className="ml-auto flex items-center gap-2">
          {!prediction && (
            <Button variant="ghost" onClick={runModel} disabled={busy}>
              <Play size={14} strokeWidth={1.75} /> Run model
            </Button>
          )}
          <ReviewActions
            canApprove={Boolean(layers.segmentation)}
            busy={busy}
            onApprove={approve}
            onCorrect={correct}
            onMarkNormal={markNormal}
          />
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
        <PanelGrid panels={panels} focused={focused} />
        <VisualizationControls
          mode={mode}
          onMode={setMode}
          opacity={opacity}
          onOpacity={setOpacity}
          threshold={threshold}
          onThreshold={setThreshold}
          thresholdEnabled={layers.hasAnomalyMap}
          zoom={view.zoom}
          onZoomIn={() => zoomBy(1.25)}
          onZoomOut={() => zoomBy(0.8)}
          onFit={fit}
        />
      </div>
    </div>
  );
}
