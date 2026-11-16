import { headers } from "next/headers";
import { publicOrigin } from "../shared/lib/server";
export const dynamic = "force-dynamic";
export default async function robots() {
  const h = (await headers()).get("x-portfolio-host");
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/media/"],
      disallow: ["/studio", "/preview", "/auth", "/api/", "/report"],
    },
    sitemap:
      (h
        ? publicOrigin(h)
        : process.env.APP_ORIGIN || "http://localhost:3000") + "/sitemap.xml",
  };
}
