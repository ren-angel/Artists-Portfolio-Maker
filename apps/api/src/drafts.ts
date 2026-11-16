import { sql, first, rows, type Tx } from "@studio/db";
import { draftSchema, type Draft } from "@studio/shared";
import { readCreative, writeCreative } from "./creative.ts";
import { assert } from "./errors.ts";

export type Site = {
  id: string;
  handle: string;
  version: number;
  title: string;
  description: string;
  language: Draft["language"];
  step: number;
  home: string;
  social: string[];
  published_id: string | null;
  owner_id: string;
  settings: { commissions?: unknown };
};
export async function owned(tx: Tx, site: string, user: string) {
  const row = await first<Site>(
    tx,
    sql`select * from sites where id=${site} and owner_id=${user} for update`,
  );
  assert(row, 404, "site_missing");
  return row;
}
export async function readDraft(tx: Tx, s: Site): Promise<Draft> {
  const pages = await rows<Draft["pages"][number]>(
    tx,
    sql`select id,title,slug,in_nav as "inNav",blocks from pages where site_id=${s.id} order by position`,
  );
  const creative = await readCreative(tx, s.id);
  for (const p of pages) p.creative = creative.get(p.id);
  const galleries = await rows<Draft["galleries"][number]>(
    tx,
    sql`select g.id,title,slug,description,visible,cover,coalesce((select jsonb_agg(art_id order by position) from memberships m where m.site_id=g.site_id and gallery_id=g.id),'[]') as "artIds" from galleries g where site_id=${s.id} order by position`,
  );
  const artworks = await rows<Draft["artworks"][number]>(
    tx,
    sql`select a.id,a.asset_id as "assetId",a.title,a.description,a.alt,a.featured,a.details,i.width,i.height from artworks a join assets i on (i.site_id,i.id)=(a.site_id,a.asset_id) where a.site_id=${s.id} order by a.position`,
  );
  const theme = await first<{ config: Draft["theme"] }>(
    tx,
    sql`select config from themes where site_id=${s.id}`,
  );
  return draftSchema.parse({
    version: 1,
    title: s.title,
    description: s.description,
    language: s.language,
    home: s.home,
    step: s.step,
    social: s.social,
    theme: theme?.config,
    commissions: s.settings?.commissions,
    pages,
    galleries,
    artworks,
  });
}
// One locked, optimistic draft write. Stable IDs survive slug changes. SQL values remain bound parameters.
export async function writeDraft(tx: Tx, site: string, d: Draft) {
  await tx.execute(
    sql`update sites set title=${d.title},description=${d.description},language=${d.language},step=${d.step},social=${JSON.stringify(d.social)}::jsonb,home=${d.home},settings=jsonb_set(settings,'{commissions}',${JSON.stringify(d.commissions)}::jsonb),updated_at=now() where id=${site}`,
  );
  await tx.execute(
    sql`insert into themes values(${site},${JSON.stringify(d.theme)}::jsonb) on conflict(site_id) do update set config=excluded.config`,
  );
  await tx.execute(sql`delete from product_assets where site_id=${site} and page_id not in (select value::uuid from jsonb_array_elements_text(${JSON.stringify(d.pages.filter(p=>p.creative?.kind==="product").map(p=>p.id))}::jsonb))`);
  await tx.execute(sql`delete from pages where site_id=${site}`);
  await tx.execute(sql`delete from galleries where site_id=${site}`);
  await tx.execute(sql`delete from artworks where site_id=${site}`);
  await tx.execute(sql`insert into pages(site_id,id,title,slug,position,in_nav,blocks)
    select ${site},(p->>'id')::uuid,p->>'title',p->>'slug',ord,(p->>'inNav')::boolean,p->'blocks'
    from jsonb_array_elements(${JSON.stringify(d.pages)}::jsonb) with ordinality as t(p,ord)`);
  await tx.execute(sql`insert into artworks(site_id,id,asset_id,title,description,alt,featured,position,details)
    select ${site},(a->>'id')::uuid,(a->>'assetId')::uuid,a->>'title',a->>'description',a->>'alt',(a->>'featured')::boolean,ord,coalesce(a->'details','{}'::jsonb)
    from jsonb_array_elements(${JSON.stringify(d.artworks)}::jsonb) with ordinality as t(a,ord)`);
  await tx.execute(sql`insert into galleries(site_id,id,title,slug,description,visible,cover,position)
    select ${site},(g->>'id')::uuid,g->>'title',g->>'slug',g->>'description',(g->>'visible')::boolean,(g->>'cover')::uuid,ord
    from jsonb_array_elements(${JSON.stringify(d.galleries)}::jsonb) with ordinality as t(g,ord)`);
  await tx.execute(sql`insert into memberships(site_id,gallery_id,art_id,position)
    select ${site},(g->>'id')::uuid,aid::uuid,ord from jsonb_array_elements(${JSON.stringify(d.galleries)}::jsonb) as g,
    lateral jsonb_array_elements_text(g->'artIds') with ordinality as t(aid,ord)`);
  await writeCreative(tx, site, d.pages);
}
export async function prune(tx: Tx, site: string) {
  await tx.execute(sql`delete from assets a where site_id=${site}
  and not exists (select from artworks where site_id=a.site_id and asset_id=a.id)
  and not exists (select from revision_assets where site_id=a.site_id and asset_id=a.id)
  and not exists (select from users where avatar_asset=a.id)`);
}
/** Counted artworks and stored bytes, including pending reservations. */
export async function usage(tx: Tx, site: string) {
  return (await first<{ art: number; bytes: number }>(
    tx,
    sql`select
  (select count(*) from artworks where site_id=${site})+(select count(*) from uploads where site_id=${site} and replacement is null and expires_at>now()) as art,
  (select coalesce(sum(bytes),0) from assets where site_id=${site})+(select coalesce(sum(source_bytes),0) from uploads where site_id=${site} and expires_at>now()) +(select coalesce(sum(bytes),0) from product_assets where site_id=${site}) as bytes`,
  ))!;
}
