"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { hexToRgb, type Raster } from "@/lib/mask/raster";
import type { View } from "@/lib/hooks/useViewport";
import { ZoomPane } from "@/components/inspection/ZoomPane";
import { CanvasLayer, ImageLayer } from "@/components/inspection/CanvasLayer";

export type Tool = "brush" | "eraser" | "polygon" | "pan";

export interface MaskCanvasHandle {
  undo(): void;
  redo(): void;
  clear(): void;
  closePolygon(subtract?: boolean): void;
  cancelPolygon(): void;
  /** Binary mask at the original image resolution. */
  getRaster(): Raster;
  /** Current state is now saved; undo history is kept. */
  markSaved(): void;
}

export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
  dirty: boolean;
}

type Pt = { x: number; y: number };

/**
 * Editable defect mask drawn at the image's native resolution.
 * Works with mouse, touch and pens (pressure scales the brush).
 */
export function MaskCanvas({
  ref,
  width,
  height,
  imageUrl,
  initial,
  reference,
  showReference,
  tool,
  size,
  color,
  view,
  onViewChange,
  panHeld,
  onHistory,
}: {
  ref: Ref<MaskCanvasHandle>;
  width: number;
  height: number;
  imageUrl: string | null;
  initial: Raster | null;
  /** Model prediction outline, shown for reference while editing. */
  reference: HTMLCanvasElement | null;
  showReference: boolean;
  tool: Tool;
  /** Brush diameter in image pixels. */
  size: number;
  color: string;
  view: View;
  onViewChange: (v: View) => void;
  panHeld: boolean;
  onHistory: (h: HistoryState) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const undoStack = useRef<ImageData[]>([]);
  const redoStack = useRef<ImageData[]>([]);
  // Edits since the last save, counted so undo/redo can return to "clean".
  const editsSinceSave = useRef(0);
  const stroke = useRef<{ id: number; last: Pt } | null>(null);
  const [cursor, setCursor] = useState<(Pt & { r: number; scale: number }) | null>(null);
  const [polygon, setPolygon] = useState<Pt[]>([]);
  const maxHistory = Math.min(50, Math.max(5, Math.floor(300e6 / (width * height * 4))));
  const panning = tool === "pan" || panHeld;

  const ctx = () => canvas.current!.getContext("2d", { willReadFrequently: true })!;
  const emit = () =>
    onHistory({
      canUndo: undoStack.current.length > 0,
      canRedo: redoStack.current.length > 0,
      dirty: editsSinceSave.current !== 0,
    });

  // Paint the starting mask once.
  useEffect(() => {
    const c = canvas.current!;
    c.width = width;
    c.height = height;
    const g = ctx();
    if (initial) {
      const img = g.createImageData(width, height);
      const [r, gr, b] = hexToRgb(color);
      for (let i = 0, j = 0; i < initial.data.length; i++, j += 4) {
        if (initial.data[i] >= 128) {
          img.data[j] = r;
          img.data[j + 1] = gr;
          img.data[j + 2] = b;
          img.data[j + 3] = 255;
        }
      }
      g.putImageData(img, 0, 0);
    }
    undoStack.current = [];
    redoStack.current = [];
    editsSinceSave.current = 0;
    emit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, width, height]);

  const snapshot = () => {
    undoStack.current.push(ctx().getImageData(0, 0, width, height));
    if (undoStack.current.length > maxHistory) undoStack.current.shift();
    redoStack.current = [];
    editsSinceSave.current = Math.abs(editsSinceSave.current) + 1;
  };

  const toImage = (e: { clientX: number; clientY: number }): Pt & { scale: number } => {
    const rect = canvas.current!.getBoundingClientRect();
    const scale = rect.width / width;
    return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale, scale };
  };

  const radiusFor = (e: React.PointerEvent | PointerEvent) =>
    (size / 2) * (e.pointerType === "pen" ? Math.min(1, Math.max(0.1, e.pressure || 0.5)) : 1);

  const stamp = (from: Pt, to: Pt, r: number) => {
    const g = ctx();
    g.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    g.fillStyle = color;
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const step = Math.max(0.5, r * 0.35);
    const n = Math.max(1, Math.ceil(dist / step));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      g.beginPath();
      g.arc(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalCompositeOperation = "source-over";
  };

  const fillPolygon = (pts: Pt[], subtract: boolean) => {
    if (pts.length < 3) return;
    snapshot();
    const g = ctx();
    g.globalCompositeOperation = subtract ? "destination-out" : "source-over";
    g.fillStyle = color;
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
    g.closePath();
    g.fill();
    g.globalCompositeOperation = "source-over";
    emit();
  };

  useImperativeHandle(ref, () => ({
    undo() {
      const prev = undoStack.current.pop();
      if (!prev) return;
      redoStack.current.push(ctx().getImageData(0, 0, width, height));
      ctx().putImageData(prev, 0, 0);
      editsSinceSave.current -= 1;
      emit();
    },
    redo() {
      const next = redoStack.current.pop();
      if (!next) return;
      undoStack.current.push(ctx().getImageData(0, 0, width, height));
      ctx().putImageData(next, 0, 0);
      editsSinceSave.current += 1;
      emit();
    },
    clear() {
      snapshot();
      ctx().clearRect(0, 0, width, height);
      emit();
    },
    closePolygon(subtract = false) {
      fillPolygon(polygon, subtract);
      setPolygon([]);
    },
    cancelPolygon() {
      setPolygon([]);
    },
    getRaster() {
      const rgba = ctx().getImageData(0, 0, width, height).data;
      const data = new Uint8Array(width * height);
      for (let i = 0; i < data.length; i++) data[i] = rgba[i * 4 + 3] >= 128 ? 255 : 0;
      return { width, height, data };
    },
    markSaved() {
      editsSinceSave.current = 0;
      emit();
    },
  }));

  const onPointerDown = (e: React.PointerEvent) => {
    if (panning || e.button !== 0) return;
    e.stopPropagation();
    const p = toImage(e);
    if (tool === "polygon") {
      const first = polygon[0];
      if (first && polygon.length >= 3 && Math.hypot(p.x - first.x, p.y - first.y) * p.scale < 10) {
        fillPolygon(polygon, e.altKey);
        setPolygon([]);
      } else {
        setPolygon((pts) => [...pts, { x: p.x, y: p.y }]);
      }
      return;
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Pointer already released; the stroke still works without capture.
    }
    snapshot();
    stroke.current = { id: e.pointerId, last: p };
    stamp(p, p, radiusFor(e));
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const p = toImage(e);
    setCursor({ x: p.x, y: p.y, r: radiusFor(e), scale: p.scale });
    const s = stroke.current;
    if (!s || s.id !== e.pointerId) return;
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
    let last = s.last;
    for (const ev of events.length ? events : [e.nativeEvent]) {
      const q = toImage(ev);
      stamp(last, q, radiusFor(ev));
      last = q;
    }
    s.last = last;
  };

  const endStroke = (e: React.PointerEvent) => {
    if (stroke.current?.id === e.pointerId) {
      stroke.current = null;
      emit();
    }
  };

  const showBrush = cursor && !panning && (tool === "brush" || tool === "eraser");

  return (
    <ZoomPane
      width={width}
      height={height}
      view={view}
      onViewChange={onViewChange}
      dragToPan={panning}
      cursor={panning ? "grab" : tool === "polygon" ? "crosshair" : "none"}
    >
      <ImageLayer src={imageUrl} alt="Product image" />
      {showReference && <CanvasLayer source={reference} opacity={0.9} />}
      <canvas
        ref={canvas}
        className="absolute inset-0 h-full w-full"
        style={{ opacity: 0.5 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onPointerLeave={() => setCursor(null)}
        onDoubleClick={() => {
          if (tool === "polygon") {
            fillPolygon(polygon, false);
            setPolygon([]);
          }
        }}
      />
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        {showBrush && (
          <circle
            cx={cursor.x}
            cy={cursor.y}
            r={cursor.r}
            fill="none"
            stroke={tool === "eraser" ? "#fff" : color}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            style={{ filter: "drop-shadow(0 0 1px rgba(0,0,0,.8))" }}
          />
        )}
        {polygon.length > 0 && (
          <>
            <polyline
              points={[...polygon, ...(cursor ? [cursor] : [])].map((p) => `${p.x},${p.y}`).join(" ")}
              fill={`${color}22`}
              stroke={color}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
            {polygon.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={(i === 0 ? 5 : 3.5) / (cursor?.scale ?? 1)}
                fill={i === 0 ? color : "#fff"}
                stroke={color}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </>
        )}
      </svg>
    </ZoomPane>
  );
}
