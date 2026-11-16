"use client";
import { useEffect, useRef, useState } from "react";
type ImagePage = {
  id: string;
  alt: string;
  thumb: string;
  master: string;
  width?: number;
  height?: number;
};
function variants(p: ImagePage) {
  if (!p.width || !p.height || Math.max(p.width, p.height) <= 800)
    return undefined;
  const thumbWidth = Math.max(
    1,
    Math.round((p.width * 800) / Math.max(p.width, p.height)),
  );
  return p.thumb + " " + thumbWidth + "w, " + p.master + " " + p.width + "w";
}
type Mode = "scroll" | "paged" | "rtl";
const windowSize = 8;

export function ComicReader({
  pages,
  storageKey,
  en,
}: {
  pages: ImagePage[];
  storageKey: string;
  en: boolean;
}) {
  const [mode, setMode] = useState<Mode>("scroll");
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const restore = useRef(false);
  const start =
    mode === "scroll" ? Math.floor(index / windowSize) * windowSize : index;
  const shown = pages.slice(
    start,
    start + (mode === "scroll" ? windowSize : 1),
  );
  useEffect(() => {
    try {
      const m = localStorage.getItem("comic-mode");
      if (m === "paged" || m === "rtl") setMode(m);
      const saved = localStorage.getItem(storageKey);
      const pos = pages.findIndex((p) => p.id === saved);
      if (pos > 0) {
        setIndex(pos);
        restore.current = true;
      }
    } catch {
      /* Storage can be disabled in private browsing. */
    }
    setReady(true);
  }, [storageKey, pages]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem("comic-mode", mode);
      if (pages[index]) localStorage.setItem(storageKey, pages[index].id);
    } catch {
      /* Reading remains available. */
    }
  }, [ready, mode, index, storageKey, pages]);
  useEffect(() => {
    if (!ready || mode !== "scroll" || !root.current) return;
    if (restore.current) {
      root.current
        .querySelector('[data-position="' + index + '"]')
        ?.scrollIntoView({ block: "nearest" });
      restore.current = false;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];
        if (first) setIndex(Number(first.target.getAttribute("data-position")));
      },
      { rootMargin: "0px 0px -45% 0px" },
    );
    root.current
      .querySelectorAll("[data-position]")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // Observe once per rendered window. Scrolling within it updates the bookmark.
  }, [ready, mode, start]);
  useEffect(() => {
    const adjacent = pages[index + 1];
    if (
      !ready ||
      mode === "scroll" ||
      !adjacent ||
      (navigator as Navigator & { connection?: { saveData: boolean } })
        .connection?.saveData
    )
      return;
    const img = new Image();
    img.sizes = "(max-width: 800px) 100vw, 800px";
    img.srcset = variants(adjacent) ?? "";
    img.src = adjacent.master;
  }, [index, mode, pages, ready]);
  const move = (delta: number) => {
    const next = Math.min(pages.length - 1, Math.max(0, index + delta));
    setIndex(next);
    if (mode === "scroll") {
      const panel = root.current?.querySelector(
        '[data-position="' + next + '"]',
      );
      if (panel) panel.scrollIntoView({ block: "start" });
      else restore.current = true;
    } else root.current?.scrollIntoView({ block: "start" });
  };
  if (!pages.length)
    return <p>{en ? "No pages yet." : "Ainda não há páginas."}</p>;
  const controls = (
    <div className="reader-controls">
      <button
        disabled={mode === "scroll" ? start === 0 : index === 0}
        onClick={() => move(mode === "scroll" ? -windowSize : -1)}
      >
        {en ? "Previous" : "Anterior"}
      </button>
      <span aria-live="polite">
        {index + 1} / {pages.length}
      </span>
      <button
        disabled={
          mode === "scroll"
            ? start + windowSize >= pages.length
            : index === pages.length - 1
        }
        onClick={() => move(mode === "scroll" ? start + windowSize - index : 1)}
      >
        {en ? "Next" : "Próxima"}
      </button>
    </div>
  );
  return (
    <div
      ref={root}
      tabIndex={0}
      aria-label={en ? "Comic reader" : "Leitor de quadrinhos"}
      onKeyDown={(e) => {
        if (
          (e.target as HTMLElement).closest("select,button") ||
          !["ArrowLeft", "ArrowRight"].includes(e.key)
        )
          return;
        e.preventDefault();
        move((e.key === "ArrowRight" ? 1 : -1) * (mode === "rtl" ? -1 : 1));
      }}
    >
      <label>
        {en ? "Reading mode" : "Modo de leitura"}{" "}
        <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
          <option value="scroll">
            {en ? "Vertical scroll" : "Rolagem vertical"}
          </option>
          <option value="paged">
            {en ? "Page by page" : "Página a página"}
          </option>
          <option value="rtl">
            {en ? "Right to left" : "Direita para esquerda"}
          </option>
        </select>
      </label>
      {controls}
      {shown.map((p, i) => (
        <img
          key={p.id}
          data-position={start + i}
          className="reader-image"
          alt={p.alt}
          src={p.master}
          width={p.width}
          height={p.height}
          srcSet={variants(p)}
          sizes="(max-width: 800px) 100vw, 800px"
          decoding="async"
          loading={i === 0 ? "eager" : "lazy"}
        />
      ))}
      {controls}
    </div>
  );
}
