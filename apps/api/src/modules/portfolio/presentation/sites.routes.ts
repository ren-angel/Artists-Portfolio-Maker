import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { sql, first, type Database } from "@doodallery/db";
import { templateNames, draftSchema, handle } from "@doodallery/shared";
import type { Config } from "../../../platform/config.ts";
import { assert } from "../../../platform/errors.ts";
import { siteId } from "../../../platform/http.ts";
import { account } from "../../identity/index.ts";
import { entitlement } from "../../entitlements/index.ts";
import { draftService } from "../application/drafts.ts";
import { publicationService } from "../application/publication.ts";

export function siteRoutes(app: FastifyInstance, db: Database, env: Config) {
  const drafts = draftService(db, env);
  const publication = publicationService(db, env);
  const versionBody = z.object({ version: z.int().positive() });

  app.get("/sites", async (req) => {
    const u = await account(db, req, env);
    return { sites: await drafts.listSites(u.id), ...(await entitlement(db, env, u.id)) };
  });
  app.post("/sites", async (req) => {
    const u = await account(db, req, env);
    const b = z
      .object({
        handle,
        template: z.enum(templateNames).optional(),
        title: z.string().trim().min(1).max(120),
        language: z.enum(["pt-BR", "en"]).default("pt-BR"),
      })
      .parse(req.body);
    return drafts.createSite(u.id, b);
  });
  app.get("/sites/:site", async (req) => {
    const u = await account(db, req, env);
    return drafts.loadSite(u.id, siteId(req));
  });
  app.put("/sites/:site", async (req) => {
    const u = await account(db, req, env);
    const { version, draft } = versionBody.extend({ draft: draftSchema }).parse(req.body);
    return drafts.save(u.id, siteId(req), version, draft);
  });
  app.post("/sites/:site/publish", async (req) => {
    const u = await account(db, req, env);
    return publication.publish(u, siteId(req), versionBody.parse(req.body).version);
  });
  app.post("/sites/:site/unpublish", async (req) => {
    const u = await account(db, req, env);
    return publication.unpublish(u, siteId(req), versionBody.parse(req.body).version);
  });

  // Anonymous reads of the active publication (SSR through the web server).
  app.get("/public/:handle", async (req) => {
    const h = handle.parse((req.params as { handle: string }).handle);
    const view = z
      .object({
        chapter: z.union([z.uuid(), z.literal("index")]).optional(),
        series: z.string().max(50).optional(),
      })
      .parse(req.query);
    return publication.readPublic(h, view);
  });
  app.post(
    "/reports",
    { config: { rateLimit: { max: 3, timeWindow: "1 hour" } } },
    async (req) => {
      const body = z
        .object({ handle, reason: z.string().trim().min(5).max(2000) })
        .parse(req.body);
      const r = await first(
        db,
        sql`insert into reports(site_id,reason) select id,${body.reason} from sites where handle=${body.handle} and published_id is not null returning id`,
      );
      assert(r, 404, "site_missing");
      return { ok: true };
    },
  );
}
