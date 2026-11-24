import { sql, first, type Database } from "@doodallery/db";
import { draftSchema, entitle, plans, publishable, type PlanId } from "@doodallery/shared";
import type { Config } from "../../../platform/config.ts";
import { assert } from "../../../platform/errors.ts";
import { owned } from "../../tenancy/index.ts";
import { entitlement, planSql } from "../../entitlements/index.ts";
import { prune } from "../../media/index.ts";
import { assertCanPublish, trimToChapter } from "../domain/rules.ts";
import { readDraft } from "../infrastructure/draft-repository.ts";

/* Publication: an immutable, filtered snapshot of the draft becomes the
   single active revision. Its image assets are pinned until it is replaced
   or withdrawn. Public reads re-apply the owner's current entitlements. */

type User = { id: string; verified: boolean; restricted: boolean };

export function publicationService(db: Database, env: Config) {
  async function transition(user: User, site: string, version: number, action: "publish" | "unpublish") {
    return db.transaction(async (tx) => {
      const s = await owned(tx, site, user.id);
      assert(s.version === version, 409, "conflict");
      let published: string | null = null;
      if (action === "publish") {
        assertCanPublish(user);
        const { plan } = await entitlement(tx, env, user.id);
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
      // Only the active publication is retained; releasing others unpins their images.
      await tx.execute(sql`delete from revisions where site_id=${s.id} and id is distinct from ${published}`);
      await prune(tx, s.id);
      await tx.execute(sql`insert into events(user_id,event) values(${user.id},${action})`);
      return { published, version: version + 1 };
    });
  }

  return {
    publish: (user: User, site: string, version: number) => transition(user, site, version, "publish"),
    unpublish: (user: User, site: string, version: number) => transition(user, site, version, "unpublish"),

    /** The active publication of an unrestricted artist, or 404. */
    async readPublic(handle: string, view: { chapter?: string; series?: string }) {
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
          where s.handle=${handle} and u.restricted_at is null`,
      );
      assert(record, 404, "site_missing");
      const features = plans[record.plan].features;
      // Entitlements are re-applied on every read, so a lapsed plan reverts
      // the public site to free features without republishing or data loss.
      const snapshot = draftSchema.parse(record.draft);
      return {
        id: record.id,
        revision: record.revision,
        indexable: record.indexable,
        draft: view.chapter
          ? publishable(trimToChapter(snapshot, view.series, view.chapter), record.plan)
          : entitle(snapshot, features),
        domain: features.customDomain ? record.domain : null,
      };
    },
  };
}
