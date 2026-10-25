# Local sample images

This folder is **gitignored** except for this README and `manifest.example.json`.
Dataset images are not redistributed in this repository, so each developer adds their own.

The Inspect page lists everything in `manifest.json` as an **Illustrative sample**.
These images are labelled that way in the UI and are never presented as DefoLoop inference.

## Layout

```text
public/samples/
├── manifest.json
└── metal_nut_scratch_000/
    ├── image.png          # required: the product image
    ├── gt.png             # optional: benchmark mask (white = defect)
    ├── anomaly_map.png    # optional: grayscale anomaly map, 0..255 = score 0..1
    └── pred_mask.png      # optional: binary predicted mask
```

Masks and maps are resampled to the image's resolution when loaded.

## manifest.json

Copy `manifest.example.json` to `manifest.json` and edit it. Fields:

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | yes | Short name shown in the picker |
| `image` | yes | Path relative to this folder |
| `gt_mask` | no | Benchmark ground-truth mask. Leave it out if the dataset doesn't have one. |
| `anomaly_map`, `pred_mask` | no | Precomputed outputs, e.g. from an offline reference run |
| `precomputed_by` | if maps given | Who produced the maps (shown in the UI) |
| `threshold` | no | Default threshold for the anomaly map (0..1) |
| `label` | no | Short defect label |
| `dataset`, `license` | yes | Source attribution, e.g. `VisA pcb1`, `CC BY 4.0` |

## Where to get images

- **VisA** (CC BY 4.0, primary): https://github.com/amazon-science/spot-diff. Use one `pcb*` image and its mask from `Data/Masks/Anomaly`.
- **MVTec AD** `metal_nut` (CC BY-NC-SA 4.0, **noncommercial**): https://www.mvtec.com/research-teaching/datasets/mvtec-ad. Use `test/<defect>/NNN.png` and `ground_truth/<defect>/NNN_mask.png`.
