import { headers } from "next/headers";
import { publicOrigin, published } from "../lib/server";
export const dynamic = "force-dynamic";
export default async function sitemap() {
  const handle = (await headers()).get("x-portfolio-host");
  if (!handle)
    return [{ url: process.env.APP_ORIGIN || "http://localhost:3000" }];
  const { draft } = await published(handle);
  const base = publicOrigin(handle);
  return [
    ...draft.pages.map((p) => ({
      url: base + (p.id === draft.home ? "" : "/" + p.slug),
    })),
    ...draft.galleries.map((g) => ({ url: base + "/galleries/" + g.slug })),
  ];
}
