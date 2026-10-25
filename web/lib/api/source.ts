import type {
  EvaluationRun,
  Inspection,
  InspectionDetail,
  NewReview,
  PredictResult,
  Review,
} from "./types";
import type { SampleEntry } from "../samples";

/** Everything the UI needs from a backend. See docs/prd.md §7. */
export interface DataSource {
  readonly kind: "local" | "http";
  listInspections(): Promise<Inspection[]>;
  getInspection(id: string): Promise<InspectionDetail | null>;
  createFromUpload(file: File): Promise<Inspection>;
  createFromSample(sample: SampleEntry): Promise<Inspection>;
  predict(id: string): Promise<PredictResult>;
  addReview(id: string, review: NewReview): Promise<Review>;
  getLatestEvaluation(): Promise<EvaluationRun | null>;
  /** Turns a stored URI into something an <img> can load. */
  resolveUri(uri: string): Promise<string>;
}
