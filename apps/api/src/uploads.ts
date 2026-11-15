import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { sql, first, type Database } from "@studio/db";
import type { Config } from "./config.ts";
import { account } from "./auth.ts";
import { owned, prune, usage } from "./drafts.ts";
import { entitlement } from "./plan.ts";
import { siteId } from "./sites.ts";
import { assert, Fault } from "./errors.ts";
import { optimize } from "./images.ts";
import type { Storage } from "./storage.ts";

export function mediaRoutes(
  app: FastifyInstance,
  db: Database,
  env: Config,
  store: Storage,
) {
  const params = z.object({ site: z.uuid(), id: z.uuid() });
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
    return db.transaction(async (tx) => {
      const s = await owned(tx, siteId(req), u.id);
      if (replacement)
        assert(
          await first(
            tx,
            sql`select id from artworks where site_id=${s.id} and id=${replacement}`,
          ),
          404,
          "art_missing",
        );
      assert(!u.restricted, 403, "account_restricted");
      const { limits } = await entitlement(tx, env, u.id);
      const used = await usage(tx, s.id);
      assert(
        replacement || Number(used.art) < limits.artworks,
        409,
        "art_limit",
      );
      assert(
        Number(used.bytes) + bytes <= limits.storage,
        409,
        "storage_limit",
      );
      const ticket = await first<{ id: string }>(
        tx,
        sql`insert into uploads(site_id,source_bytes,replacement) values(${s.id},${bytes},${replacement ?? null}) returning id`,
      );
      const id = ticket!.id;
      return {
        id,
        uploadUrl: store.signUpload
          ? await store.signUpload(s.id + "/" + id + "/staging", bytes)
          : null,
      };
    });
  });
  app.put(
    "/sites/:site/uploads/:id",
    { bodyLimit: env.MAX_UPLOAD_BYTES },
    async (req) => {
      const u = await account(db, req, env);
      const { site, id } = params.parse(req.params);
      const source = req.body;
      assert(Buffer.isBuffer(source), 415, "invalid_image");
      await db.transaction(async (tx) => {
        await owned(tx, site, u.id);
        const up = await first<{ source_bytes: number }>(
          tx,
          sql`select source_bytes from uploads where id=${id} and site_id=${site} and expires_at>now() for update`,
        );
        assert(up, 404, "upload_missing");
        assert(source.length === up.source_bytes, 400, "length_mismatch");
        await store.put(site + "/" + id + "/staging", source);
      });
      return { ok: true };
    },
  );
  app.delete("/sites/:site/uploads/:id", async (req) => {
    const u = await account(db, req, env);
    const { site, id } = params.parse(req.params);
    await db.transaction(async (tx) => {
      await owned(tx, site, u.id);
      await tx.execute(
        sql`delete from uploads where id=${id} and site_id=${site}`,
      );
    });
    return { ok: true };
  });
  app.post("/sites/:site/uploads/:id/finish", async (req) => {
    const u = await account(db, req, env);
    const { site, id } = params.parse(req.params);
    const { title } = z
      .object({ title: z.string().trim().min(1).max(120) })
      .parse(req.body);
    // Commit cleanup intent before any external writes. GC may claim these only after a grace period.
    const asset = crypto.randomUUID();
    const prefix = site + "/" + asset + "/";
    await db.transaction(async (tx) => {
      await owned(tx, site, u.id);
      assert(
        await first(
          tx,
          sql`select id from uploads where id=${id} and site_id=${site} and expires_at>now()`,
        ),
        404,
        "upload_missing",
      );
      await tx.execute(
        sql`insert into garbage(object_key) values(${prefix + "master.webp"}),(${prefix + "thumb.webp"})`,
      );
    });
    try {
      return await db.transaction(async (tx) => {
        await owned(tx, site, u.id);
        const up = await first<{
          source_bytes: number;
          replacement: string | null;
        }>(
          tx,
          sql`select * from uploads where id=${id} and site_id=${site} and expires_at>now() for update`,
        );
        assert(up, 404, "upload_missing");
        const source = await store.get(
          site + "/" + id + "/staging",
          up.source_bytes,
        );
        assert(
          source.length === up.source_bytes &&
            source.length <= env.MAX_UPLOAD_BYTES,
          400,
          "length_mismatch",
        );
        const image = await optimize(source);
        const bytes = image.master.length + image.thumb.length;
        const used = await usage(tx, site);
        const { limits } = await entitlement(tx, env, u.id);
        assert(
          Number(used.bytes) - up.source_bytes + bytes <= limits.storage,
          409,
          "storage_limit",
        );
        await store.put(prefix + "master.webp", image.master);
        await store.put(prefix + "thumb.webp", image.thumb);
        await tx.execute(
          sql`insert into assets(site_id,id,bytes,width,height,source_bytes,source_width,source_height) values(${site},${asset},${bytes},${image.width},${image.height},${source.length},${image.sourceWidth},${image.sourceHeight})`,
        );
        const artId = up.replacement ?? crypto.randomUUID();
        if (up.replacement) {
          assert(
            await first(
              tx,
              sql`update artworks set asset_id=${asset} where site_id=${site} and id=${artId} returning id`,
            ),
            404,
            "art_missing",
          );
        } else
          await tx.execute(
            sql`insert into artworks(site_id,id,asset_id,title,description,alt,featured,position) select ${site},${artId},${asset},${title},'','',false,coalesce(max(position),0)+1 from artworks where site_id=${site}`,
          );
        await tx.execute(sql`delete from uploads where id=${id}`);
        await tx.execute(
          sql`delete from garbage where object_key in (${prefix + "master.webp"},${prefix + "thumb.webp"})`,
        );
        await prune(tx, site);
        await tx.execute(
          sql`update sites set version=version+1 where id=${site}`,
        );
        return { artId, assetId: asset };
      });
    } catch (err) {
      await db.execute(
        sql`delete from uploads using sites s where uploads.site_id=s.id and s.owner_id=${u.id} and s.id=${site} and uploads.id=${id}`,
      );
      throw err;
    }
  });
  app.get("/media/:site/:id/:size", async (req, reply) => {
    const { site, id, size } = params
      .extend({ size: z.enum(["master", "thumb"]) })
      .parse(req.params);
    const live = await first(
      db,
      sql`select 1 from sites s join users u on u.id=s.owner_id and u.restricted_at is null join revision_assets r on r.site_id=s.id and r.revision_id=s.published_id where s.id=${site} and r.asset_id=${id}`,
    );
    if (!live) {
      const u = await account(db, req, env);
      assert(
        await first(
          db,
          sql`select a.id from assets a join sites s on s.id=a.site_id where s.owner_id=${u.id} and a.site_id=${site} and a.id=${id}`,
        ),
        404,
        "asset_missing",
      );
    }
    const etag = '"' + id + "-" + size + '"';
    const cache = live ? "public, max-age=0, must-revalidate" : "private, no-store";
    if (live && req.headers["if-none-match"] === etag)
      return reply.header("Cache-Control", cache).header("ETag", etag).code(304).send();

    let bytes: Buffer;
    try {
      bytes = await store.get(site + "/" + id + "/" + size + ".webp");
    } catch (error) {
      // Metadata still exists. A missing object can be restored independently.
      if (error instanceof Error && (("code" in error && error.code === "ENOENT") || error.name === "NoSuchKey"))
        throw new Fault(503, "media_unavailable");
      throw error;
    }
    return reply.header("Cache-Control", cache).header("ETag", etag).type("image/webp").send(bytes);
  });
}
