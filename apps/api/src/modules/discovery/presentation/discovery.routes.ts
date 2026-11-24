import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { sql, first, type Database } from "@doodallery/db";
import { directorySchema, visibilitySchema } from "@doodallery/shared";
import type { Config } from "../../../platform/config.ts";
import { assert } from "../../../platform/errors.ts";
import { siteId } from "../../../platform/http.ts";
import { account } from "../../identity/index.ts";
import { DISCOVERY_PAGE, searchArtists, searchWorks } from "../application/search.ts";

/* Public artist discovery. Participation is opt-in per site; only the
   active publication of an unrestricted account is ever listed. */

export function discoveryRoutes(app: FastifyInstance, db: Database, env: Config) {
  const offset = z.coerce.number().int().min(0).max(100000).default(0);
  const q = z.string().trim().max(120).default("");

  // Artwork discovery and search-engine indexing preferences.
  app.get("/sites/:site/visibility", async (req) => {
    const u = await account(db, req, env);
    const row = await first(db, sql`select discoverable,indexable from sites where id=${siteId(req)} and owner_id=${u.id}`);
    assert(row, 404, "site_missing");
    return visibilitySchema.parse(row);
  });
  app.put("/sites/:site/visibility", async (req) => {
    const u = await account(db, req, env);
    const v = visibilitySchema.parse(req.body);
    const site = await first(db, sql`update sites set discoverable=${v.discoverable},indexable=${v.indexable}
      where id=${siteId(req)} and owner_id=${u.id} returning id`);
    assert(site, 404, "site_missing");
    return v;
  });

  // Artist directory listing.
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

  app.get("/discover", async (req) => {
    const query = z.object({ offset, q }).parse(req.query);
    const works = await searchWorks(db, query.q, query.offset);
    return { works: works.slice(0, DISCOVERY_PAGE), more: works.length > DISCOVERY_PAGE };
  });
  app.get("/discover/artists", async (req) => {
    const query = z
      .object({ q, offset, category: directorySchema.shape.category.default("") })
      .parse(req.query);
    const artists = await searchArtists(db, query);
    return { artists: artists.slice(0, DISCOVERY_PAGE), more: artists.length > DISCOVERY_PAGE };
  });
}
