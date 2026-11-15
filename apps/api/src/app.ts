import Fastify from "fastify";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { ZodError } from "zod";
import { connect, sql } from "@studio/db";
import { authRoutes } from "./auth.ts";
import { siteRoutes } from "./sites.ts";
import { mediaRoutes } from "./uploads.ts";
import { storage } from "./storage.ts";
import { config, type Config } from "./config.ts";
import { Fault } from "./errors.ts";
import { provider as billingProvider } from "./billing/index.ts";
import { billingRoutes } from "./billing/routes.ts";
import type { BillingProvider } from "./billing/provider.ts";
import { domainRoutes, realNetwork, type Network } from "./domains.ts";
import { analyticsRoutes } from "./analytics.ts";
import { adminRoutes } from "./admin.ts";
import { accountRoutes } from "./account.ts";
import { endAll } from "./billing/service.ts";

export async function createApp(
  env: Config = config(),
  billing: BillingProvider = billingProvider(env),
  network: Network = realNetwork,
) {
  const { pool, db } = connect(env.DATABASE_URL);
  const app = Fastify({
    logger: env.NODE_ENV !== "test",
    disableRequestLogging: true,
    trustProxy: false,
    bodyLimit: 2 * 1024 ** 2,
  });
  app.addHook("onClose", () => pool.end());
  await app.register(cookie);
  await app.register(rateLimit, { max: 900, timeWindow: "1 minute" });
  app.addHook("onRequest", async (req, reply) => {
    reply
      .header("Cache-Control", "private, no-store")
      .header("X-Content-Type-Options", "nosniff")
      .header("Referrer-Policy", "no-referrer");
    // Provider webhooks and web-server internal calls authenticate with
    // their own secrets instead of the browser origin check.
    const url = req.url.split("?")[0];
    if (url.startsWith("/billing/webhooks/") || url.startsWith("/internal/")) return;
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      (req.headers.origin !== env.APP_ORIGIN ||
        req.headers["x-studio-request"] !== "1")
    )
      throw new Fault(403, "invalid_origin");
  });
  app.setErrorHandler(
    (err: Error & { code?: string; statusCode?: number }, req, reply) => {
      const duplicate =
        err.code === "23505" ||
        (err.cause as { code?: string })?.code === "23505";
      const status =
        err instanceof Fault
          ? err.status
          : err instanceof ZodError
            ? 400
            : duplicate
              ? 409
              : (err.statusCode ?? 500);
      const code =
        err instanceof Fault
          ? err.code
          : err instanceof ZodError
            ? "invalid_input"
            : duplicate
              ? "already_exists"
              : status === 429
                ? "rate_limit"
                : status === 413
                  ? "upload_size"
                  : "request_failed";
      if (status >= 500)
        req.log.error(
          {
            requestId: req.id,
            route: req.routeOptions.url,
            errorClass: err.name,
            // SQLSTATE and network codes are useful without logging SQL or values.
            causeCode: (err.cause as { code?: string })?.code ?? err.code,
          },
          "Request failed",
        );
      return reply.code(status).send({ error: code });
    },
  );
  authRoutes(app, db, env, { beforeDelete: (id) => endAll(db, billing, id) });
  siteRoutes(app, db, env);
  mediaRoutes(app, db, env, storage(env));
  billingRoutes(app, db, env, billing);
  domainRoutes(app, db, env, network);
  analyticsRoutes(app, db, env);
  adminRoutes(app, db, env, billing);
  accountRoutes(app, db, env);
  app.get("/health", async (_req, reply) => {
    try {
      // Parse the columns required by the current draft and commercial routes.
      // LIMIT 0 checks compatibility even on an empty portfolio database.
      await db.execute(sql`select s.discoverable,a.details,b.period_end
        from sites s, artworks a, subscriptions b limit 0`);
      return { ok: true, billing: billing.name, live: billing.live };
    } catch {
      return reply.code(503).send({ ok: false });
    }
  });
  return app;
}
