"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { clampZoom, type View } from "@/lib/hooks/useViewport";

/**
 * Renders children at native image size inside a pan/zoom transform.
 * Several panes given the same view stay in sync.
 */
export function ZoomPane({
  width,
  height,
  view,
  onViewChange,
  dragToPan = true,
  cursor,
  children,
  overlay,
}: {
  width: number;
  height: number;
  view: View;
  onViewChange: (v: View) => void;
  /** Left-drag pans. Middle-drag always pans. */
  dragToPan?: boolean;
  cursor?: string;
  children: ReactNode;
  /** Rendered in screen space above the image (e.g. labels). */
  overlay?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const latest = useRef({ view, onViewChange, size });
  useEffect(() => {
    latest.current = { view, onViewChange, size };
  });

  useEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { view: v, onViewChange: set, size: sz } = latest.current;
      const fit = Math.min(sz.w / width, sz.h / height) || 1;
      const s = fit * v.zoom;
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const ix = (px - sz.w / 2) / s + v.cx;
      const iy = (py - sz.h / 2) / s + v.cy;
      const zoom = clampZoom(v.zoom * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)));
      const s2 = fit * zoom;
      set({ zoom, cx: ix - (px - sz.w / 2) / s2, cy: iy - (py - sz.h / 2) / s2 });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      ro.disconnect();
      el.removeEventListener("wheel", onWheel);
    };
  }, [width, height]);

  const drag = useRef<{ x: number; y: number; id: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const fit = Math.min(size.w / width, size.h / height) || 0;
  const s = fit * view.zoom;
  const tx = size.w / 2 - view.cx * s;
  const ty = size.h / 2 - view.cy * s;

  return (
    <div
      ref={ref}
      className="relative h-full w-full touch-none overflow-hidden select-none"
      style={{ cursor: dragging ? "grabbing" : (cursor ?? (dragToPan ? "grab" : undefined)) }}
      onPointerDown={(e) => {
        if (!(e.button === 1 || (e.button === 0 && dragToPan))) return;
        e.preventDefault();
        drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
        try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Pointer already released; the stroke still works without capture.
    }
        setDragging(true);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId || !s) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        drag.current = { ...d, x: e.clientX, y: e.clientY };
        onViewChange({ ...view, cx: view.cx - dx / s, cy: view.cy - dy / s });
      }}
      onPointerUp={(e) => {
        if (drag.current?.id === e.pointerId) {
          drag.current = null;
          setDragging(false);
        }
      }}
    >
      {/* Always mounted so children (e.g. the mask canvas) exist before the first measure. */}
      <div
        className={`absolute top-0 left-0 origin-top-left ${s > 2 ? "pixelated" : ""}`}
        style={{
          width,
          height,
          transform: `translate(${tx}px, ${ty}px) scale(${s})`,
          visibility: fit > 0 ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
      {overlay}
    </div>
  );
}
