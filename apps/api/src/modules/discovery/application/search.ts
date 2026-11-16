import { sql, rows, type Database } from "@studio/db";
import type { DirectoryArtist, DiscoveryWork } from "@studio/shared";

/** Results per page. Queries read one extra row to report `more`. */
export const DISCOVERY_PAGE = 24;

/** Published artworks of sites that opted into artwork discovery. */
export function searchWorks(db: Database, q: string, offset: number) {
  return rows<DiscoveryWork>(db, sql`
    select s.handle, r.snapshot->>'title' as artist, a->>'id' as "artId",
      a->>'title' as title,a->>'alt' as alt, '/api/media/'||s.id||'/'||(a->>'assetId')||'/thumb' as thumbnail
    from sites s join users u on u.id=s.owner_id join revisions r on r.id=s.published_id and r.site_id=s.id
    cross join lateral jsonb_array_elements(r.snapshot->'artworks') as a
    where s.discoverable and u.restricted_at is null
      and strpos(lower(concat_ws(' ',r.snapshot->>'title',a->>'title',s.handle)),lower(${q}))>0
    order by s.handle,a->>'id' limit ${DISCOVERY_PAGE + 1} offset ${offset}`);
}

/** Opted-in, published, unrestricted artists ranked by full-text match. */
export function searchArtists(db: Database, f: { q: string; category: string; offset: number }) {
  const document = sql`to_tsvector('simple',s.published_name||' '||s.handle||' '||s.discovery_category||' '||s.discovery_tags)`;
  const query = sql`plainto_tsquery('simple',${f.q})`;
  return rows<DirectoryArtist>(
    db,
    sql`select s.handle,s.published_name name,s.discovery_category category,s.discovery_tags tags,
    '/api/media/'||s.id||'/'||(r.snapshot->'artworks'->0->>'assetId')||'/thumb' thumbnail from sites s
    join revisions r on (r.site_id,r.id)=(s.id,s.published_id) join users u on u.id=s.owner_id
    where s.directory_opt_in and s.published_id is not null and u.restricted_at is null
    ${f.category ? sql`and s.discovery_category=${f.category}` : sql``} ${f.q ? sql`and ${document} @@ ${query}` : sql``}
    order by ${f.q ? sql`ts_rank(${document},${query}) desc,` : sql``} s.handle limit ${DISCOVERY_PAGE + 1} offset ${f.offset}`,
  );
}
