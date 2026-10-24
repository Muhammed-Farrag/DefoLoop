# DefectLoop AI — Product Requirements Document

**Version:** 0.1 (hackathon build plan)  
**Prepared:** 24 October 2026  
**Team:** 3 engineers (Tech Lead + ML Engineer + Full-Stack Engineer)  
**Event:** Meta Global AI Developer Hackathon, 26 Oct – 4 Nov 2026  
**Status:** Proposal / engineering baseline; not evidence of a trained system

> **Product thesis:** A human inspector's verified corrections should make an anomaly-localization model measurably better on previously unseen manufacturing images, without silently worsening its false-alarm rate.

## 1. Executive summary

DefectLoop AI is a human-in-the-loop visual quality-inspection prototype for manufacturing images. It scores potential anomalies at the pixel level, proposes a defect region and provisional category, lets an inspector approve or correct the result, and uses those verified corrections to update a lightweight adaptation layer. The team will test the new model on a strictly held-out test set and report changes in missed defects, segmentation quality and false alarms.

**Primary deliverable:** one browser-based workflow demonstrating a real before/after learning cycle on one industrial object category, with a reproducible evaluation report and a recorded demo.

**Non-negotiable:** human feedback cannot mean only editing a displayed mask. The correction must enter a versioned learning dataset and update a scoring/classification component; the team must compare model v0 and v1 on exactly the same unseen examples.

## 2. Users, problem and goals

**Primary user:** manufacturing quality inspector reviewing a captured image and deciding accept / reject / unsure.  
**Secondary user:** quality engineer examining defect distributions, corrections and false positives.  
**Tertiary user:** ML engineer validating model changes and data provenance.

**Problem:** manual inspection is repetitive; generic image classifiers may miss small or previously unseen defects, while opaque AI predictions are hard to audit or improve. Teams need localization, human override, and evidence that learning from corrections is helpful.

**P0 goals**
- Detect abnormal vs normal images and return a continuous anomaly score map.
- Localize defects with a binary segmentation mask and optional outline/box.
- Surface a provisional defect label, or `unknown defect` when evidence is weak.
- Let inspectors add, erase, or redraw pixel masks, fix labels, and flag false negatives/false positives.
- Persist correction provenance and produce an explicit new model version from a feedback batch.
- Compare baseline and updated models on sealed holdout images; show both accuracy and false-alarm trade-offs.

**P1 goals:** triage queue; FPR-calibrated contour views; latency/cost dashboard; controlled second category.  
**Out of scope for hackathon:** live PLC rejection, conveyor tracking/counting, safety certification, autonomous production decisions, continual online training after every click, multi-factory tenancy and fully automated root-cause analysis.

## 3. Reference output and UX contract

The user-provided illustration is the visual target: a 2×2 diagnostic grid with **Input Image**, **Anomaly Map**, **Ground Truth**, and **Segmentation Result**. DefectLoop must distinguish a model prediction from independently verified ground truth.

| Panel | Source of truth | Required presentation |
| --- | --- | --- |
| Input image | Uploaded/source image | Original full-resolution image, with pan/zoom and an image ID |
| Anomaly map | Continuous anomaly-scoring model | Blue→red heatmap (or accessible palette), scale, calibrated score semantics, threshold slider |
| Ground truth | Benchmark label or saved inspector-approved correction | Binary colored overlay; otherwise show **Awaiting verification** (never synthesize GT) |
| Segmentation result | Thresholded model score, optionally SAM-refined | Binary mask/outline overlay, area, provisional class, model version; optional error overlay against GT |

**Important visual semantics:** the screenshot's 1%, 3%, 10%, 30%, 50%, 100% contours are false-positive-rate (FPR) operating levels, **not** defect probabilities. Only display FPR contours if thresholds were calibrated using separate normal calibration images and their denominator (e.g., normal pixels) is stated. Default MVP can render the continuous heatmap plus a calibrated single threshold instead.

**User journey:** upload/select image → run model v0 → inspect 4-panel evidence → mark AI correct / false alarm / missed defect / wrong region / wrong label → correct with paint/erase or SAM-assisted point/box prompts → save immutable correction → batch-adapt → run model v1 → view paired v0/v1 metrics on untouched test images.

**Quality/safety UX:** label machine suggestions as provisional; show `human verified`, `model only`, and `not assessed` distinctly. On failures, preserve the original image and allow manual annotations without the API.

## 4. Data selection and labeling plan

| Source | What it really contains | Decision and constraints |
| --- | --- | --- |
| **VisA** (recommended primary) | 10,821 images across 12 object categories; normal/abnormal labels and pixel-level masks; CC BY 4.0 listing | Start with one `pcb` subset; reserve independent test before experiments. Need a small team-reviewed taxonomy for defect subtypes rather than assuming the data provides semantic subtype labels. |
| **MVTec AD** (reference / optional benchmark) | >5,000 images, 15 categories; normal-only training and pixel-level test annotations | Useful for the supplied metal-nut style and controlled comparisons. **CC BY-NC-SA 4.0**: noncommercial restriction; get clarity before including in a prize-oriented/public-commercial use case. |
| **Mendeley iron-ore conveyor** (stretch demo) | Lab conveyor recordings, extracted frames, limited YOLO labels, incomplete segmentation labels; CC BY 4.0 | Best for an optional video/domain-shift demo. **Do not treat labels as full pixel ground truth**; split by source video to prevent near-identical frames leaking across partitions. |
| **InspectFlow AI** (architectural reference) | YOLO/ByteTrack cookies, counting events and video reports | Different primary task. Repo explicitly states it has **no project code license**; study public architecture but don't copy code/weights without permission. |

**Selected pilot:** one VisA PCB category (`pcb1` through `pcb4`, select whichever has enough useful anomalies after inspection). Alternative for faster visual replication is MVTec metal nut, subject to license review. Start with 50–100 image samples for pipeline QA, then expand the predetermined split rather than cherry-picking successful examples.

**Frozen manifest fields:** `image_id`, `source_dataset`, `category`, `defect_type_if_verified`, `source_group_id`, `split`, `image_sha256`, `mask_sha256`, `width`, `height`, `license`, `annotator`, `review_status`. Store a versioned manifest and checksums. Never put source images into Git if redistribution is not expressly permitted.

**Split protocol:** choose/lock image or source-group-level train / calibration / feedback / holdout splits *before model tuning*. Start with normal training images to construct the baseline. Use calibration (including normal-only images for thresholds); select feedback images only from a disjoint feedback pool; reserve a hidden final holdout with both normal and defective images. For MVTec, creating feedback and final-holdout subsets from the original benchmark test set means results are **custom holdout results, not directly comparable to official MVTec benchmark leaderboards**. For Mendeley video: split by original recording/session, not individual adjacent frames.

## 5. AI architecture and honest capability boundaries

**Baseline anomaly scoring — DINOv3 frozen patch features:** extract dense patch embeddings on correctly resized/padded images. Build a bank of normal reference embeddings per category. Score each query patch using distance to nearby normal features, upsample to a dense anomaly heatmap, aggregate to an image score. This is a PatchCore-like approach; it is not an official DINOv3 defect detector. Document backbone size, patch grid, image preprocessing, nearest-neighbor index, score normalization and inference time.

**Optional segmentation refinement — Meta SAM 3.1:** feed point/box prompts drawn from suspicious regions or inspector interactions, and use returned masks to refine selected boundaries. SAM is a promptable segmenter, **not inherently a defect detector**. Always retain the original anomaly mask if SAM output degrades the result; compare mask quality with/without SAM in an ablation. Access path: Meta Model API; handle timeout/quotas, privacy and costs.

**Provisional description/category — Muse Spark:** use crop + region geometry + a closed vocabulary to propose a human-readable finding such as `surface anomaly` or `possible missing component`. It may assist triage but **must not define the pixel ground truth, test label or classifier gold standard**. If semantic subtype labels are unverified, emit `unknown defect`; a verified correction can create a labeled training example.

**Feedback-adapted scoring (MVP):** after manual review, freeze the DINOv3 encoder and train a lightweight binary patch classifier on corrected positive/negative mask regions, optionally alongside a normal memory bank. Version weights and preprocessing. Use balanced sampling and hard negatives. This supplies a genuine, fast model update without finetuning huge foundation weights. Recalibrate the operating threshold on the *calibration* pool (not the final holdout).

**Key algorithmic warning:** simply appending confirmed defective patches to a memory bank of **normal** patches is incorrect: it can make real defects look normal. Positive corrections belong in a separate supervised classifier/prototype collection; verified false positives can improve the normal/negative representation.

**Inference pipeline:** image → preprocessing → DINOv3 patch embeddings → anomaly scoring → postprocessing / threshold → optional SAM region refinement → optional Muse Spark description → serialized prediction with version + hashes → frontend review.

**Learning pipeline:** human-reviewed mask/class + review type → feedback store → QA check → batch adaptation job → new versioned classifier + threshold → evaluation → manually approve promotion or roll back. A new model is never silently pushed into a manufacturing decision path.

## 6. Functional requirements and acceptance criteria

| ID | Priority | Requirement | Demonstrable acceptance |
| --- | --- | --- | --- |
| FR-01 | P0 | Image upload / dataset sample picker | PNG/JPEG accepted; dimensions validated; unchanged original preserved |
| FR-02 | P0 | Anomaly-map inference | Continuous map aligned to input and saved with `model_version` |
| FR-03 | P0 | Region segmentation | Mask export has input's pixel dimensions; correct alignment after resize |
| FR-04 | P0 | Four diagnostic panels | Input, heatmap, GT status, predicted mask visible; no fabricated GT |
| FR-05 | P0 | Inspector correction | Paint/erase or polygon changes persist on reopen; wrong label & missed defect supported |
| FR-06 | P0 | Feedback data audit | Inspector/review type/time/source model/old mask/new mask logged |
| FR-07 | P0 | Explicit batch model update | `v0` remains immutable; training creates separate `v1` artifact and run logs |
| FR-08 | P0 | Sealed holdout comparison | Paired v0/v1 metrics and sample count, confidence intervals or caveats, split ID |
| FR-09 | P0 | Honest fallback | If SAM/Muse unavailable, DINO baseline + manual review still work |
| FR-10 | P1 | SAM-assisted editing | Inspector can click/box to refine region, then override/edit manually |
| FR-11 | P1 | Defect taxonomy | `unknown` explicitly supported; validated labels separated from AI descriptions |
| FR-12 | P1 | Export/audit | Export PNG overlays, masks, CSV/JSON metrics, run manifest and model hash |

## 7. Minimal API and data contracts

**Suggested stack:** Python + FastAPI + PyTorch / `transformers` or official DINOv3 package + NumPy / scikit-learn; React/Next.js frontend + lightweight canvas mask editor; SQLite for hackathon metadata (upgrade path to PostgreSQL), file/object storage for images/masks; optional Modal GPU worker for feature extraction/training. Keep Model API keys server-side.

| Endpoint | Behavior |
| --- | --- |
| `POST /api/inspections` | Create inspection and store original image; return `inspection_id` |
| `POST /api/inspections/{id}/predict` | Run selected model; return scores, mask URI and version |
| `GET /api/inspections/{id}` | Load original, predictions, corrections, approval state |
| `POST /api/inspections/{id}/reviews` | Add immutable review/mask correction with provenance |
| `POST /api/training-runs` | Start explicit adaptation job using approved feedback IDs |
| `GET /api/training-runs/{id}` | Retrieve status, checkpoints and recorded experiment inputs |
| `GET /api/evaluations/{id}` | Retrieve paired metrics, split manifest hash and artifacts |

**Core entities:** `ImageAsset`, `Inspection`, `Prediction`, `Review`, `MaskRevision`, `ModelVersion`, `TrainingRun`, `EvaluationRun`. Prediction JSON minimum: `inspection_id`, `model_version`, `image_score`, `image_decision`, `anomaly_map_uri`, `predicted_mask_uri`, `suggested_class`, `is_verified`, `threshold`, `inference_ms`. Mask edits must store a binary original-coordinate raster (not only SVG browser coordinates).

**Versioning rule:** model version = encoder identifier + adaptation checkpoint checksum + feature bank version + preprocessing config + calibration threshold. Reproduce an individual displayed prediction from these inputs.

## 8. Experimental protocol — core differentiation

**Question:** On a fully untouched set of industrial images, does learning from verified human corrections reduce missed defects without creating unacceptable extra false alarms?

**Hypotheses:** H1: at a fixed predefined false-positive operating point, patch-classifier adaptation increases defective-image recall. H2: corrected mask training increases anomaly-region quality (Dice / pixel AUROC or AU-PRO where suitable). H3: an active review queue may yield more lift per corrected image than random review, but this is stretch.

**Primary comparison:** v0 = frozen DINOv3 normal-feature baseline; v1 = same encoder and initial bank + supervised adaptation using K reviewed feedback images. Same holdout images, preprocessing, threshold-selection rules and evaluation code. Keep K fixed and record class balance. A fair target is *a positive absolute improvement in defect recall at matched FPR*; no fabricated target guarantees. Report raw numerator/denominator and whether results have enough samples to be stable.

**Required evaluation:** image-level defect recall (TP / all true defective) and its complement, the missed-defect rate (FN / all true defective), normal-image FPR (FP / all true normal), precision/F1, AUROC if both classes exist, pixel-level IoU/Dice/AUROC on annotated regions, and latency per image. In defect screening, lead with **missed defects** and normal-item false alarms. Predefine a calibration-based decision threshold, and report test-set results once at final promotion. Use paired bootstrap over images for uncertainty where feasible; if the sample is small say estimates are exploratory. For videos, bootstrap/split by recording, not frame.

**Minimum experiments:** E0 baseline frozen-feature model. E1 +K inspector-corrected images. E2 control using K randomly selected labeled feedback images (if active selection is used). E3 optional SAM-on vs SAM-off ablation, measured separately from feedback learning. E4 optional Muse-assisted labels vs inspector labels for classification only. A 'human corrects prediction in UI' clip without a v1 model evaluation does **not** satisfy the learning claim.

**Data-leakage defenses:** deny holdout IDs to the annotation picker; write immutable `splits.json` with hash; do not read holdout masks during model design; do not select thresholds or examples from final scores; de-duplicate by content hash/perceptual hash and source group; never mix sibling frames from Mendeley video across splits. Show aggregate before/after results even when no improvement occurs.

**Interpretation guardrail:** improvement within one image category does not prove cross-factory reliability; a 10-day hackathon prototype is not a certified production QA solution.

## 9. Team ownership and operating cadence

| Owner | Primary responsibility | Integration contract |
| --- | --- | --- |
| **Engineer A — Tech Lead (you)** | PRD, experiment rules, architecture, data split freeze, reviewer for metrics, API contracts, integration and final story/demo | Own acceptance tests, holdout custody, model promotion decision and submission checklist |
| **Engineer B — ML/Computer Vision** | DINOv3 baseline, anomaly map/mask scoring, adaptation training, SAM experiment, evaluation scripts | `predict(image, model_version) -> map + mask + score`; versioned training artifacts |
| **Engineer C — Full-Stack/Product** | Four-panel dashboard, mask editor, inspector feedback, API/data persistence, experiment comparison visuals | Corrected original-resolution mask and review events; no hardcoded metrics |

**Daily integration:** 15-minute check-in; one protected `main` branch with feature branches/PR reviews; make every milestone demoable end-to-end. Engineer A can support backend glue and tackle risks instead of becoming a bottleneck. Freeze and review API and evaluation JSON schemas on day 1.

## 10. Hackathon implementation schedule

| Date (2026) | Team milestone | Gate for moving forward |
| --- | --- | --- |
| **Oct 24–25 (planning)** | Finalize PRD, licenses/rules checklist, interface definitions; create tasks | No hackathon-build timing assumptions until official rules reviewed |
| **Oct 26 (Day 1)** | Confirm eligibility/team/track; repo skeleton, VisA ingestion, deterministic split, sample UI | One real image loads, split manifest committed |
| **Oct 27–28** | First actual DINO anomaly heatmap + pixel mask and API | Four panels work against real scores; GT only on labeled samples |
| **Oct 29–30** | Inspector correction editor, review store, API integration | Save/reload exact mask; error cases tested |
| **Oct 31–Nov 1** | Train adaptation v1 on approved corrections; compare on validation | Reproducible model update, no holdout leakage |
| **Nov 2** | Lock comparison rules; one untouched final holdout evaluation | Metric artifacts include denominators and configuration hash |
| **Nov 3** | SAM/Muse polish only if main loop passes; demo video and story | Successful v0 → correction → v1 → evaluation live or replayable |
| **Nov 4** | Regression testing, licensing/attribution, README, final submission | Two verified runnable paths, backup demo, submit before deadline |

**Suggested P0 ticket order:** dataset manifest; baseline inference contract; heatmap+overlay viewer; review mask save/reload; adaptation job; sealed evaluator; before/after dashboard; end-to-end demo. Don't put video/conveyor support on the critical path.

## 11. Risks, mitigations and stop/go decisions

| Risk | Consequence | Mitigation |
| --- | --- | --- |
| DINOv3 GPU/weights unavailable | Baseline delayed | Choose small frozen backbone; cache embeddings; support CPU demo or partner GPU; fall back to available frozen vision features but disclose change |
| SAM 3.1 fails on faint defects | Refinement worsens mask | Gate by measured improvement; preserve raw threshold map; allow direct manual drawing |
| LLM invents defect subtype | Misleading classification | Fixed vocabulary + `unknown`, human verification required; never use generated label as ground truth |
| Too few labeled feedback images | No credible improvement | Focus one category; report sample count/CIs; avoid exaggerated results |
| Test leakage / similar frames | Artificial performance lift | Freeze splits; enforce hashes and video grouping; make evaluator holdout-only |
| MVTec noncommercial conditions | Legal ambiguity | Use VisA as primary; seek permission or omit MVTec distribution/demos as needed |
| Model license terms (DINOv3 custom license, Meta API terms) | Redistribution or use restrictions on weights/outputs | Review terms before integration; don't commit weights; attribute models in README |
| Reference repo no code license | Unauthorized reuse | Clean implementation; link to reference instead of copying |
| Meta API access/quotas | Broken primary demo | Baseline and manual review work offline; optional integrations behind flags |
| Limited hackathon time | Incomplete experiment | Protect P0 learning proof; cut video, many categories, complex analytics first |

**Decision register (to close by 26 Oct):** category selection; final dataset-license check; model-license check (DINOv3 is released under Meta's custom DINOv3 License, not a standard OSS license; confirm SAM 3.1 / Muse Spark API terms); whether one team of three is eligible in chosen track; API availability/credits; exact evaluation set size; chosen v0 algorithm; mask editor library; deployment hosting. Verify official hackathon rules when published; site currently says rules are due before kickoff.

## 12. Demo storyboard and definition of done

**90–150s demo:** (1) choose an unseen labeled image in the inspector workflow and show the original; (2) generate real heatmap and provisional mask; (3) show a miss/oversegmentation and let inspector paint a correction; (4) save human approval and trigger explicit feedback adaptation; (5) switch to model v1; (6) open a *different, held-out* evaluation set and show raw v0/v1 changes in missed defects and false alarms; (7) show side-by-side mask comparison and system architecture. If the training job isn't fast enough live, replay a precomputed experiment while showing its IDs, logs and reproducible command.

**Done =** three engineers can clone the repo, run one documented reproducible baseline and one adaptation run (with necessary datasets/models obtained under appropriate terms); real heatmaps and binary masks align; human correction survives reload; v0/v1 versioning is immutable; evaluation excludes all feedback samples; the dashboard does not show invented results; the team can describe one failure mode and one limitation candidly.

**Narrative for judges:** “AI quality control isn't reliable because it never makes mistakes; it becomes more useful when inspectors can correct its mistakes and we can *measure* what happens next.”

## 13. Sources and verification log (24 Oct 2026)

- Official event and tracks: https://cerebralvalley.ai/e/meta-ai-developer-hackathon
- Meta Model API / SAM 3.1: https://dev.meta.ai/docs/sam/overview
- Meta Muse Spark image reasoning: https://dev.meta.ai/docs/image-understanding
- Meta DINOv3: https://ai.meta.com/blog/dinov3-self-supervised-vision-model/
- MVTec AD + noncommercial license: https://www.mvtec.com/research-teaching/datasets/mvtec-ad
- Mendeley conveyor set + CC BY 4.0: https://data.mendeley.com/datasets/s25x2bnshz/1
- VisA primary dataset + CC BY 4.0: https://registry.opendata.aws/visa/
- VisA original authors: https://github.com/amazon-science/spot-diff
- InspectFlow architectural reference and no-code-license note: https://github.com/longlivewama/inspectflow-ai

**Open issue:** the official hackathon site says full rules will be published before Oct 26. The team must read final rules before finalizing track/team/third-party materials. This document is a product/engineering plan, not a statement of eligibility or legal advice.
