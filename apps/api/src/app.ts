import Fastify from "fastify";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { ZodError } from "zod";
import { connect } from "@studio/db";
import { authRoutes } from "./auth.ts";
import { siteRoutes } from "./sites.ts";
import { mediaRoutes } from "./uploads.ts";
import { storage } from "./storage.ts";
import { config, type Config } from "./config.ts";
import { Fault } from "./errors.ts";

export async function createApp(env: Config = config()) {
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
          },
          "Request failed",
        );
      return reply.code(status).send({ error: code });
    },
  );
  authRoutes(app, db, env);
  siteRoutes(app, db, env);
  mediaRoutes(app, db, env, storage(env));
  app.get("/health", async () => ({ ok: true }));
  return app;
}
