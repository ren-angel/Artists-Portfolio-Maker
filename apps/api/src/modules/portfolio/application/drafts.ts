import { sql, first, rows, type Database } from "@studio/db";
import { initialDraft, type Draft, type templateNames } from "@studio/shared";
import type { Config } from "../../../platform/config.ts";
import { assert } from "../../../platform/errors.ts";
import { owned } from "../../tenancy/index.ts";
import { entitlement, limits as planLimits, planOf } from "../../entitlements/index.ts";
import { prune, usage } from "../../media/index.ts";
import { assertArtworkAssets, assertPageQuota, checkCreativeChanges } from "../domain/rules.ts";
import { readDraft, writeDraft } from "../infrastructure/draft-repository.ts";
import { recordPageChanges } from "../infrastructure/creative-repository.ts";

/* Studio draft use cases. Saves are optimistic: the caller supplies the
   revision it edited and a stale revision fails with 409 conflict. */

export function draftService(db: Database, env: Config) {
  const creativeOn = env.CREATIVE_TOOLS === "on";
  return {
    listSites: (user: string) =>
      rows(db, sql`select id,handle,title from sites where owner_id=${user} order by created_at`),

    async createSite(
      user: string,
      input: { handle: string; title: string; language: Draft["language"]; template?: (typeof templateNames)[number] },
    ) {
      return db.transaction(async (tx) => {
        // The user-row lock serializes site creation against the plan's site limit.
        await tx.execute(sql`select id from users where id=${user} for update`);
        const count = await first<{ n: number }>(tx, sql`select count(*)::int n from sites where owner_id=${user}`);
        assert(count!.n < planLimits(env, await planOf(tx, user)).sites, 409, "site_limit");
        const d = initialDraft(input.title, input.language);
        if (input.template) d.theme.template = input.template;
        const s = await first<{ id: string }>(
          tx,
          sql`insert into sites(owner_id,handle,title,home) values(${user},${input.handle},${input.title},${d.home}) returning id`,
        );
        await writeDraft(tx, s!.id, d);
        return { id: s!.id };
      });
    },

    async loadSite(user: string, site: string) {
      return db.transaction(async (tx) => {
        const s = await owned(tx, site, user);
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
          creativeEnabled: creativeOn,
          chaptersPerPage: env.CHAPTERS_PER_PLAN_PAGE,
          storageUsed: (await usage(tx, s.id)).bytes,
          draft: await readDraft(tx, s),
        };
      });
    },

    async save(user: string, site: string, version: number, draft: Draft) {
      return db.transaction(async (tx) => {
        const s = await owned(tx, site, user);
        assert(version === s.version, 409, "conflict");
        const { limits } = await entitlement(tx, env, user);
        const stored = await first<{ n: number }>(tx, sql`select count(*)::int as n from pages where site_id=${s.id}`);
        assertPageQuota(draft.pages.length, stored!.n, limits.pages);
        const assets = await rows<{ id: string; asset: string }>(
          tx,
          sql`select id,asset_id as asset from artworks where site_id=${s.id}`,
        );
        assertArtworkAssets(draft, new Map(assets.map((a) => [a.id, a.asset])));
        const previous = await readDraft(tx, s);
        checkCreativeChanges(previous, draft, creativeOn, limits.pages * env.CHAPTERS_PER_PLAN_PAGE);
        await recordPageChanges(tx, s.id, version, previous, draft);
        await writeDraft(tx, s.id, draft);
        await prune(tx, s.id);
        await tx.execute(sql`update sites set version=version+1 where id=${s.id}`);
        return { version: version + 1 };
      });
    },
  };
}
