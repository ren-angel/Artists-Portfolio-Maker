import { sql, first, rows, type Database } from "@doodallery/db";
import type { Config } from "../../../platform/config.ts";

/** Increments one daily aggregate for a published site. */
export async function countHit(
  db: Database,
  h: { handle: string; kind: "view" | "click"; path: string; referrer: string; country: string },
) {
  return Boolean(
    await first(
      db,
      sql`insert into analytics_daily(site_id,day,kind,path,referrer,country,count)
        select id,(now() at time zone 'utc')::date,${h.kind},${h.path},${h.referrer},${h.country},1 from sites where handle=${h.handle} and published_id is not null
        on conflict(site_id,day,kind,path,referrer,country) do update set count=analytics_daily.count+1 returning 1`,
    ),
  );
}

/** Aggregated report for one site. Advanced reports add sources, countries and clicks. */
export async function siteReport(db: Database, site: string, days: number, max: number, advanced: boolean) {
  const since = sql`(now() at time zone 'utc')::date - ${days - 1}::int`;
  const where = sql`site_id=${site} and day >= ${since}`;
  const series = await rows<{ day: string; views: number }>(
    db,
    sql`select d::date::text as day, coalesce(sum(a.count) filter (where a.kind='view'),0)::int as views
      from generate_series(${since}, (now() at time zone 'utc')::date, interval '1 day') d
      left join analytics_daily a on a.site_id=${site} and a.day=d::date group by d order by d`,
  );
  const top = (filter: ReturnType<typeof sql>) =>
    rows<{ path: string; views: number }>(
      db,
      sql`select path,sum(count)::int as views from analytics_daily where ${where} and kind='view' and ${filter} group by path order by views desc limit 10`,
    );
  const counts = await first<{ artworkViews: number; galleryViews: number }>(db, sql`
    select coalesce(sum(count) filter (where path like '/works/%'),0)::int as "artworkViews",
      coalesce(sum(count) filter (where path like '/galleries/%'),0)::int as "galleryViews"
    from analytics_daily where ${where} and kind='view'`);
  const total = series.reduce((n, d) => n + d.views, 0);
  const result: Record<string, unknown> = {
    days,
    maxDays: max,
    advanced,
    total,
    ...counts,
    series,
    pages: await top(sql`path not like '/galleries/%' and path not like '/works/%'`),
    works: await rows<{ title: string; path: string; assetId: string | null; views: number }>(db, sql`
      select a.path,w.asset_id as "assetId",coalesce(w.title,a.path) as title,sum(a.count)::int as views from analytics_daily a
      left join artworks w on w.site_id=a.site_id and a.path='/works/'||w.id::text
      where a.site_id=${site} and a.day >= ${since} and a.kind='view' and a.path like '/works/%'
      group by a.path,w.title,w.asset_id order by views desc,a.path limit 10`),
    galleries: await top(sql`path like '/galleries/%'`),
  };
  if (advanced) {
    const group = (col: ReturnType<typeof sql>) =>
      rows<{ key: string; views: number }>(
        db,
        sql`select ${col} as key,sum(count)::int as views from analytics_daily where ${where} and kind='view' group by 1 order by views desc limit 12`,
      );
    const prev = await first<{ views: number }>(
      db,
      sql`select coalesce(sum(count),0)::int as views from analytics_daily where site_id=${site} and kind='view'
        and day >= ${since} - ${days}::int and day < ${since}`,
    );
    Object.assign(result, {
      referrers: await group(sql`referrer`),
      countries: await group(sql`nullif(country,'')`),
      clicks: await rows(
        db,
        sql`select path as target,sum(count)::int as clicks from analytics_daily where ${where} and kind='click' group by path order by clicks desc limit 10`,
      ),
      previous: prev!.views,
    });
  }
  return result;
}

export async function pruneAnalytics(db: Database, env: Config) {
  await db.execute(sql`delete from analytics_daily where day < (now() at time zone 'utc')::date - ${env.ANALYTICS_RETENTION_DAYS}::int`);
}
