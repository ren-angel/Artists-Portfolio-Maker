/* Server-side access to the private Fastify upstream. Used by server
   components, route handlers and the proxy; never shipped to the browser. */

/** Private API origin. next.config.mjs reads the same variable for /api rewrites. */
export const apiOrigin = () => process.env.API_INTERNAL_ORIGIN || "http://127.0.0.1:4000";

/** Headers for server-to-server calls. The token exempts them from the
    API's per-address rate limit, which they would otherwise all share. */
export const internalHeaders = () => ({ "x-internal-token": internalToken() });

let warned = false;
/** Shared secret for /internal routes (analytics hits, custom-domain lookups).
    Production has no fallback: the API rejects the development value. */
export function internalToken() {
  const token = process.env.INTERNAL_TOKEN;
  if (token) return token;
  if (process.env.NODE_ENV === "production") {
    if (!warned) {
      warned = true;
      console.error("INTERNAL_TOKEN is not set: custom domains and analytics cannot reach the API");
    }
    return "";
  }
  return "local-development-internal-token";
}
