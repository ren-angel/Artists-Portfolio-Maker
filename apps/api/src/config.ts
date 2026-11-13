import { z } from "zod";
import { defaults } from "@studio/shared";
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
      MAX_SITES: n(defaults.sites),
      MAX_PAGES: n(defaults.pages),
      MAX_ARTWORKS: n(defaults.artworks),
      MAX_STORAGE_BYTES: n(defaults.storage),
      MAX_UPLOAD_BYTES: n(defaults.upload),
    })
    .parse(source);
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
  return env;
}
export type Config = ReturnType<typeof config>;
