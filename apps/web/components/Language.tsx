"use client";
import type { Lang } from "../lib/copy";
export function Language({ lang }: { lang: Lang }) {
  const next = lang === "en" ? "pt-BR" : "en";
  return (
    <button
      className="language"
      lang={next}
      aria-label={next === "en" ? "Switch to English" : "Mudar para português"}
      onClick={() => {
        document.cookie =
          "studio_lang=" + next + "; Path=/; SameSite=Lax; Max-Age=31536000";
        location.reload();
      }}
    >
      {next === "en" ? "EN" : "PT"}
    </button>
  );
}
