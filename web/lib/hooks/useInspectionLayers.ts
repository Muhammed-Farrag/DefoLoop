"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { getDataSource } from "@/lib/api";
import type { InspectionDetail, Provenance } from "@/lib/api/types";
import {
  binaryCanvas,
  fillCanvas,
  heatmapCanvas,
  outlineCanvas,
  readRaster,
  threshold as applyThreshold,
  type Raster,
} from "@/lib/mask/raster";
import { useResolvedUri } from "./useData";

export interface MaskLayers {
  raster: Raster;
  fill: HTMLCanvasElement;
  outline: HTMLCanvasElement;
  binary: HTMLCanvasElement;
  provenance: Provenance;
}

/** undefined while loading, null when there is no such layer. */
function useRaster(uri: string | null | undefined, w: number, h: number): Raster | null | undefined {
  const url = useResolvedUri(uri);
  const [loaded, setLoaded] = useState<{ url: string; raster: Raster | null } | null>(null);
  useEffect(() => {
    let alive = true;
    if (!url) return;
    readRaster(url, w, h)
      .then((raster) => alive && setLoaded({ url, raster }))
      .catch(() => alive && setLoaded({ url, raster: null }));
    return () => {
      alive = false;
    };
  }, [url, w, h]);
  if (!uri) return null;
  if (!url || loaded?.url !== url) return undefined;
  return loaded.raster;
}

function maskLayers(raster: Raster | null | undefined, color: string, provenance: Provenance): MaskLayers | null {
  if (!raster) return null;
  return {
    raster,
    fill: fillCanvas(raster, color),
    outline: outlineCanvas(raster, color),
    binary: binaryCanvas(raster),
    provenance,
  };
}

const css = (name: string) =>
  typeof window === "undefined" ? "#000" : getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/**
 * Loads and prepares every visual layer of an inspection. All rasters are
 * resampled to the original image size so panels align pixel for pixel.
 */
export function useInspectionLayers(detail: InspectionDetail | null | undefined, threshold: number) {
  const inspection = detail?.inspection;
  const w = inspection?.image.width ?? 0;
  const h = inspection?.image.height ?? 0;
  const prediction = inspection?.prediction ?? null;
  const latestRevision = detail?.mask_revisions.at(-1) ?? null;

  const imageUrl = useResolvedUri(inspection?.image.uri);
  const anomaly = useRaster(prediction?.anomaly_map_uri, w, h);
  const predicted = useRaster(prediction?.predicted_mask_uri, w, h);
  const benchmark = useRaster(inspection?.benchmark_mask_uri, w, h);
  const human = useRaster(latestRevision?.mask_uri, w, h);

  const t = useDeferredValue(threshold);

  const imageReady = !inspection || Boolean(imageUrl);
  const ready = imageReady && [anomaly, predicted, benchmark, human].every((r) => r !== undefined);

  const heatmap = useMemo(() => (anomaly ? heatmapCanvas(anomaly) : null), [anomaly]);

  // Segmentation: live threshold of the anomaly map when we have one,
  // otherwise the model's own mask.
  const segmentation = useMemo(() => {
    const raster = anomaly ? applyThreshold(anomaly, t) : (predicted ?? null);
    return maskLayers(raster, css("--pred"), prediction?.provenance ?? "model");
  }, [anomaly, predicted, t, prediction?.provenance]);

  // Ground truth comes only from a benchmark mask or an inspector-verified revision. Never synthesised.
  const benchmarkTruth = useMemo(() => maskLayers(benchmark, css("--gt"), "benchmark"), [benchmark]);
  const humanTruth = useMemo(() => maskLayers(human, css("--gt"), "human"), [human]);

  return {
    imageUrl,
    heatmap,
    hasAnomalyMap: Boolean(anomaly),
    segmentation,
    benchmarkTruth,
    humanTruth,
    humanMask: human ?? null,
    ready,
    latestRevision,
  };
}

/** For the queue and dashboard thumbnails. */
export const resolveThumb = (uri: string) => getDataSource().resolveUri(uri);
