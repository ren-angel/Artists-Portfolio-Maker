import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Database } from "@doodallery/db";
import type { Config } from "../../../platform/config.ts";
import { assert } from "../../../platform/errors.ts";
import { siteId } from "../../../platform/http.ts";
import { account } from "../../identity/index.ts";
import { MEDIA_SIZES } from "../domain/quota.ts";
import { mediaService } from "../application/uploads.ts";
import type { Storage } from "../infrastructure/object-storage.ts";

export function mediaRoutes(
  app: FastifyInstance,
  db: Database,
  env: Config,
  store: Storage,
) {
  const params = z.object({ site: z.uuid(), id: z.uuid() });
  const media = mediaService(db, env, store);
  app.addContentTypeParser(
    "application/octet-stream",
    { parseAs: "buffer", bodyLimit: env.MAX_UPLOAD_BYTES },
    (_req, body, done) => done(null, body),
  );
  app.post("/sites/:site/uploads", async (req) => {
    const u = await account(db, req, env);
    const { bytes, replacement } = z
      .object({ bytes: z.int().positive(), replacement: z.uuid().optional() })
      .parse(req.body);
    assert(bytes <= env.MAX_UPLOAD_BYTES, 413, "upload_size");
    return media.reserve(u, siteId(req), bytes, replacement);
  });
  app.put(
    "/sites/:site/uploads/:id",
    { bodyLimit: env.MAX_UPLOAD_BYTES },
    async (req) => {
      const u = await account(db, req, env);
      const { site, id } = params.parse(req.params);
      const source = req.body;
      assert(Buffer.isBuffer(source), 415, "invalid_image");
      await media.receive(u, site, id, source);
      return { ok: true };
    },
  );
  app.delete("/sites/:site/uploads/:id", async (req) => {
    const u = await account(db, req, env);
    const { site, id } = params.parse(req.params);
    await media.cancel(u, site, id);
    return { ok: true };
  });
  app.post("/sites/:site/uploads/:id/finish", async (req) => {
    const u = await account(db, req, env);
    const { site, id } = params.parse(req.params);
    const { title } = z
      .object({ title: z.string().trim().min(1).max(120) })
      .parse(req.body);
    return media.finish(u, site, id, title);
  });
  app.get("/media/:site/:id/:size", async (req, reply) => {
    const { site, id, size } = params
      .extend({ size: z.enum(MEDIA_SIZES) })
      .parse(req.params);
    const live = await media.isPublic(site, id);
    if (!live) {
      const u = await account(db, req, env);
      assert(await media.isOwnedBy(u.id, site, id), 404, "asset_missing");
    }
    const etag = '"' + id + "-" + size + '"';
    const cache = live ? "public, max-age=0, must-revalidate" : "private, no-store";
    if (live && req.headers["if-none-match"] === etag)
      return reply.header("Cache-Control", cache).header("ETag", etag).code(304).send();
    const bytes = await media.read(site, id, size);
    return reply.header("Cache-Control", cache).header("ETag", etag).type("image/webp").send(bytes);
  });
}
