import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { first, sql, type Database, type Tx } from "@studio/db";
import { account } from "../../identity/index.ts";
import type { Config } from "../../../platform/config.ts";
import { assert } from "../../../platform/errors.ts";
import { owned } from "../../tenancy/index.ts";
import { entitlement } from "../../entitlements/index.ts";
import { assertFitsStorage, optimize, usage, type Storage } from "../../media/index.ts";
import { token, digest } from "../../../platform/crypto.ts";

const ids = z.object({ site: z.uuid(), page: z.uuid() });
const liveProduct = (site: unknown, page: unknown) => sql`exists (
  select from sites s join users u on u.id=s.owner_id
  join revisions r on (r.site_id,r.id)=(s.id,s.published_id),
  lateral jsonb_array_elements(r.snapshot->'pages') p
  where s.id=${site} and u.restricted_at is null and p->>'id'=${page}::text
    and p->'creative'->>'kind'='product' and p->'creative'->'sale'->>'available'='true'
)`;
export function productRoutes(
  app: FastifyInstance,
  db: Database,
  env: Config,
  store: Storage,
) {
  const base = "/sites/:site/products/:page/file";
  async function check(tx: Tx, site: string, page: string, user: string) {
    await owned(tx, site, user);
    assert(
      await first(
        tx,
        sql`select from digital_products where site_id=${site} and page_id=${page}`,
      ),
      404,
      "not_found",
    );
  }
  app.get(base, async (req) => {
    const u = await account(db, req, env),
      { site, page } = ids.parse(req.params);
    return db.transaction(async (tx) => {
      await check(tx, site, page, u.id);
      return {
        file:
          (await first(
            tx,
            sql`select name,bytes from product_assets where site_id=${site} and page_id=${page}`,
          )) ?? null,
      };
    });
  });
  app.put(
    base,
    {
      bodyLimit: env.MAX_UPLOAD_BYTES,
      config: { rateLimit: { max: 15, timeWindow: "1 minute" } },
    },
    async (req) => {
      const u = await account(db, req, env),
        { site, page } = ids.parse(req.params);
      assert(
        env.CREATIVE_TOOLS === "on" && !u.restricted,
        403,
        "creative_disabled",
      );
      const source = req.body;
      assert(
        Buffer.isBuffer(source) && source.length <= env.MAX_UPLOAD_BYTES,
        415,
        "invalid_image",
      );
      const id = crypto.randomUUID(),
        key = "products/" + site + "/" + id;
      await db.transaction(async (tx) => {
        await check(tx, site, page, u.id);
        assert(
          (await entitlement(tx, env, u.id)).features.privateDownloads,
          403,
          "plan_required",
        );
        await tx.execute(sql`insert into garbage(object_key) values(${key})`);
      });
      return db.transaction(async (tx) => {
        await check(tx, site, page, u.id);
        const image = await optimize(source);
        const bytes = image.master.length;
        const { limits, features } = await entitlement(tx, env, u.id);
        assert(features.privateDownloads, 403, "plan_required");
        await tx.execute(
          sql`delete from product_assets where site_id=${site} and page_id=${page}`,
        );
        assertFitsStorage(await usage(tx, site), bytes, limits.storage);
        const name = "artwork-" + page.slice(0, 8) + ".webp";
        await store.put(key, image.master);
        await tx.execute(
          sql`insert into product_assets(site_id,page_id,id,bytes,name) values(${site},${page},${id},${bytes},${name})`,
        );
        await tx.execute(sql`delete from garbage where object_key=${key}`);
        return { file: { name, bytes } };
      });
    },
  );
  app.delete(base, async (req) => {
    const u = await account(db, req, env),
      { site, page } = ids.parse(req.params);
    return db.transaction(async (tx) => {
      await check(tx, site, page, u.id);
      await tx.execute(
        sql`delete from product_assets where site_id=${site} and page_id=${page}`,
      );
      return { ok: true };
    });
  });
  app.post(base + "/grant", async (req) => {
    const u = await account(db, req, env),
      { site, page } = ids.parse(req.params);
    assert(!u.restricted, 403, "account_restricted");
    const value = token();
    return db.transaction(async (tx) => {
      await check(tx, site, page, u.id);
      assert(
        (await entitlement(tx, env, u.id)).features.privateDownloads,
        403,
        "plan_required",
      );
      assert(
        await first(
          tx,
          sql`update product_assets set grant_digest=${digest(value)},grant_expires=now()+interval '5 minutes'
        where site_id=${site} and page_id=${page} and ${liveProduct(site, page)} returning id`,
        ),
        409,
        "publish_product_first",
      );
      return { url: env.APP_ORIGIN + "/api/downloads/" + value };
    });
  });
  app.get("/downloads/:token", async (req, reply) => {
    const value = z
      .object({ token: z.string().regex(/^[a-zA-Z0-9_-]{43}$/) })
      .parse(req.params).token;
    const f = await first<{
      site_id: string;
      id: string;
      name: string;
      bytes: number;
    }>(
      db,
      sql`select site_id,id,name,bytes from product_assets a
      where grant_digest=${digest(value)} and grant_expires>now() and ${liveProduct(sql`a.site_id`, sql`a.page_id`)}`,
    );
    assert(f, 404, "not_found");
    const data = await store.get("products/" + f.site_id + "/" + f.id, f.bytes);
    return reply
      .header("Cache-Control", "private, no-store")
      .header("Content-Disposition", 'attachment; filename="' + f.name + '"')
      .type("application/octet-stream")
      .send(data);
  });
}
