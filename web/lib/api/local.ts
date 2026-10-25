// In-browser demo backend (IndexedDB). It stores uploads, reviews and immutable
// mask revisions so the correction workflow is real, but it has no model:
// predict() reports "unavailable" instead of inventing output.

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { DataSource } from "./source";
import type {
  Inspection,
  InspectionDetail,
  MaskRevision,
  NewReview,
  PredictResult,
  Prediction,
  Review,
  ReviewStatus,
} from "./types";
import { sampleUri, type SampleEntry } from "../samples";
import { imageSize } from "../image";
import { inspectionId, uid } from "../id";

interface Schema extends DBSchema {
  inspections: { key: string; value: Inspection };
  reviews: { key: string; value: Review; indexes: { by_inspection: string } };
  mask_revisions: {
    key: string;
    value: MaskRevision;
    indexes: { by_inspection: string };
  };
  blobs: { key: string; value: Blob };
}

const IDB_PREFIX = "idb://";
const INSPECTOR = "local-inspector";

let dbPromise: Promise<IDBPDatabase<Schema>> | null = null;
function db() {
  dbPromise ??= openDB<Schema>("defoloop", 1, {
    upgrade(d) {
      d.createObjectStore("inspections", { keyPath: "inspection_id" });
      d.createObjectStore("reviews", { keyPath: "review_id" }).createIndex(
        "by_inspection",
        "inspection_id",
      );
      d.createObjectStore("mask_revisions", {
        keyPath: "revision_id",
      }).createIndex("by_inspection", "inspection_id");
      d.createObjectStore("blobs");
    },
  });
  return dbPromise;
}

const byDate = <T extends { created_at: string }>(a: T, b: T) =>
  a.created_at.localeCompare(b.created_at);

const objectUrls = new Map<string, string>();

function statusFor(review: Review): ReviewStatus {
  switch (review.review_type) {
    case "approved":
      return "approved";
    case "marked_normal":
      return "marked_normal";
    default:
      return "human_verified";
  }
}

export class LocalDataSource implements DataSource {
  readonly kind = "local" as const;

  async listInspections() {
    const all = await (await db()).getAll("inspections");
    return all.sort(byDate).reverse();
  }

  async getInspection(id: string): Promise<InspectionDetail | null> {
    const d = await db();
    const inspection = await d.get("inspections", id);
    if (!inspection) return null;
    const [reviews, mask_revisions] = await Promise.all([
      d.getAllFromIndex("reviews", "by_inspection", id),
      d.getAllFromIndex("mask_revisions", "by_inspection", id),
    ]);
    return {
      inspection,
      reviews: reviews.sort(byDate),
      mask_revisions: mask_revisions.sort(byDate),
    };
  }

  async createFromUpload(file: File) {
    const blobKey = uid();
    const url = URL.createObjectURL(file);
    const { width, height } = await imageSize(url).finally(() =>
      URL.revokeObjectURL(url),
    );
    const inspection: Inspection = {
      inspection_id: inspectionId(),
      created_at: new Date().toISOString(),
      source: "upload",
      image: { uri: IDB_PREFIX + blobKey, width, height, filename: file.name },
      benchmark_mask_uri: null,
      prediction: null,
      status: "not_assessed",
      label: null,
      confirmed_defect: false,
    };
    const tx = (await db()).transaction(["blobs", "inspections"], "readwrite");
    await Promise.all([
      tx.objectStore("blobs").put(file, blobKey),
      tx.objectStore("inspections").put(inspection),
      tx.done,
    ]);
    return inspection;
  }

  async createFromSample(sample: SampleEntry) {
    const image = sampleUri(sample.image);
    const { width, height } = await imageSize(image);
    const id = inspectionId();
    const hasOutput = Boolean(sample.anomaly_map || sample.pred_mask);
    const prediction: Prediction | null = hasOutput
      ? {
          inspection_id: id,
          model_version: sample.precomputed_by ?? "precomputed (external)",
          image_score: null,
          image_decision: null,
          anomaly_map_uri: sample.anomaly_map ? sampleUri(sample.anomaly_map) : null,
          predicted_mask_uri: sample.pred_mask ? sampleUri(sample.pred_mask) : null,
          suggested_class: sample.label ?? null,
          is_verified: false,
          threshold: sample.threshold ?? (sample.anomaly_map ? 0.5 : null),
          inference_ms: null,
          provenance: "illustrative",
        }
      : null;
    const inspection: Inspection = {
      inspection_id: id,
      created_at: new Date().toISOString(),
      source: "sample",
      sample: { dataset: sample.dataset, license: sample.license, note: sample.note },
      image: { uri: image, width, height, filename: sample.image.split("/").pop()! },
      benchmark_mask_uri: sample.gt_mask ? sampleUri(sample.gt_mask) : null,
      prediction,
      status: prediction ? "model_only" : "not_assessed",
      label: sample.label ?? null,
      confirmed_defect: false,
    };
    await (await db()).put("inspections", inspection);
    return inspection;
  }

  async predict(): Promise<PredictResult> {
    return {
      status: "unavailable",
      reason:
        "No model is connected. Set NEXT_PUBLIC_API_URL to a DefoLoop backend to run inference.",
    };
  }

  async addReview(id: string, input: NewReview) {
    const d = await db();
    const inspection = await d.get("inspections", id);
    if (!inspection) throw new Error(`Inspection ${id} not found`);
    const previous = (await d.getAllFromIndex("mask_revisions", "by_inspection", id))
      .sort(byDate)
      .at(-1);

    const now = new Date().toISOString();
    let revision: MaskRevision | null = null;
    let blobKey: string | null = null;
    if (input.mask) {
      blobKey = uid();
      revision = {
        revision_id: uid(),
        inspection_id: id,
        parent_revision_id: previous?.revision_id ?? null,
        created_at: now,
        mask_uri: IDB_PREFIX + blobKey,
        width: input.mask.width,
        height: input.mask.height,
        pixel_count: input.mask.pixel_count,
      };
    }

    const confirmed =
      input.review_type === "marked_normal" || input.review_type === "false_alarm"
        ? false
        : input.mask
          ? input.mask.pixel_count > 0
          : inspection.prediction?.image_decision === "defect";

    const review: Review = {
      review_id: uid(),
      inspection_id: id,
      created_at: now,
      inspector: INSPECTOR,
      review_type: input.review_type,
      defect_class: input.defect_class,
      note: input.note,
      source_model_version: inspection.prediction?.model_version ?? null,
      mask_revision_id: revision?.revision_id ?? null,
      confirmed_defect: confirmed,
    };

    const updated: Inspection = {
      ...inspection,
      status: statusFor(review),
      confirmed_defect: confirmed,
      label:
        input.review_type === "marked_normal"
          ? "normal"
          : (input.defect_class ?? inspection.label),
    };

    // Reviews and revisions are append-only; only the inspection summary changes.
    const tx = d.transaction(
      ["blobs", "mask_revisions", "reviews", "inspections"],
      "readwrite",
    );
    const ops: Promise<unknown>[] = [
      tx.objectStore("reviews").add(review),
      tx.objectStore("inspections").put(updated),
    ];
    if (revision && blobKey && input.mask) {
      ops.push(tx.objectStore("blobs").add(input.mask.png, blobKey));
      ops.push(tx.objectStore("mask_revisions").add(revision));
    }
    await Promise.all([...ops, tx.done]);
    return review;
  }

  async getLatestEvaluation() {
    // Evaluation runs only come from the backend's sealed-holdout evaluator.
    return null;
  }

  async resolveUri(uri: string) {
    if (!uri.startsWith(IDB_PREFIX)) return uri;
    const cached = objectUrls.get(uri);
    if (cached) return cached;
    const blob = await (await db()).get("blobs", uri.slice(IDB_PREFIX.length));
    if (!blob) throw new Error(`Missing local file for ${uri}`);
    const url = URL.createObjectURL(blob);
    objectUrls.set(uri, url);
    return url;
  }
}
