# DefoLoop web UI

Next.js inspection workspace: a four-panel inspection view, a mask correction editor, the review queue, and the Learning Impact page.

## Run

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # production build
pnpm lint
```

## Data source

- **No `NEXT_PUBLIC_API_URL`** (default): a local demo store in the browser (IndexedDB). Uploads, reviews and mask revisions persist across reloads. There is **no model**: "Run model" reports that none is connected, and the anomaly and segmentation panels stay empty.
- **`NEXT_PUBLIC_API_URL=http://localhost:8000`**: the FastAPI backend, using the endpoints in [`docs/prd.md` §7](../docs/prd.md#7-minimal-api-and-data-contracts). The client is in `lib/api/http.ts`, and its types are in `lib/api/types.ts`.

Optional sample images go in `public/samples/` (gitignored). See [`public/samples/README.md`](public/samples/README.md).

## Honesty rules the UI enforces

- Ground truth comes only from a benchmark mask or an inspector-verified revision. It is never synthesised.
- Every image layer carries a provenance tag: model output (provisional), illustrative sample, benchmark, or human verified.
- Learning Impact shows metrics only from a backend evaluation run on the sealed holdout. Until one exists, it shows an empty state.

## Keyboard shortcuts

| Inspection | | Mask review | |
| --- | --- | --- | --- |
| `A` | Approve prediction | `B` / `E` / `P` / `H` | Brush / eraser / polygon / pan |
| `C` | Correct mask | `[` `]` | Brush size |
| `N` | Mark normal | Hold `Space` | Pan |
| `V` | Cycle visualization | `⌘Z` / `⇧⌘Z` | Undo / redo |
| `1`–`4`, `Esc` | Enlarge panel / back | `Enter` / `Esc` | Close / cancel polygon (`Alt` subtracts) |
| `I` | Details | `R` | Toggle model prediction |
| `+` `-` `0` | Zoom / fit | `⌘S` | Save correction |

The mouse wheel zooms at the cursor, and all four inspection panels share one viewport. Pen pressure scales the brush.
