"use client";
import type { Lang } from "../lib/copy";
export function Language({
  lang,
  className = "language",
}: {
  lang: Lang;
  className?: string;
}) {
  const next = lang === "en" ? "pt-BR" : "en";
  return (
    <button
      type="button"
      className={className}
      lang={next}
      // The accessible name starts with the visible label (WCAG 2.5.3).
      aria-label={next === "en" ? "EN · Switch to English" : "PT · Mudar para português"}
      onClick={() => {
        document.cookie =
          "doodallery_lang=" + next + "; Path=/; SameSite=Lax; Max-Age=31536000";
        location.reload();
      }}
    >
      {next === "en" ? "EN" : "PT"}
    </button>
  );
}
