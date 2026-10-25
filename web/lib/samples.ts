// Optional local sample data in public/samples (gitignored; see its README).
// Nothing here is model output produced by DefoLoop.

export interface SampleEntry {
  id: string;
  /** Paths are relative to /samples/. */
  image: string;
  gt_mask?: string;
  anomaly_map?: string;
  pred_mask?: string;
  threshold?: number;
  /** Who produced anomaly_map / pred_mask, e.g. "PatchCore reference run". */
  precomputed_by?: string;
  label?: string;
  dataset: string;
  license: string;
  note?: string;
}

export async function loadSamples(): Promise<SampleEntry[]> {
  try {
    const res = await fetch("/samples/manifest.json", { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { samples?: SampleEntry[] };
    return Array.isArray(data.samples) ? data.samples : [];
  } catch {
    return [];
  }
}

export const sampleUri = (path: string) => `/samples/${path.replace(/^\/+/, "")}`;
