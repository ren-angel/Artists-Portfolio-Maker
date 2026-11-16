import Fastify, { LogController } from "fastify";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { connect, sql } from "@studio/db";
import { config, type Config } from "./platform/config.ts";
import { hasInternalToken, registerHttpPolicy } from "./platform/http.ts";
import { authRoutes } from "./modules/identity/index.ts";
import { complianceRoutes } from "./modules/compliance/index.ts";
import { siteRoutes, editorRoutes } from "./modules/portfolio/index.ts";
import { discoveryRoutes } from "./modules/discovery/index.ts";
import { mediaRoutes, prune, storage } from "./modules/media/index.ts";
import { productRoutes } from "./modules/products/index.ts";
import { billingRoutes, endAll, provider as billingProvider, type BillingProvider } from "./modules/billing/index.ts";
import { domainRoutes, realNetwork, type Network } from "./modules/domains/index.ts";
import { analyticsRoutes } from "./modules/analytics/index.ts";
import { adminRoutes } from "./modules/administration/index.ts";

/* Composition root: builds adapters from configuration and registers each
   bounded context's routes. Modules communicate only through their index.ts. */

export async function createApp(
  env: Config = config(),
  billing: BillingProvider = billingProvider(env),
  network: Network = realNetwork,
) {
  const { pool, db } = connect(env.DATABASE_URL);
  const app = Fastify({
    logger: env.NODE_ENV !== "test",
    // Request bodies, cookies and tokens are never logged; failures log codes only.
    logController: new LogController({ disableRequestLogging: true }),
    // Behind trusted proxies the client address comes from X-Forwarded-For.
    trustProxy: env.trustedProxies.length ? env.trustedProxies : false,
    bodyLimit: 2 * 1024 ** 2,
  });
  app.addHook("onClose", () => pool.end());
  await app.register(cookie);
  await app.register(rateLimit, {
    max: 900,
    timeWindow: "1 minute",
    // Server-to-server calls from the web app (public SSR, analytics, catalog)
    // share one address; they authenticate with the internal token instead.
    allowList: (req) => hasInternalToken(req, env),
  });
  registerHttpPolicy(app, env);

  const store = storage(env);
  authRoutes(app, db, env, {
    beforeDelete: (id) => endAll(db, billing, id),
    releaseAssets: prune,
  });
  complianceRoutes(app, db, env);
  siteRoutes(app, db, env);
  editorRoutes(app, db, env);
  discoveryRoutes(app, db, env);
  mediaRoutes(app, db, env, store);
  productRoutes(app, db, env, store);
  billingRoutes(app, db, env, billing);
  domainRoutes(app, db, env, network);
  analyticsRoutes(app, db, env);
  adminRoutes(app, db, env, billing);

  app.get("/health", async (_req, reply) => {
    try {
      // Parse the columns required by the current draft and commercial routes.
      // LIMIT 0 checks compatibility even on an empty portfolio database.
      await db.execute(sql`select s.discoverable,a.details,b.period_end
        from sites s, artworks a, subscriptions b, creative_pages c, product_assets f limit 0`);
      return { ok: true, billing: billing.name, live: billing.live };
    } catch {
      return reply.code(503).send({ ok: false });
    }
  });
  return app;
}
