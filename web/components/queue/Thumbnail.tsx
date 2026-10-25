"use client";

import { useResolvedUri } from "@/lib/hooks/useData";

export function Thumbnail({ uri, className = "" }: { uri: string; className?: string }) {
  const src = useResolvedUri(uri);
  return (
    <div className={`overflow-hidden bg-canvas ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />}
    </div>
  );
}
