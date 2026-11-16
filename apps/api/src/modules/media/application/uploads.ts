import { sql, first, type Database } from "@studio/db";
import type { Config } from "../../../platform/config.ts";
import { assert, Fault } from "../../../platform/errors.ts";
import { owned } from "../../tenancy/index.ts";
import { entitlement } from "../../entitlements/index.ts";
import { assertCanReserve, assertFitsAfterProcessing, objectKey, type MediaSize } from "../domain/quota.ts";
import { optimize } from "../infrastructure/image-processor.ts";
import type { Storage } from "../infrastructure/object-storage.ts";
import { prune, usage } from "../infrastructure/asset-repository.ts";

/* Upload lifecycle: reserve capacity, receive bounded bytes, process and
   publish derivatives, and authorize delivery. Every write holds the site lock. */

type User = { id: string; restricted: boolean };

export function mediaService(db: Database, env: Config, store: Storage) {
  return {
    async reserve(user: User, site: string, bytes: number, replacement?: string) {
      return db.transaction(async (tx) => {
        const s = await owned(tx, site, user.id);
        if (replacement)
          assert(
            await first(tx, sql`select id from artworks where site_id=${s.id} and id=${replacement}`),
            404,
            "art_missing",
          );
        const { limits } = await entitlement(tx, env, user.id);
        assertCanReserve(
          { bytes, replacement: Boolean(replacement), restricted: user.restricted },
          await usage(tx, s.id),
          limits,
        );
        const ticket = await first<{ id: string }>(
          tx,
          sql`insert into uploads(site_id,source_bytes,replacement) values(${s.id},${bytes},${replacement ?? null}) returning id`,
        );
        const id = ticket!.id;
        return {
          id,
          uploadUrl: store.signUpload ? await store.signUpload(objectKey(s.id, id, "staging"), bytes) : null,
        };
      });
    },

    /** Local storage driver only: the browser PUTs bytes through the API. */
    async receive(user: User, site: string, id: string, source: Buffer) {
      await db.transaction(async (tx) => {
        await owned(tx, site, user.id);
        const up = await first<{ source_bytes: number }>(
          tx,
          sql`select source_bytes from uploads where id=${id} and site_id=${site} and expires_at>now() for update`,
        );
        assert(up, 404, "upload_missing");
        assert(source.length === up.source_bytes, 400, "length_mismatch");
        await store.put(objectKey(site, id, "staging"), source);
      });
    },

    async cancel(user: User, site: string, id: string) {
      await db.transaction(async (tx) => {
        await owned(tx, site, user.id);
        await tx.execute(sql`delete from uploads where id=${id} and site_id=${site}`);
      });
    },

    async finish(user: User, site: string, id: string, title: string) {
      // Commit cleanup intent before any external writes. GC may claim these only after a grace period.
      const asset = crypto.randomUUID();
      const keys = [objectKey(site, asset, "master"), objectKey(site, asset, "thumb")];
      await db.transaction(async (tx) => {
        await owned(tx, site, user.id);
        assert(
          await first(tx, sql`select id from uploads where id=${id} and site_id=${site} and expires_at>now()`),
          404,
          "upload_missing",
        );
        await tx.execute(sql`insert into garbage(object_key) values(${keys[0]}),(${keys[1]})`);
      });
      try {
        return await db.transaction(async (tx) => {
          await owned(tx, site, user.id);
          const up = await first<{ source_bytes: number; replacement: string | null }>(
            tx,
            sql`select * from uploads where id=${id} and site_id=${site} and expires_at>now() for update`,
          );
          assert(up, 404, "upload_missing");
          const source = await store.get(objectKey(site, id, "staging"), up.source_bytes);
          assert(
            source.length === up.source_bytes && source.length <= env.MAX_UPLOAD_BYTES,
            400,
            "length_mismatch",
          );
          const image = await optimize(source);
          const bytes = image.master.length + image.thumb.length;
          const { limits } = await entitlement(tx, env, user.id);
          assertFitsAfterProcessing(await usage(tx, site), up.source_bytes, bytes, limits.storage);
          await store.put(keys[0], image.master);
          await store.put(keys[1], image.thumb);
          await tx.execute(
            sql`insert into assets(site_id,id,bytes,width,height,source_bytes,source_width,source_height) values(${site},${asset},${bytes},${image.width},${image.height},${source.length},${image.sourceWidth},${image.sourceHeight})`,
          );
          const artId = up.replacement ?? crypto.randomUUID();
          if (up.replacement)
            assert(
              await first(tx, sql`update artworks set asset_id=${asset} where site_id=${site} and id=${artId} returning id`),
              404,
              "art_missing",
            );
          else
            await tx.execute(
              sql`insert into artworks(site_id,id,asset_id,title,description,alt,featured,position) select ${site},${artId},${asset},${title},'','',false,coalesce(max(position),0)+1 from artworks where site_id=${site}`,
            );
          await tx.execute(sql`delete from uploads where id=${id}`);
          await tx.execute(sql`delete from garbage where object_key in (${keys[0]},${keys[1]})`);
          await prune(tx, site);
          await tx.execute(sql`update sites set version=version+1 where id=${site}`);
          return { artId, assetId: asset };
        });
      } catch (err) {
        await db.execute(
          sql`delete from uploads using sites s where uploads.site_id=s.id and s.owner_id=${user.id} and s.id=${site} and uploads.id=${id}`,
        );
        throw err;
      }
    },

    /** Whether an asset belongs to the site's active, unrestricted publication. */
    async isPublic(site: string, asset: string) {
      return Boolean(
        await first(
          db,
          sql`select 1 from sites s join users u on u.id=s.owner_id and u.restricted_at is null join revision_assets r on r.site_id=s.id and r.revision_id=s.published_id where s.id=${site} and r.asset_id=${asset}`,
        ),
      );
    },

    async isOwnedBy(user: string, site: string, asset: string) {
      return Boolean(
        await first(
          db,
          sql`select a.id from assets a join sites s on s.id=a.site_id where s.owner_id=${user} and a.site_id=${site} and a.id=${asset}`,
        ),
      );
    },

    async read(site: string, asset: string, size: MediaSize) {
      try {
        return await store.get(objectKey(site, asset, size));
      } catch (error) {
        // Metadata still exists. A missing object can be restored independently.
        if (error instanceof Error && (("code" in error && error.code === "ENOENT") || error.name === "NoSuchKey"))
          throw new Fault(503, "media_unavailable");
        throw error;
      }
    },
  };
}
