"use client";
import { useState } from "react";
export function VideoEmbed({
  id,
  title,
  en,
}: {
  id: string;
  title: string;
  en: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="creative-video">
      {loaded ? (
        <iframe
          title={title || "YouTube"}
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          src={"https://www.youtube-nocookie.com/embed/" + id}
        />
      ) : (
        <button onClick={() => setLoaded(true)}>
          {en ? "Load YouTube player" : "Carregar player do YouTube"}
        </button>
      )}
      <a
        href={"https://www.youtube.com/watch?v=" + id}
        rel="external noreferrer"
      >
        {en ? "Watch on YouTube" : "Assistir no YouTube"} ↗
      </a>
    </div>
  );
}
