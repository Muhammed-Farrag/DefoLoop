"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Four equal panels: 2×2 normally, 4×1 when the area is very wide.
 * When one panel is focused it fills the whole area.
 */
export function PanelGrid({ panels, focused }: { panels: ReactNode[]; focused: number | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setWide(e.contentRect.width / e.contentRect.height > 2.6));
    ro.observe(ref.current!);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`grid min-h-0 flex-1 gap-2 ${
        focused !== null ? "grid-cols-1 grid-rows-1" : wide ? "grid-cols-4 grid-rows-1" : "grid-cols-2 grid-rows-2"
      }`}
    >
      {panels.map((p, i) => (focused === null || focused === i ? <div key={i} className="contents">{p}</div> : null))}
    </div>
  );
}
