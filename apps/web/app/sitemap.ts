import { headers } from "next/headers";
import { publicOrigin, published } from "../lib/server";
export const dynamic = "force-dynamic";
export default async function sitemap() {
  const handle = (await headers()).get("x-portfolio-host");
  if (!handle)
    return ["", "/explore", "/templates", "/features", "/pricing"].map(path => ({ url: (process.env.APP_ORIGIN || "http://localhost:3000") + path }));
  const { draft, indexable } = await published(handle);
  if (!indexable) return [];
  const base = publicOrigin(handle);
  return [
    ...draft.pages.map((p) => ({
      url: base + (p.id === draft.home ? "" : "/" + p.slug),
    })),
    ...draft.pages.flatMap(p=>(p.creative?.chapters??[]).map(h=>({url:base+"/"+p.slug+"/chapters/"+h.id}))),
    ...draft.galleries.map((g) => ({ url: base + "/galleries/" + g.slug })),
  ];
}
