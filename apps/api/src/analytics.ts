import type { FastifyInstance, FastifyRequest } from "fastify";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { sql, first, rows, type Database } from "@studio/db";
import { handle } from "@studio/shared";
import type { Config } from "./config.ts";
import { account } from "./auth.ts";
import { owned } from "./drafts.ts";
import { siteId } from "./sites.ts";
import { assert } from "./errors.ts";
import { entitlement } from "./plan.ts";

/* Privacy-first analytics. Only daily aggregate counters are stored:
   page path, a referrer category, an optional country code supplied by a
   trusted edge, and a count. No IP address, cookie, user agent or visitor
   identifier is kept, so artists never see personal data. */

const BOT = /bot|crawl|spider|slurp|preview|fetch|monitor|headless|lighthouse|python|curl|wget|httpclient|facebookexternalhit|embedly|discordbot|whatsapp|telegram/i;
const GROUPS: [string, RegExp][] = [
  ["search", /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|yandex|baidu|brave|startpage)\./],
  ["social", /(^|\.)(instagram|facebook|fb|x|twitter|t|tiktok|pinterest|bsky|tumblr|reddit|threads|linkedin|youtube|discord|mastodon|whatsapp|telegram)\./],
  ["art", /(^|\.)(artstation|deviantart|behance|dribbble|cara|ko-fi|patreon|vgen|pixiv|newgrounds)\./],
];
export function referrerCategory(host: string | undefined, self: string[]) {
  if (!host) return "direct";
  const h = host.toLowerCase();
  if (self.some((s) => h === s || h.endsWith("." + s))) return "internal";
  return GROUPS.find(([, re]) => re.test(h + "."))?.[0] ?? "other";
}

export function analyticsRoutes(app: FastifyInstance, db: Database, env: Config) {
  const internal = (req: FastifyRequest) => {
    const given = Buffer.from(String(req.headers["x-internal-token"] ?? ""));
    const expected = Buffer.from(env.INTERNAL_TOKEN);
    assert(given.length === expected.length && timingSafeEqual(given, expected), 401, "unauthorized");
  };
  app.post("/internal/analytics/hit", async (req) => {
    internal(req);
    const b = z
      .object({
        handle,
        kind: z.enum(["view", "click"]),
        path: z.string().max(300),
        referrer: z.string().max(253).optional(),
        country: z.string().regex(/^[A-Z]{2}$/).optional(),
        agent: z.string().max(400).default(""),
      })
      .parse(req.body);
    if (!b.agent || BOT.test(b.agent)) return { counted: false };
    const path = b.path.split(/[?#]/)[0].replace(/\/+$/, "").slice(0, 200) || "/";
    const referrer = referrerCategory(b.referrer, [env.PLATFORM_DOMAIN, new URL(env.APP_ORIGIN).hostname]);
    const r = await first(
      db,
      sql`insert into analytics_daily(site_id,day,kind,path,referrer,country,count)
        select id,(now() at time zone 'utc')::date,${b.kind},${path},${referrer},${b.country ?? ""},1 from sites where handle=${b.handle} and published_id is not null
        on conflict(site_id,day,kind,path,referrer,country) do update set count=analytics_daily.count+1 returning 1`,
    );
    return { counted: Boolean(r) };
  });

  app.get("/sites/:site/analytics", async (req) => {
    const u = await account(db, req, env);
    const s = await db.transaction((tx) => owned(tx, siteId(req), u.id));
    const { features } = await entitlement(db, env, u.id);
    const advanced = features.analytics === "advanced";
    const max = advanced ? 365 : 30;
    const days = Math.min(max, z.coerce.number().int().min(1).default(30).parse((req.query as { days?: string }).days));
    const since = sql`(now() at time zone 'utc')::date - ${days - 1}::int`;
    const where = sql`site_id=${s.id} and day >= ${since}`;
    const series = await rows<{ day: string; views: number }>(
      db,
      sql`select d::date::text as day, coalesce(sum(a.count) filter (where a.kind='view'),0)::int as views
        from generate_series(${since}, (now() at time zone 'utc')::date, interval '1 day') d
        left join analytics_daily a on a.site_id=${s.id} and a.day=d::date group by d order by d`,
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
        where a.site_id=${s.id} and a.day >= ${since} and a.kind='view' and a.path like '/works/%'
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
        sql`select coalesce(sum(count),0)::int as views from analytics_daily where site_id=${s.id} and kind='view'
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
  });
}

export async function pruneAnalytics(db: Database, env: Config) {
  await db.execute(sql`delete from analytics_daily where day < (now() at time zone 'utc')::date - ${env.ANALYTICS_RETENTION_DAYS}::int`);
}
