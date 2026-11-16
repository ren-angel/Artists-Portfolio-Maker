import { first, rows, sql, type Tx } from "@studio/db";
import type { Draft, Creative } from "@studio/shared";
import { changedPages, PAGE_HISTORY_LIMIT } from "../domain/rules.ts";

export async function readCreative(tx: Tx, site: string) {
  const records = await rows<Creative & { page: string }>(
    tx,
    sql`
    select c.page_id as page,c.kind,c.visible,c.featured,c.description,c.status,c.tags,c.fields,c.cover,c.link,
      coalesce((select jsonb_agg(a.art_id order by a.position) from creative_artworks a where (a.site_id,a.page_id)=(c.site_id,c.page_id)),'[]') as "artIds",
      coalesce((select jsonb_agg(r.target order by r.position) from creative_relations r where (r.site_id,r.page_id)=(c.site_id,c.page_id)),'[]') as related,
      coalesce((select jsonb_agg(jsonb_build_object('id',h.id,'title',h.title,'visible',h.visible,'date',h.publication_date,'cover',h.cover,
        'artIds',coalesce((select jsonb_agg(p.art_id order by p.position) from comic_pages p where (p.site_id,p.page_id,p.chapter_id)=(h.site_id,h.page_id,h.id)),'[]'))
        order by h.position) from comic_chapters h where (h.site_id,h.page_id)=(c.site_id,c.page_id)),'[]') as chapters,
      (select jsonb_build_object('price',p.price,'currency',p.currency,'checkout',p.checkout,'available',p.available)
        from digital_products p where (p.site_id,p.page_id)=(c.site_id,c.page_id)) as sale
    from creative_pages c where c.site_id=${site}`,
  );
  return new Map(
    records.map(({ page, sale, ...c }) => [
      page,
      { ...c, ...(sale && { sale }) },
    ]),
  );
}
export async function writeCreative(
  tx: Tx,
  site: string,
  pages: Draft["pages"],
) {
  const data = pages.flatMap((p) =>
    p.creative ? [{ ...p.creative, page: p.id }] : [],
  );
  if (!data.length) return;
  const records = sql`jsonb_array_elements(${JSON.stringify(data)}::jsonb) c`;
  await tx.execute(sql`insert into creative_pages select ${site},(c->>'page')::uuid,c->>'kind',(c->>'visible')::boolean,
    (c->>'featured')::boolean,c->>'description',c->>'status',c->'tags',c->'fields',(c->>'cover')::uuid,c->>'link' from ${records}`);
  for (const [table, key] of [
    ["creative_artworks", "artIds"],
    ["creative_relations", "related"],
  ] as const)
    await tx.execute(sql`insert into ${sql.identifier(table)} select ${site},(c->>'page')::uuid,val::uuid,ord
      from ${records}, lateral jsonb_array_elements_text(c->${key}::text) with ordinality a(val,ord)`);
  const chapters = sql`${records}, lateral jsonb_array_elements(c->'chapters') with ordinality h(ch,seq)`;
  await tx.execute(sql`insert into comic_chapters select ${site},(c->>'page')::uuid,(ch->>'id')::uuid,ch->>'title',seq,
    (ch->>'visible')::boolean,(ch->>'date')::date,(ch->>'cover')::uuid from ${chapters}`);
  await tx.execute(sql`insert into comic_pages select ${site},(c->>'page')::uuid,(ch->>'id')::uuid,ord,val::uuid
    from ${chapters}, lateral jsonb_array_elements_text(ch->'artIds') with ordinality a(val,ord)`);
  await tx.execute(sql`insert into digital_products select ${site},(c->>'page')::uuid,(c->'sale'->>'price')::numeric,
    c->'sale'->>'currency',c->'sale'->>'checkout',(c->'sale'->>'available')::boolean from ${records} where c ? 'sale'`);
}

export async function recordPageChanges(
  tx: Tx,
  site: string,
  version: number,
  before: Draft,
  after: Draft,
) {
  const changed = changedPages(before, after);
  // History belongs to an existing page. Explicit deletion also clears its private history.
  await tx.execute(sql`delete from page_history where site_id=${site} and page_id not in
    (select value::uuid from jsonb_array_elements_text(${JSON.stringify(after.pages.map((p) => p.id))}::jsonb))`);
  if (!changed.length) return;
  await tx.execute(sql`insert into page_history(site_id,page_id,version,snapshot)
    select ${site},(p->>'id')::uuid,${version},p from jsonb_array_elements(${JSON.stringify(changed)}::jsonb) p`);
  await tx.execute(sql`delete from page_history where site_id=${site} and (page_id,version) in
    (select page_id,version from (select page_id,version,row_number() over(partition by page_id order by version desc) n
    from page_history where site_id=${site}) h where n>${PAGE_HISTORY_LIMIT})`);
}

export async function sectionCount(tx: Tx, site: string) {
  return (await first<{ n: number }>(
    tx,
    sql`select count(*)::int n from saved_sections where site_id=${site}`,
  ))!.n;
}
