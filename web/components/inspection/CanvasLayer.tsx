"use client";

import { useEffect, useRef } from "react";

/** Draws a prepared canvas as an absolutely positioned image layer. */
export function CanvasLayer({ source, opacity = 1 }: { source: HTMLCanvasElement | null; opacity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !source) return;
    c.width = source.width;
    c.height = source.height;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(source, 0, 0);
  }, [source]);
  if (!source) return null;
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" style={{ opacity }} />;
}

export function ImageLayer({ src, alt }: { src: string | null; alt: string }) {
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} draggable={false} className="absolute inset-0 h-full w-full" />;
}
