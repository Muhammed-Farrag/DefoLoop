// Data contracts mirroring docs/prd.md §7. Field names follow the PRD's
// prediction JSON so the FastAPI backend can be dropped in without mapping.

export type ReviewStatus =
  | "not_assessed" // no model output yet and no human review
  | "model_only" // model prediction exists, nobody has reviewed it
  | "approved" // inspector accepted the model prediction as-is
  | "human_verified" // inspector corrected the mask
  | "marked_normal"; // inspector says there is no defect

export type ReviewType =
  | "approved"
  | "false_alarm"
  | "missed_defect"
  | "wrong_region"
  | "wrong_label"
  | "marked_normal";

export const DEFECT_CLASSES = [
  "unknown",
  "scratch",
  "crack",
  "dent",
  "contamination",
  "missing component",
  "misalignment",
  "discoloration",
] as const;
export type DefectClass = (typeof DEFECT_CLASSES)[number];

/** Where an image layer came from. Drives the provenance tag on every panel. */
export type Provenance =
  | "model" // produced by a DefoLoop model version via the backend
  | "illustrative" // precomputed sample shipped with the local demo data
  | "benchmark" // dataset-provided ground truth
  | "human"; // inspector-verified mask revision

export interface ImageAsset {
  uri: string;
  width: number;
  height: number;
  filename: string;
}

export interface Prediction {
  inspection_id: string;
  model_version: string;
  image_score: number | null;
  image_decision: "defect" | "normal" | null;
  /** Grayscale PNG; pixel value / 255 is the normalised anomaly score. */
  anomaly_map_uri: string | null;
  predicted_mask_uri: string | null;
  suggested_class: string | null;
  is_verified: false;
  /** Operating threshold on the normalised anomaly map, 0..1. */
  threshold: number | null;
  inference_ms: number | null;
  provenance: Extract<Provenance, "model" | "illustrative">;
}

export interface Inspection {
  inspection_id: string;
  created_at: string;
  source: "upload" | "sample";
  sample?: { dataset: string; license: string; note?: string };
  image: ImageAsset;
  /** Benchmark mask shipped with a dataset sample. Never synthesised. */
  benchmark_mask_uri: string | null;
  prediction: Prediction | null;
  status: ReviewStatus;
  /** Short label for lists: verified class, else the provisional suggestion. */
  label: string | null;
  confirmed_defect: boolean;
}

export interface MaskRevision {
  revision_id: string;
  inspection_id: string;
  parent_revision_id: string | null;
  created_at: string;
  /** Binary PNG at the original image resolution (0 = background, 255 = defect). */
  mask_uri: string;
  width: number;
  height: number;
  pixel_count: number;
}

export interface Review {
  review_id: string;
  inspection_id: string;
  created_at: string;
  inspector: string;
  review_type: ReviewType;
  defect_class: DefectClass | null;
  note: string;
  source_model_version: string | null;
  /** Mask revision this review created (human-verified annotation). */
  mask_revision_id: string | null;
  confirmed_defect: boolean;
}

export interface InspectionDetail {
  inspection: Inspection;
  reviews: Review[];
  mask_revisions: MaskRevision[];
}

export interface NewReview {
  review_type: ReviewType;
  defect_class: DefectClass | null;
  note: string;
  /** Binary mask at original resolution; omitted only when no mask is involved. */
  mask?: { png: Blob; width: number; height: number; pixel_count: number };
}

export type PredictResult =
  | { status: "ok"; prediction: Prediction }
  | { status: "unavailable"; reason: string };

export interface MetricValue {
  value: number;
  numerator: number;
  denominator: number;
}

export interface MetricComparison {
  key: "defect_recall" | "false_positive_rate" | "pixel_iou" | "pixel_dice";
  label: string;
  higher_is_better: boolean;
  baseline: MetricValue;
  adapted: MetricValue;
  /** e.g. 95% paired-bootstrap interval for the difference. */
  delta_ci?: [number, number];
}

export interface EvaluationRun {
  evaluation_id: string;
  created_at: string;
  baseline_version: string;
  adapted_version: string;
  split: {
    id: string;
    manifest_sha256: string;
    n_images: number;
    n_defective: number;
    n_normal: number;
  };
  metrics: MetricComparison[];
  images_uri: string | null;
  caveats: string[];
}
