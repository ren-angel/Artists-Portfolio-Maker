import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { sql, first, rows, type Database } from "@studio/db";
import {
  initialDraft,
  visibilitySchema,
  type DiscoveryWork,
  templateNames,
  draftSchema,
  handle,
  publishable,
  entitle,
  plans,
  type PlanId,
} from "@studio/shared";
import { checkCreativeChanges, recordPageChanges } from "./creative.ts";
import { account } from "./auth.ts";
import type { Config } from "./config.ts";
import { assert } from "./errors.ts";
import { owned, readDraft, writeDraft, prune, usage } from "./drafts.ts";
import { entitlement, limits as planLimits, planOf, planSql } from "./plan.ts";

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
        template: z.enum(templateNames).optional(),
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
      assert(count!.n < planLimits(env, await planOf(tx, u.id)).sites, 409, "site_limit");
      const d = initialDraft(b.title, b.language);
      if (b.template) d.theme.template = b.template;
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
        creativeEnabled: env.CREATIVE_TOOLS === "on",
        chaptersPerPage: env.CHAPTERS_PER_PLAN_PAGE,
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
      const previous = await readDraft(tx, s);
      checkCreativeChanges(previous,draft,env.CREATIVE_TOOLS === "on",limits.pages * env.CHAPTERS_PER_PLAN_PAGE);
      await recordPageChanges(tx,s.id,version,previous,draft);
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
          sql`update sites set published_name=${published ? s.title : ""},published_id=${published},version=version+1,updated_at=now() where id=${s.id}`,
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
  app.get("/sites/:site/visibility", async (req) => {
    const u = await account(db, req, env);
    const row = await first(db, sql`select discoverable,indexable from sites where id=${siteId(req)} and owner_id=${u.id}`);
    assert(row, 404, "site_missing");
    return visibilitySchema.parse(row);
  });
  app.put("/sites/:site/visibility", async (req) => {
    const u = await account(db, req, env);
    const v = visibilitySchema.parse(req.body);
    const site = await first(db, sql`update sites set discoverable=${v.discoverable},indexable=${v.indexable}
      where id=${siteId(req)} and owner_id=${u.id} returning id`);
    assert(site, 404, "site_missing");
    return v;
  });
  app.get("/discover", async (req) => {
    const { offset, q } = z.object({
      offset: z.coerce.number().int().min(0).default(0), q: z.string().trim().max(120).default(""),
    }).parse(req.query);
    const works = await rows<DiscoveryWork>(db, sql`
      select s.handle, r.snapshot->>'title' as artist, a->>'id' as "artId",
        a->>'title' as title,a->>'alt' as alt, '/api/media/'||s.id||'/'||(a->>'assetId')||'/thumb' as thumbnail
      from sites s join users u on u.id=s.owner_id join revisions r on r.id=s.published_id and r.site_id=s.id
      cross join lateral jsonb_array_elements(r.snapshot->'artworks') as a
      where s.discoverable and u.restricted_at is null
        and strpos(lower(concat_ws(' ',r.snapshot->>'title',a->>'title',s.handle)),lower(${q}))>0
      order by s.handle,a->>'id' limit 25 offset ${offset}`);
    return { works: works.slice(0,24), more: works.length > 24 };
  });
  app.get("/public/:handle", async (req) => {
    const h = handle.parse((req.params as { handle: string }).handle);
    const view=z.object({chapter:z.union([z.uuid(),z.literal("index")]).optional(),series:z.string().max(50).optional()}).parse(req.query);
    const record = await first<{
      id: string;
      revision: string;
      indexable: boolean;
      draft: unknown;
      plan: PlanId;
      domain: string | null;
    }>(
      db,
      sql`select s.id,s.indexable,r.id as revision,r.snapshot as draft,${planSql(sql`s.owner_id`)} as plan,
        (select hostname from domains d where d.site_id=s.id and d.is_primary and d.status='verified' and d.dns_ok and d.tls_ok) as domain
        from sites s join revisions r on r.site_id=s.id and r.id=s.published_id join users u on u.id=s.owner_id
        where s.handle=${h} and u.restricted_at is null`,
    );
    assert(record, 404, "site_missing");
    const features = plans[record.plan].features;
    // Entitlements are re-applied on every read, so a lapsed plan reverts
    // the public site to free features without republishing or data loss.
    const snapshot = draftSchema.parse(record.draft);
    // Series indexes need only a thumbnail. Keep panel metadata for the requested
    // chapter and any work already referenced elsewhere on this portfolio.
    if (view.chapter)
      for (const p of snapshot.pages)
        for (const h of p.creative?.chapters ?? []) {
          if (p.slug !== view.series || h.id !== view.chapter) {
            h.cover ??= h.artIds[0] ?? null;
            h.artIds = [];
          }
        }
    return {
      id: record.id,
      revision: record.revision,
      indexable: record.indexable,
      draft: view.chapter ? publishable(snapshot,record.plan) : entitle(snapshot,features),
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
