import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { sql, first, rows, type Database } from "@studio/db";
import {
  initialDraft,
  draftSchema,
  handle,
  publishable,
  entitle,
  plans,
  type PlanId,
} from "@studio/shared";
import { account } from "./auth.ts";
import type { Config } from "./config.ts";
import { assert } from "./errors.ts";
import { owned, readDraft, writeDraft, prune, usage } from "./drafts.ts";
import { entitlement, limits as planLimits, planSql } from "./plan.ts";

export const siteId = (req: FastifyRequest) =>
  z.object({ site: z.uuid() }).parse(req.params).site;
export function siteRoutes(app: FastifyInstance, db: Database, env: Config) {
  app.get("/sites", async (req) => {
    const u = await account(db, req, env);
    return {
      sites: await rows(
        db,
        sql`select id,handle,title from sites where owner_id=${u.id} order by created_at`,
      ),
      ...(await entitlement(db, env, u.id)),
    };
  });
  app.post("/sites", async (req) => {
    const u = await account(db, req, env);
    const b = z
      .object({
        handle,
        title: z.string().trim().min(1).max(120),
        language: z.enum(["pt-BR", "en"]).default("pt-BR"),
      })
      .parse(req.body);
    return db.transaction(async (tx) => {
      await tx.execute(sql`select id from users where id=${u.id} for update`);
      const count = await first<{ n: number }>(
        tx,
        sql`select count(*)::int n from sites where owner_id=${u.id}`,
      );
      assert(count!.n < planLimits(env, "free").sites, 409, "site_limit");
      const d = initialDraft(b.title, b.language);
      const s = await first<{ id: string }>(
        tx,
        sql`insert into sites(owner_id,handle,title,home) values(${u.id},${b.handle},${b.title},${d.home}) returning id`,
      );
      await writeDraft(tx, s!.id, d);
      return { id: s!.id };
    });
  });
  app.get("/sites/:site", async (req) => {
    const u = await account(db, req, env);
    return db.transaction(async (tx) => {
      const s = await owned(tx, siteId(req), u.id);
      const rev = await first<{ publishedAt: string }>(
        tx,
        sql`select created_at as "publishedAt" from revisions where site_id=${s.id} and id=${s.published_id}`,
      );
      return {
        id: s.id,
        handle: s.handle,
        version: s.version,
        published: s.published_id,
        publishedAt: rev?.publishedAt ?? null,
        storageUsed: Number((await usage(tx, s.id)).bytes),
        draft: await readDraft(tx, s),
      };
    });
  });
  app.put("/sites/:site", async (req) => {
    const u = await account(db, req, env);
    const { version, draft } = z
      .object({ version: z.int().positive(), draft: draftSchema })
      .parse(req.body);
    return db.transaction(async (tx) => {
      const s = await owned(tx, siteId(req), u.id);
      assert(version === s.version, 409, "conflict");
      // A downgrade never locks editing: an over-limit site may keep or
      // reduce its pages, but cannot add more until it is within the plan.
      const { limits } = await entitlement(tx, env, u.id);
      const before = await first<{ n: number }>(
        tx,
        sql`select count(*)::int as n from pages where site_id=${s.id}`,
      );
      assert(
        draft.pages.length - 1 <= limits.pages ||
          draft.pages.length <= before!.n,
        409,
        "page_limit",
      );
      const old = await rows<{ id: string; asset: string }>(
        tx,
        sql`select id,asset_id as asset from artworks where site_id=${s.id}`,
      );
      const ids = new Map(old.map((a) => [a.id, a.asset]));
      assert(
        draft.artworks.every((a) => ids.get(a.id) === a.assetId),
        400,
        "invalid_asset",
      );
      await writeDraft(tx, s.id, draft);
      await prune(tx, s.id);
      await tx.execute(
        sql`update sites set version=version+1 where id=${s.id}`,
      );
      return { version: version + 1 };
    });
  });
  for (const action of ["publish", "unpublish"])
    app.post("/sites/:site/" + action, async (req) => {
      const u = await account(db, req, env);
      const { version } = z
        .object({ version: z.int().positive() })
        .parse(req.body);
      return db.transaction(async (tx) => {
        const s = await owned(tx, siteId(req), u.id);
        assert(s.version === version, 409, "conflict");
        let published: string | null = null;
        if (action === "publish") {
          assert(u.verified, 403, "verify_email");
          assert(!u.restricted, 403, "account_restricted");
          const { plan } = await entitlement(tx, env, u.id);
          const snapshot = publishable(await readDraft(tx, s), plan);
          const rev = await first<{ id: string }>(
            tx,
            sql`insert into revisions(site_id,snapshot) values(${s.id},${JSON.stringify(snapshot)}::jsonb) returning id`,
          );
          published = rev!.id;
          await tx.execute(
            sql`insert into revision_assets select ${s.id}::uuid,${published}::uuid,value::uuid from jsonb_array_elements_text(${JSON.stringify(snapshot.artworks.map((a) => a.assetId))}::jsonb)`,
          );
        }
        await tx.execute(
          sql`update sites set published_id=${published},version=version+1,updated_at=now() where id=${s.id}`,
        );
        await tx.execute(
          sql`delete from revisions where site_id=${s.id} and id is distinct from ${published}`,
        );
        await prune(tx, s.id);
        await tx.execute(
          sql`insert into events(user_id,event) values(${u.id},${action})`,
        );
        return { published, version: version + 1 };
      });
    });
  app.get("/public/:handle", async (req) => {
    const h = handle.parse((req.params as { handle: string }).handle);
    const record = await first<{
      id: string;
      revision: string;
      draft: unknown;
      plan: PlanId;
      domain: string | null;
    }>(
      db,
      sql`select s.id,r.id as revision,r.snapshot as draft,${planSql(sql`s.owner_id`)} as plan,
        (select hostname from domains d where d.site_id=s.id and d.is_primary and d.status='verified') as domain
        from sites s join revisions r on r.site_id=s.id and r.id=s.published_id join users u on u.id=s.owner_id
        where s.handle=${h} and u.restricted_at is null`,
    );
    assert(record, 404, "site_missing");
    const features = plans[record.plan].features;
    // Entitlements are re-applied on every read, so a lapsed plan reverts
    // the public site to free features without republishing or data loss.
    return {
      id: record.id,
      revision: record.revision,
      draft: entitle(draftSchema.parse(record.draft), features),
      branding: !features.removeBranding,
      domain: features.customDomain ? record.domain : null,
    };
  });
  app.post(
    "/reports",
    { config: { rateLimit: { max: 3, timeWindow: "1 hour" } } },
    async (req) => {
      const body = z
        .object({ handle, reason: z.string().trim().min(5).max(2000) })
        .parse(req.body);
      const r = await first(
        db,
        sql`insert into reports(site_id,reason) select id,${body.reason} from sites where handle=${body.handle} and published_id is not null returning id`,
      );
      assert(r, 404, "site_missing");
      return { ok: true };
    },
  );
}
