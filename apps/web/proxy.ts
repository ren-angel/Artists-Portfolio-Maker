import { NextRequest, NextResponse } from "next/server";
import { tenantFromHost } from "@studio/shared";
import { apiOrigin, internalHeaders } from "./shared/lib/internal-api";
// Cache misses briefly. Successful lookups must reflect the current tenant,
// subscription and certificate, including immediately after disconnection.
const missingDomains = new Map<string, number>();
async function customDomain(host: string) {
  if ((missingDomains.get(host) ?? 0) > Date.now()) return null;
  let handle: string | null = null;
  try {
    const r = await fetch(
      apiOrigin() +
        "/internal/domains/resolve?host=" +
        encodeURIComponent(host),
      {
        headers: internalHeaders(),
        signal: AbortSignal.timeout(2000),
        cache: "no-store",
      },
    );
    if (r.ok) handle = String((await r.json()).handle);
  } catch {
    // Unreachable API: answer 404 now and retry soon.
    return null;
  }
  if (!handle) {
    if (missingDomains.size >= 5000) missingDomains.clear();
    missingDomains.set(host, Date.now() + 5_000);
  }
  return handle;
}
export async function proxy(req: NextRequest) {
  const domain = process.env.PLATFORM_DOMAIN ?? "localhost";
  const host = req.headers.get("host")?.toLowerCase() ?? "";
  const name = host.replace(/:\d+$/, "");
  const platform = name === domain || name.endsWith("." + domain) || name === "127.0.0.1";
  const tenant =
    tenantFromHost(host, domain) ??
    (!platform && /^[a-z0-9.-]{4,253}$/.test(name) ? await customDomain(name) : null);
  const main =
    [domain, "www." + domain, "app." + domain].includes(name) ||
    (process.env.NODE_ENV !== "production" && name === "127.0.0.1");
  if (!main && !tenant) return new NextResponse(null, { status: 404 });
  const path = req.nextUrl.pathname;
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const uploadOrigin =
    !tenant && process.env.STORAGE_DRIVER === "s3" && process.env.S3_ENDPOINT
      ? new URL(process.env.S3_ENDPOINT).origin
      : "";
  const csp = `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' ${uploadOrigin} ${process.env.NODE_ENV === "development" ? "ws:" : ""}; frame-src https://www.youtube-nocookie.com; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`;
  const headers = new Headers(req.headers);
  headers.set("Content-Security-Policy", csp);
  headers.delete("x-portfolio-host");
  if (main && name === "app." + domain && path === "/")
    return NextResponse.redirect(new URL("/studio", process.env.APP_ORIGIN));
  if (tenant) headers.set("x-portfolio-host", tenant);
  let result: NextResponse;
  if (
    tenant &&
    !path.startsWith("/api/media/") &&
    !["/robots.txt", "/sitemap.xml", "/favicon.ico", "/icon.svg"].includes(path)
  ) {
    if (/^\/(?:api|site|studio|auth|preview|report|demo|admin|billing|pricing|legal)(?:\/|$)/.test(path))
      return new NextResponse(null, { status: 404 });
    const target = req.nextUrl.clone();
    target.pathname = "/site/" + tenant + (path === "/" ? "" : path);
    result = NextResponse.rewrite(target, { request: { headers } });
  } else if (
    main &&
    /^\/(auth|studio|preview|report|admin|billing)(\/|$)/.test(path) &&
    process.env.APP_ORIGIN &&
    new URL(process.env.APP_ORIGIN).host !== host
  ) {
    return NextResponse.redirect(
      new URL(path + req.nextUrl.search, process.env.APP_ORIGIN),
    );
  } else result = NextResponse.next({ request: { headers } });
  result.headers.set("Content-Security-Policy", csp);
  if (process.env.NODE_ENV === "production")
    result.headers.set("Strict-Transport-Security", "max-age=31536000");
  if (/^\/(auth|studio|preview|admin|billing)(\/|$)/.test(path))
    result.headers.set("X-Robots-Tag", "noindex, nofollow");
  return result;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|prints/).*)"],
};
