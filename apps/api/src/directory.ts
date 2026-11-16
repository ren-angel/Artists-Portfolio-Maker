import type { FastifyInstance } from "fastify";
import { first, rows, sql, type Database } from "@studio/db";
import { directorySchema, type DirectoryArtist } from "@studio/shared";
import { z } from "zod";
import { account } from "./auth.ts";
import type { Config } from "./config.ts";
import { assert } from "./errors.ts";
import { siteId } from "./sites.ts";
export function directoryRoutes(
  app: FastifyInstance,
  db: Database,
  env: Config,
) {
  app.get("/sites/:site/directory", async (req) => {
    const u = await account(db, req, env);
    const profile = await first(
      db,
      sql`select directory_opt_in listed,discovery_category category,discovery_tags tags from sites
      where id=${siteId(req)} and owner_id=${u.id}`,
    );
    assert(profile, 404, "site_missing");
    return profile;
  });
  app.put("/sites/:site/directory", async (req) => {
    const u = await account(db, req, env),
      p = directorySchema.parse(req.body);
    assert(!p.listed || !u.restricted, 403, "account_restricted");
    assert(
      await first(
        db,
        sql`update sites set directory_opt_in=${p.listed},discovery_category=${p.category},discovery_tags=${p.tags}
      where id=${siteId(req)} and owner_id=${u.id} returning id`,
      ),
      404,
      "site_missing",
    );
    return p;
  });
  app.get("/discover/artists", async (req) => {
    const { q, category, offset } = z
      .object({
        q: z.string().trim().max(120).default(""),
        category: directorySchema.shape.category.default(""),
        offset: z.coerce.number().int().min(0).max(100000).default(0),
      })
      .parse(req.query);
    const document = sql`to_tsvector('simple',s.published_name||' '||s.handle||' '||s.discovery_category||' '||s.discovery_tags)`;
    const query = sql`plainto_tsquery('simple',${q})`;
    const artists = await rows<DirectoryArtist>(
      db,
      sql`select s.handle,s.published_name name,s.discovery_category category,s.discovery_tags tags,
      '/api/media/'||s.id||'/'||(r.snapshot->'artworks'->0->>'assetId')||'/thumb' thumbnail from sites s
      join revisions r on (r.site_id,r.id)=(s.id,s.published_id) join users u on u.id=s.owner_id
      where s.directory_opt_in and s.published_id is not null and u.restricted_at is null
      ${category ? sql`and s.discovery_category=${category}` : sql``} ${q ? sql`and ${document} @@ ${query}` : sql``}
      order by ${q ? sql`ts_rank(${document},${query}) desc,` : sql``} s.handle limit 25 offset ${offset}`,
    );
    return { artists: artists.slice(0, 24), more: artists.length > 24 };
  });
}
