import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Database } from "@doodallery/db";
import { handle } from "@doodallery/shared";
import type { Config } from "../../../platform/config.ts";
import { requireInternal, siteId } from "../../../platform/http.ts";
import { account } from "../../identity/index.ts";
import { owned } from "../../tenancy/index.ts";
import { entitlement } from "../../entitlements/index.ts";
import { countedPath, isAutomated, referrerCategory, reportWindow } from "../domain/traffic.ts";
import { countHit, siteReport } from "../infrastructure/analytics-repository.ts";

export function analyticsRoutes(app: FastifyInstance, db: Database, env: Config) {
  // Called by the web server after rendering a public page.
  app.post("/internal/analytics/hit", async (req) => {
    requireInternal(req, env);
    const b = z
      .object({
        handle,
        kind: z.enum(["view", "click"]),
        path: z.string().max(300),
        referrer: z.string().max(253).optional(),
        country: z.string().regex(/^[A-Z]{2}$/).optional(),
        agent: z.string().max(400).default(""),
      })
      .parse(req.body);
    if (isAutomated(b.agent)) return { counted: false };
    const counted = await countHit(db, {
      handle: b.handle,
      kind: b.kind,
      path: countedPath(b.path),
      referrer: referrerCategory(b.referrer, [env.PLATFORM_DOMAIN, new URL(env.APP_ORIGIN).hostname]),
      country: b.country ?? "",
    });
    return { counted };
  });

  app.get("/sites/:site/analytics", async (req) => {
    const u = await account(db, req, env);
    const s = await db.transaction((tx) => owned(tx, siteId(req), u.id));
    const { features } = await entitlement(db, env, u.id);
    const advanced = features.analytics === "advanced";
    const requested = z.coerce.number().int().min(1).default(30).parse((req.query as { days?: string }).days);
    const { days, max } = reportWindow(advanced, requested);
    return siteReport(db, s.id, days, max, advanced);
  });
}
