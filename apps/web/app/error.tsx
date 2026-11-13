"use client";
import { t, type Lang } from "../lib/copy";
import { useEffect, useState } from "react";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const [lang, setLang] = useState<Lang>("pt-BR");
  useEffect(() => {
    setLang(document.documentElement.lang === "en" ? "en" : "pt-BR");
  }, []);
  return (
    <main className="narrow panel stack">
      <h1>{t(lang, "request_failed")}</h1>
      <button onClick={reset}>{t(lang, "retry")}</button>
    </main>
  );
}
