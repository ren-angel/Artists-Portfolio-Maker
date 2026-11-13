"use client";
import { useEffect, useRef, useState } from "react";
import type { Draft } from "@studio/shared";
import { Portfolio } from "../Portfolio";

/** Renders the real template at a device width, scaled to its container. */
export function ScaledPortfolio({
  draft,
  site,
  brand,
  width = 1280,
  className,
}: {
  draft: Draft;
  site: string;
  brand: string;
  width?: number;
  className?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState(0);
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setBox(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={frame} className={className} inert>
      {box > 0 && (
        <div style={{ width, zoom: Math.min(1, box / width) }}>
          <Portfolio draft={draft} site={site} brand={brand} base="/preview" />
        </div>
      )}
    </div>
  );
}
