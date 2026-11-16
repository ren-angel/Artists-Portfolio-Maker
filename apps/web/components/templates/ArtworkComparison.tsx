"use client";
import { useState } from "react";
type Image = { src: string; alt: string };
export function ArtworkComparison({
  before,
  after,
  en,
}: {
  before: Image;
  after: Image;
  en: boolean;
}) {
  const [split, setSplit] = useState(50);
  return (
    <figure>
      <div className="creative-comparison">
        <img src={after.src} alt={after.alt} loading="lazy" />
        <img
          src={before.src}
          alt={before.alt}
          loading="lazy"
          style={{ clipPath: "inset(0 " + (100 - split) + "% 0 0)" }}
        />
      </div>
      <label>
        {en ? "Compare before and after" : "Comparar antes e depois"}
        <input
          className="block w-full"
          type="range"
          min={0}
          max={100}
          value={split}
          aria-valuetext={split + "% " + (en ? "before" : "antes")}
          onChange={(e) => setSplit(Number(e.target.value))}
        />
      </label>
      <figcaption>
        {en ? "Before" : "Antes"} · {before.alt} / {en ? "After" : "Depois"} ·{" "}
        {after.alt}
      </figcaption>
    </figure>
  );
}
