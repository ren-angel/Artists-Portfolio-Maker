import { NextRequest, NextResponse } from "next/server";
import { tenantFromHost } from "@studio/shared";
export function proxy(req: NextRequest) {
  const domain = process.env.PLATFORM_DOMAIN ?? "localhost";
  const host = req.headers.get("host")?.toLowerCase() ?? "";
  const tenant = tenantFromHost(host, domain);
  const name = host.replace(/:\d+$/, "");
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
  const csp = `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' ${uploadOrigin} ${process.env.NODE_ENV === "development" ? "ws:" : ""}; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`;
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
    if (/^\/(?:api|site|studio|auth|preview|report|demo)(?:\/|$)/.test(path))
      return new NextResponse(null, { status: 404 });
    const target = req.nextUrl.clone();
    target.pathname = "/site/" + tenant + (path === "/" ? "" : path);
    result = NextResponse.rewrite(target, { request: { headers } });
  } else if (
    main &&
    /^\/(auth|studio|preview|report)(\/|$)/.test(path) &&
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
  if (/^\/(auth|studio|preview)(\/|$)/.test(path))
    result.headers.set("X-Robots-Tag", "noindex, nofollow");
  return result;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|prints/).*)"],
};
