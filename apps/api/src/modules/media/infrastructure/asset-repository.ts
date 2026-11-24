import { sql, first, type Tx } from "@doodallery/db";

/** Deletes asset rows no longer referenced by the draft, the active
    publication or an avatar. Database triggers queue their objects for removal. */
export async function prune(tx: Tx, site: string) {
  await tx.execute(sql`delete from assets a where site_id=${site}
  and not exists (select from artworks where site_id=a.site_id and asset_id=a.id)
  and not exists (select from revision_assets where site_id=a.site_id and asset_id=a.id)
  and not exists (select from users where avatar_asset=a.id)`);
}

/** Counted artworks and stored bytes, including pending reservations and private product files. */
export async function usage(tx: Tx, site: string) {
  const u = (await first<{ art: number | string; bytes: number | string }>(
    tx,
    sql`select
  (select count(*) from artworks where site_id=${site})+(select count(*) from uploads where site_id=${site} and replacement is null and expires_at>now()) as art,
  (select coalesce(sum(bytes),0) from assets where site_id=${site})+(select coalesce(sum(source_bytes),0) from uploads where site_id=${site} and expires_at>now()) +(select coalesce(sum(bytes),0) from product_assets where site_id=${site}) as bytes`,
  ))!;
  // PostgreSQL returns bigint/numeric as strings.
  return { art: Number(u.art), bytes: Number(u.bytes) };
}
