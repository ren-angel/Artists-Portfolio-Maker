import { cookies, headers } from "next/headers";
import { cache } from "react";
import { notFound } from "next/navigation";
import { draftSchema } from "@studio/shared";
import type { Lang } from "./copy";
import { apiOrigin, internalHeaders } from "./internal-api";
export const brand = () => process.env.PLATFORM_NAME || "Doodallery";
export async function language(): Promise<Lang> {
  const saved = (await cookies()).get("studio_lang")?.value;
  if (saved === "en" || saved === "pt-BR") return saved;
  return (await headers())
    .get("accept-language")
    ?.split(",")[0]
    .toLowerCase()
    .startsWith("en")
    ? "en"
    : "pt-BR";
}
export const published = cache(async (handle: string, chapter = "index", series = "") => {
  const r = await fetch(
    apiOrigin() +
      "/public/" +
      encodeURIComponent(handle) + (chapter ? "?"+new URLSearchParams({chapter,series}) : ""),
    { cache: "no-store", headers: internalHeaders() },
  );
  if (r.status === 404 || r.status === 400) notFound();
  if (!r.ok) throw Error("Portfolio temporarily unavailable");
  const data = await r.json();
  return {
    id: String(data.id),
    revision: String(data.revision),
    indexable: data.indexable !== false,
    draft: draftSchema.parse(data.draft),
    branding: data.branding !== false,
    domain: (data.domain as string | null) ?? null,
  };
});


/** Records one aggregate view or click. Never blocks or fails a page. */
export async function recordHit(hit: {
  handle: string;
  kind: "view" | "click";
  path: string;
  referrer?: string;
  country?: string;
  agent: string;
}) {
  await fetch(apiOrigin() + "/internal/analytics/hit", {
    method: "POST",
    signal: AbortSignal.timeout(3000),
    headers: {
      "content-type": "application/json",
      ...internalHeaders(),
    },
    body: JSON.stringify(hit),
  }).catch(() => {});
}

/** Request facts used for analytics, reduced before they leave this server. */
export async function visit() {
  const h = await headers();
  const purpose = (h.get("purpose") || h.get("sec-purpose") || "") + (h.get("next-router-prefetch") ?? "");
  let referrer: string | undefined;
  try {
    referrer = new URL(h.get("referer") ?? "").hostname || undefined;
  } catch {
    referrer = undefined;
  }
  const countryHeader = process.env.ANALYTICS_COUNTRY_HEADER;
  const country = countryHeader ? h.get(countryHeader)?.toUpperCase() : undefined;
  return {
    prefetch: /prefetch|prerender|1/.test(purpose),
    referrer,
    country: country && /^[A-Z]{2}$/.test(country) ? country : undefined,
    agent: h.get("user-agent") ?? "",
  };
}
export function publicOrigin(handle: string, custom?: string | null) {
  if (custom) return "https://" + custom;
  const domain = process.env.PLATFORM_DOMAIN || "localhost";
  return domain === "localhost"
    ? (process.env.APP_ORIGIN || "http://localhost:3000") + "/site/" + handle
    : "https://" + handle + "." + domain;
}
