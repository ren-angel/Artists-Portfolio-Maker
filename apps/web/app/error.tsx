"use client";
import { useEffect, useState } from "react";
import { t, type Lang } from "../lib/copy";
import { Status } from "../components/ui/Status";
import "../components/ui/ui.css";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const [lang, setLang] = useState<Lang>("pt-BR");
  useEffect(() => {
    setLang(document.documentElement.lang === "en" ? "en" : "pt-BR");
  }, []);
  return (
    <Status
      code="Oops"
      title={t(lang, "request_failed")}
      back={t(lang, "back")}
      retry={t(lang, "retry")}
      onRetry={reset}
    />
  );
}
