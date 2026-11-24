import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { first, rows, sql, type Database } from "@doodallery/db";
import { sectionTree, type Block } from "@doodallery/shared";
import { account } from "../../identity/index.ts";
import type { Config } from "../../../platform/config.ts";
import { owned } from "../../tenancy/index.ts";
import { SAVED_SECTION_LIMIT } from "../domain/rules.ts";
import { assert } from "../../../platform/errors.ts";
import { sectionCount } from "../infrastructure/creative-repository.ts";

export function editorRoutes(app: FastifyInstance, db: Database, env: Config) {
  const ids = z.object({ site: z.uuid(), page: z.uuid() });
  app.get("/sites/:site/pages/:page/history", async (req) => {
    const { site, page } = ids.parse(req.params);
    const user = await account(db, req, env);
    return db.transaction(async (tx) => {
      await owned(tx, site, user.id);
      return rows(
        tx,
        sql`select version,created_at as "createdAt",snapshot->>'title' title from page_history
        where site_id=${site} and page_id=${page} order by version desc limit 12`,
      );
    });
  });
  app.get("/sites/:site/pages/:page/history/:version", async (req) => {
    const { site, page, version } = ids
      .extend({ version: z.coerce.number().int().positive() })
      .parse(req.params);
    const user = await account(db, req, env);
    return db.transaction(async (tx) => {
      await owned(tx, site, user.id);
      const row = await first(
        tx,
        sql`select snapshot from page_history where site_id=${site} and page_id=${page} and version=${version}`,
      );
      assert(row, 404, "not_found");
      return row;
    });
  });
  app.get("/sites/:site/sections", async (req) => {
    const { site } = ids.pick({ site: true }).parse(req.params);
    const user = await account(db, req, env);
    return db.transaction(async (tx) => {
      await owned(tx, site, user.id);
      return rows(
        tx,
        sql`select id,name from saved_sections where site_id=${site} order by name,id`,
      );
    });
  });
  app.get("/sites/:site/sections/:id", async (req) => {
    const { site, id } = z
      .object({ site: z.uuid(), id: z.uuid() })
      .parse(req.params);
    const user = await account(db, req, env);
    return db.transaction(async (tx) => {
      await owned(tx, site, user.id);
      const row = await first(
        tx,
        sql`select blocks from saved_sections where site_id=${site} and id=${id}`,
      );
      assert(row, 404, "not_found");
      return row;
    });
  });
  app.post("/sites/:site/sections", async (req) => {
    const { site } = ids.pick({ site: true }).parse(req.params);
    const { name, page, block } = z
      .object({
        name: z.string().trim().min(1).max(80),
        page: z.uuid(),
        block: z.uuid(),
      })
      .parse(req.body);
    const user = await account(db, req, env);
    assert(env.CREATIVE_TOOLS === "on", 403, "creative_disabled");
    return db.transaction(async (tx) => {
      await owned(tx, site, user.id);
      assert((await sectionCount(tx, site)) < SAVED_SECTION_LIMIT, 409, "section_limit");
      const p = await first<{ blocks: Block[] }>(
        tx,
        sql`select blocks from pages where site_id=${site} and id=${page}`,
      );
      const blocks = sectionTree(p?.blocks ?? [], block);
      assert(blocks.length, 404, "not_found");
      return first(
        tx,
        sql`insert into saved_sections(site_id,name,blocks) values(${site},${name},${JSON.stringify(blocks)}::jsonb) returning id,name`,
      );
    });
  });
  app.delete("/sites/:site/sections/:id", async (req) => {
    const { site, id } = z
      .object({ site: z.uuid(), id: z.uuid() })
      .parse(req.params);
    const user = await account(db, req, env);
    return db.transaction(async (tx) => {
      await owned(tx, site, user.id);
      await tx.execute(
        sql`delete from saved_sections where site_id=${site} and id=${id}`,
      );
      return { ok: true };
    });
  });
}
