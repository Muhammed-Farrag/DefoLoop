// Turbo colormap (Mikhailov, Google 2019): blue → red like the classic jet
// heatmap, but perceptually smoother. Polynomial approximation.

export function turbo(t: number): [number, number, number] {
  const x = Math.min(1, Math.max(0, t));
  const r =
    0.13572138 + x * (4.6153926 + x * (-42.66032258 + x * (132.13108234 + x * (-152.94239396 + x * 59.28637943))));
  const g =
    0.09140261 + x * (2.19418839 + x * (4.84296658 + x * (-14.18503333 + x * (4.27729857 + x * 2.82956604))));
  const b =
    0.1066733 + x * (12.64194608 + x * (-60.58204836 + x * (110.36276771 + x * (-89.90310912 + x * 27.34824973))));
  const c = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255);
  return [c(r), c(g), c(b)];
}

const LUT = Array.from({ length: 256 }, (_, i) => turbo(i / 255));

/** CSS gradient for legends. */
export const TURBO_GRADIENT = `linear-gradient(to right, ${Array.from(
  { length: 11 },
  (_, i) => `rgb(${turbo(i / 10).join(",")}) ${i * 10}%`,
).join(", ")})`;

/** Colours a normalised (0..255) score raster into an RGBA buffer. */
export function colorize(scores: Uint8ClampedArray | Uint8Array, out: Uint8ClampedArray) {
  for (let i = 0, j = 0; i < scores.length; i++, j += 4) {
    const [r, g, b] = LUT[scores[i]];
    out[j] = r;
    out[j + 1] = g;
    out[j + 2] = b;
    out[j + 3] = 255;
  }
}
