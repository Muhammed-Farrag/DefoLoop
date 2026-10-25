// Binary/scalar rasters at the original image resolution.

import { loadImage } from "../image";
import { colorize } from "../render/colormap";

export interface Raster {
  width: number;
  height: number;
  /** One byte per pixel (0..255). */
  data: Uint8Array;
}

/** Reads the first channel of a grayscale PNG (anomaly map or mask). */
export async function readRaster(src: string, width?: number, height?: number): Promise<Raster> {
  const img = await loadImage(src);
  const w = width ?? img.naturalWidth;
  const h = height ?? img.naturalHeight;
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, 0, 0, w, h);
  const rgba = ctx.getImageData(0, 0, w, h).data;
  const data = new Uint8Array(w * h);
  for (let i = 0, j = 0; i < data.length; i++, j += 4) {
    // Masks may be stored as RGB or as alpha; use the brightest signal.
    data[i] = rgba[j + 3] < 255 ? rgba[j + 3] : Math.max(rgba[j], rgba[j + 1], rgba[j + 2]);
  }
  return { width: w, height: h, data };
}

export function threshold(map: Raster, t: number): Raster {
  const cut = Math.round(t * 255);
  const data = new Uint8Array(map.data.length);
  for (let i = 0; i < data.length; i++) data[i] = map.data[i] >= cut ? 255 : 0;
  return { width: map.width, height: map.height, data };
}

export function countOn(mask: Raster) {
  let n = 0;
  for (let i = 0; i < mask.data.length; i++) if (mask.data[i] >= 128) n++;
  return n;
}

function toCanvas(width: number, height: number, fill: (px: Uint8ClampedArray) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(width, height);
  fill(img.data);
  ctx.putImageData(img, 0, 0);
  return canvas;
}

export function heatmapCanvas(map: Raster) {
  return toCanvas(map.width, map.height, (px) => colorize(map.data, px));
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Solid fill where mask is on, transparent elsewhere. */
export function fillCanvas(mask: Raster, color: string) {
  const [r, g, b] = hexToRgb(color);
  return toCanvas(mask.width, mask.height, (px) => {
    for (let i = 0, j = 0; i < mask.data.length; i++, j += 4) {
      if (mask.data[i] >= 128) {
        px[j] = r;
        px[j + 1] = g;
        px[j + 2] = b;
        px[j + 3] = 255;
      }
    }
  });
}

/** White-on-black binary view, as in benchmark figures. */
export function binaryCanvas(mask: Raster) {
  return toCanvas(mask.width, mask.height, (px) => {
    for (let i = 0, j = 0; i < mask.data.length; i++, j += 4) {
      const v = mask.data[i] >= 128 ? 255 : 0;
      px[j] = px[j + 1] = px[j + 2] = v;
      px[j + 3] = 255;
    }
  });
}

/** Mask boundary, thickened so it stays visible when the image is scaled down. */
export function outlineCanvas(mask: Raster, color: string) {
  const { width: w, height: h, data } = mask;
  const radius = Math.max(1, Math.round(Math.max(w, h) / 320));
  const edge = new Uint8Array(w * h);
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && data[y * w + x] >= 128;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (on(x, y) && (!on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1))) {
        edge[y * w + x] = 1;
      }
    }
  }
  const [r, g, b] = hexToRgb(color);
  return toCanvas(w, h, (px) => {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!edge[y * w + x]) continue;
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const xx = x + dx;
            const yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
            const j = (yy * w + xx) * 4;
            px[j] = r;
            px[j + 1] = g;
            px[j + 2] = b;
            px[j + 3] = 255;
          }
        }
      }
    }
  });
}

/** Encodes a binary mask as a grayscale-looking PNG (0 / 255) at full resolution. */
export async function encodeMaskPng(mask: Raster): Promise<Blob> {
  const canvas = binaryCanvas(mask);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG encode failed"))), "image/png"),
  );
}
