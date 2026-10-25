// FastAPI-backed data source following the endpoints in docs/prd.md §7.

import type { DataSource } from "./source";
import type {
  EvaluationRun,
  Inspection,
  InspectionDetail,
  NewReview,
  PredictResult,
  Prediction,
  Review,
} from "./types";
import type { SampleEntry } from "../samples";

export class HttpDataSource implements DataSource {
  readonly kind = "http" as const;
  constructor(private readonly base: string) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.base}${path}`, init);
    if (!res.ok) {
      throw new Error(`${init?.method ?? "GET"} ${path} failed: ${res.status}`);
    }
    return (await res.json()) as T;
  }

  listInspections() {
    return this.request<Inspection[]>("/api/inspections");
  }

  async getInspection(id: string) {
    try {
      return await this.request<InspectionDetail>(`/api/inspections/${id}`);
    } catch {
      return null;
    }
  }

  createFromUpload(file: File) {
    const body = new FormData();
    body.append("image", file);
    return this.request<Inspection>("/api/inspections", { method: "POST", body });
  }

  createFromSample(sample: SampleEntry) {
    return this.request<Inspection>("/api/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sample_id: sample.id }),
    });
  }

  async predict(id: string): Promise<PredictResult> {
    try {
      const prediction = await this.request<Prediction>(
        `/api/inspections/${id}/predict`,
        { method: "POST" },
      );
      return { status: "ok", prediction };
    } catch (e) {
      return { status: "unavailable", reason: (e as Error).message };
    }
  }

  addReview(id: string, review: NewReview) {
    const body = new FormData();
    body.append(
      "review",
      JSON.stringify({
        review_type: review.review_type,
        defect_class: review.defect_class,
        note: review.note,
        mask_width: review.mask?.width,
        mask_height: review.mask?.height,
      }),
    );
    if (review.mask) body.append("mask", review.mask.png, "mask.png");
    return this.request<Review>(`/api/inspections/${id}/reviews`, {
      method: "POST",
      body,
    });
  }

  async getLatestEvaluation() {
    try {
      return await this.request<EvaluationRun>("/api/evaluations/latest");
    } catch {
      return null;
    }
  }

  async resolveUri(uri: string) {
    return /^(https?:|blob:|data:)/.test(uri) ? uri : `${this.base}${uri}`;
  }
}
