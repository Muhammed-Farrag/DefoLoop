import { useCallback, useState } from "react";

/** Shared view in image coordinates: zoom 1 = fit, (cx, cy) = image point at the pane centre. */
export interface View {
  zoom: number;
  cx: number;
  cy: number;
}

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 40;
export const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

export function useViewport(width: number, height: number, initial?: View | null) {
  const fitView = useCallback((): View => ({ zoom: 1, cx: width / 2, cy: height / 2 }), [width, height]);
  const [view, setView] = useState<View>(() => initial ?? fitView());
  const [prevSize, setPrevSize] = useState({ width, height });
  if (prevSize.width !== width || prevSize.height !== height) {
    setPrevSize({ width, height });
    setView(fitView());
  }

  const fit = useCallback(() => setView(fitView()), [fitView]);
  const zoomBy = useCallback(
    (factor: number) => setView((v) => ({ ...v, zoom: clampZoom(v.zoom * factor) })),
    [],
  );
  return { view, setView, fit, zoomBy };
}
