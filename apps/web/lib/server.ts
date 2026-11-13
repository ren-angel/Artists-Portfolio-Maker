import { cookies, headers } from "next/headers";
import { cache } from "react";
import { notFound } from "next/navigation";
import { draftSchema } from "@studio/shared";
import type { Lang } from "./copy";
export const brand = () => process.env.PLATFORM_NAME || "Artist Studio";
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
export const published = cache(async (handle: string) => {
  const r = await fetch(
    (process.env.API_INTERNAL_ORIGIN || "http://127.0.0.1:4000") +
      "/public/" +
      encodeURIComponent(handle),
    { cache: "no-store" },
  );
  if (r.status === 404 || r.status === 400) notFound();
  if (!r.ok) throw Error("Portfolio temporarily unavailable");
  const data = await r.json();
  return {
    id: String(data.id),
    revision: String(data.revision),
    draft: draftSchema.parse(data.draft),
  };
});
export function publicOrigin(handle: string) {
  const domain = process.env.PLATFORM_DOMAIN || "localhost";
  return domain === "localhost"
    ? (process.env.APP_ORIGIN || "http://localhost:3000") + "/site/" + handle
    : "https://" + handle + "." + domain;
}
