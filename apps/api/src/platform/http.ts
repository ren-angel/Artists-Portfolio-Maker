import type { FastifyInstance, FastifyRequest } from "fastify";
import { timingSafeEqual } from "node:crypto";
import { ZodError, z } from "zod";
import type { Config } from "./config.ts";
import { Fault, assert } from "./errors.ts";

/* Cross-cutting HTTP policy shared by every module: response headers, the
   browser origin check for mutations and stable error codes. */

/** Paths that authenticate with their own secret instead of the browser origin. */
const SELF_AUTHENTICATED = ["/billing/webhooks/", "/internal/"];

export function registerHttpPolicy(app: FastifyInstance, env: Config) {
  app.addHook("onRequest", async (req, reply) => {
    reply
      .header("Cache-Control", "private, no-store")
      .header("X-Content-Type-Options", "nosniff")
      .header("Referrer-Policy", "no-referrer");
    const url = req.url.split("?")[0];
    if (SELF_AUTHENTICATED.some((prefix) => url.startsWith(prefix))) return;
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      (req.headers.origin !== env.APP_ORIGIN ||
        req.headers["x-doodallery-request"] !== "1")
    )
      throw new Fault(403, "invalid_origin");
  });
  app.setErrorHandler(
    (err: Error & { code?: string; statusCode?: number }, req, reply) => {
      const { status, code } = classify(err);
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
}

/** Maps any thrown value to a public status and stable code without internals. */
export function classify(err: Error & { code?: string; statusCode?: number }) {
  const duplicate =
    err.code === "23505" || (err.cause as { code?: string })?.code === "23505";
  if (err instanceof Fault) return { status: err.status, code: err.code };
  if (err instanceof ZodError) return { status: 400, code: "invalid_input" };
  if (duplicate) return { status: 409, code: "already_exists" };
  const status = err.statusCode ?? 500;
  const code =
    status === 429
      ? "rate_limit"
      : status === 413
        ? "upload_size"
        : "request_failed";
  return { status, code };
}

/** Whether the request carries the web server's shared secret (constant-time comparison). */
export function hasInternalToken(req: FastifyRequest, env: Config) {
  const given = Buffer.from(String(req.headers["x-internal-token"] ?? ""));
  const expected = Buffer.from(env.INTERNAL_TOKEN);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Requires the web server's shared secret. */
export function requireInternal(req: FastifyRequest, env: Config) {
  assert(hasInternalToken(req, env), 401, "unauthorized");
}

/** The `:site` route parameter as a validated UUID. */
export const siteId = (req: FastifyRequest) =>
  z.object({ site: z.uuid() }).parse(req.params).site;
