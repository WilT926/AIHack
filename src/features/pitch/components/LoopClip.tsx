"use client";

import { useState, type ReactNode } from "react";

/**
 * A judge's looping clip: muted, looping, inline. If there is no clip or it
 * fails to load, the fallback (the pen drawing) shows instead.
 */
export function LoopClip({ src, className, fallback }: { src?: string | null; className?: string; fallback: ReactNode }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) return <>{fallback}</>;
  return (
    <video
      key={src}
      className={className}
      src={src}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      aria-hidden
      onError={() => setFailed(src)}
    />
  );
}
