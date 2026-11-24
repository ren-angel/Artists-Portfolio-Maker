import { z } from "zod";
import { defaults, priceBook } from "@doodallery/shared";
export function config(source = process.env) {
  const n = (fallback: number) =>
    z.coerce.number().int().positive().default(fallback);
  const env = z
    .object({
      NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
      DATABASE_URL: z.string().url(),
      APP_ORIGIN: z.string().url(),
      PLATFORM_DOMAIN: z.string().regex(/^[a-z0-9.-]+$/),
      PORT: n(4000),
      HOST: z.string().default("127.0.0.1"),
      // Comma-separated addresses or CIDRs of trusted reverse proxies (for
      // example the co-located web server: 127.0.0.1,::1). Client addresses
      // for rate limits then come from X-Forwarded-For. Empty: socket address.
      TRUST_PROXY: z.string().default(""),
      LOCAL_DATA_DIR: z.string().default("../../.local"),
      STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
      S3_ENDPOINT: z.string().url().optional(),
      S3_BUCKET: z.string().optional(),
      S3_REGION: z.string().default("auto"),
      S3_ACCESS_KEY_ID: z.string().optional(),
      S3_SECRET_ACCESS_KEY: z.string().optional(),
      MAIL_DRIVER: z.enum(["file", "resend"]).default("file"),
      MAIL_FROM: z.string().optional(),
      RESEND_API_KEY: z.string().optional(),
      CREATIVE_TOOLS: z.enum(["on","off"]).default(source.NODE_ENV === "production" ? "off" : "on"),
      CHAPTERS_PER_PLAN_PAGE: n(2),
      MAX_SITES: n(defaults.sites),
      MAX_PAGES: n(defaults.pages),
      MAX_ARTWORKS: n(defaults.artworks),
      MAX_STORAGE_BYTES: n(defaults.storage),
      MAX_UPLOAD_BYTES: n(defaults.upload),
      BILLING_DRIVER: z.enum(["mock", "asaas"]).default("mock"),
      ASAAS_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
      ASAAS_API_KEY: z.string().optional(),
      // Shared secret Asaas sends in asaas-access-token (32 to 255 characters).
      BILLING_WEBHOOK_TOKEN: z
        .string()
        .min(32)
        .max(255)
        .regex(/^\S+$/)
        .default("local-development-webhook-token-0000000000"),
      PLAN_PRICES: z.string().optional(),
      // Secret shared by the web server for analytics and domain lookups.
      INTERNAL_TOKEN: z.string().min(24).default("local-development-internal-token"),
      // Hostname artists point their CNAME at; apex domains use DOMAIN_TARGET_IP.
      DOMAIN_TARGET: z.string().optional(),
      DOMAIN_TARGET_IP: z.string().optional(),
      DOMAIN_TLS_CHECK: z.enum(["probe", "off"]).default("probe"),
      ANALYTICS_RETENTION_DAYS: n(400),
    })
    .parse(source);
  const prices = priceBook(env.PLAN_PRICES);
  if (new URL(env.APP_ORIGIN).origin !== env.APP_ORIGIN)
    throw Error("APP_ORIGIN must be an exact origin");
  if (
    env.NODE_ENV === "production" &&
    (!env.APP_ORIGIN.startsWith("https://") ||
      env.MAIL_DRIVER === "file" ||
      env.STORAGE_DRIVER === "local")
  )
    throw Error("Production requires HTTPS, transactional mail and S3 storage");
  if (
    env.STORAGE_DRIVER === "s3" &&
    !(
      env.S3_BUCKET &&
      env.S3_ACCESS_KEY_ID &&
      env.S3_SECRET_ACCESS_KEY &&
      env.S3_ENDPOINT
    )
  )
    throw Error("Incomplete storage settings");
  if (env.MAIL_DRIVER === "resend" && !(env.MAIL_FROM && env.RESEND_API_KEY))
    throw Error("Incomplete mail settings");
  if (env.BILLING_DRIVER === "asaas" && !env.ASAAS_API_KEY)
    throw Error("ASAAS_API_KEY is required for the Asaas billing driver");
  if (
    env.NODE_ENV === "production" &&
    (env.BILLING_DRIVER !== "asaas" ||
      env.BILLING_WEBHOOK_TOKEN.startsWith("local-") ||
      env.INTERNAL_TOKEN.startsWith("local-"))
  )
    throw Error(
      "Production requires the Asaas billing driver and private webhook and internal tokens",
    );
  const trustedProxies = env.TRUST_PROXY.split(",").map((s) => s.trim()).filter(Boolean);
  return { ...env, prices, trustedProxies };
}
export type Config = ReturnType<typeof config>;
