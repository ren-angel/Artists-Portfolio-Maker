import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { sql, first, rows, type Database } from "@studio/db";
import { legalDocuments, requiredConsents, type LegalDocument } from "@studio/shared";
import type { Config } from "./config.ts";
import { account } from "./auth.ts";
import { assert } from "./errors.ts";
import { readDraft, type Site } from "./drafts.ts";

const topics = ["billing", "domain", "account", "bug", "copyright", "other"] as const;

export function accountRoutes(app: FastifyInstance, db: Database, env: Config) {
  app.get("/me/activity", async (req) => {
    const u = await account(db, req, env);
    return rows(db, sql`select id::text,event,created_at as at from events where user_id=${u.id} order by created_at desc,id desc limit 6`);
  });
  app.get("/me/consents", async (req) => {
    const u = await account(db, req, env);
    const accepted = await rows<{ document: string; version: string; acceptedAt: string }>(
      db,
      sql`select document,version,accepted_at as "acceptedAt" from consents where user_id=${u.id} order by accepted_at desc`,
    );
    const missing = requiredConsents.filter((d) => !accepted.some((a) => a.document === d && a.version === legalDocuments[d]));
    return { current: legalDocuments, accepted, missing };
  });
  app.post("/me/consents", async (req) => {
    const u = await account(db, req, env);
    const { documents } = z.object({ documents: z.array(z.enum(Object.keys(legalDocuments) as [LegalDocument])).min(1) }).parse(req.body);
    for (const d of documents)
      await db.execute(sql`insert into consents(user_id,document,version) values(${u.id},${d},${legalDocuments[d]}) on conflict do nothing`);
    return { ok: true };
  });

  app.post("/support", { config: { rateLimit: { max: 5, timeWindow: "1 hour" } } }, async (req) => {
    const u = await account(db, req, env);
    const b = z.object({ topic: z.enum(topics), message: z.string().trim().min(10).max(5000) }).parse(req.body);
    await db.execute(sql`insert into support_requests(user_id,email,topic,message) values(${u.id},${u.email},${b.topic},${b.message})`);
    return { ok: true };
  });
  // Copyright and takedown notices from people without an account.
  app.post("/support/public", { config: { rateLimit: { max: 3, timeWindow: "1 hour" } } }, async (req) => {
    const b = z
      .object({
        email: z.email().max(254),
        topic: z.enum(["copyright", "other"]),
        message: z.string().trim().min(20).max(5000),
        // Hidden field: real people leave it empty.
        website: z.string().max(0).optional(),
      })
      .parse(req.body);
    await db.execute(sql`insert into support_requests(email,topic,message) values(${b.email.toLowerCase()},${b.topic},${b.message})`);
    return { ok: true };
  });

  // Portable copy of everything the account controls (artwork files are
  // listed with their owner-only media URLs).
  app.get("/me/export", { config: { rateLimit: { max: 5, timeWindow: "1 hour" } } }, async (req, reply) => {
    const u = await account(db, req, env);
    const sites = await db.transaction(async (tx) => {
      const list = await rows<Site>(tx, sql`select * from sites where owner_id=${u.id}`);
      return Promise.all(
        list.map(async (s) => ({
          handle: s.handle,
          draft: await readDraft(tx, s),
          media: (await rows<{ id: string }>(tx, sql`select id from assets where site_id=${s.id}`)).map(
            (a) => env.APP_ORIGIN + "/api/media/" + s.id + "/" + a.id + "/master",
          ),
        })),
      );
    });
    const body = {
      exportedAt: new Date().toISOString(),
      account: await first(db, sql`select email,display_name as "displayName",verified,created_at as "createdAt" from users where id=${u.id}`),
      sites,
      subscriptions: await rows(
        db,
        sql`select plan,cycle,method,amount,currency,status,period_end as "periodEnd",created_at as "createdAt" from subscriptions where user_id=${u.id}`,
      ),
      consents: await rows(db, sql`select document,version,accepted_at as "acceptedAt" from consents where user_id=${u.id}`),
    };
    assert(body.account, 404, "not_found");
    return reply
      .header("Content-Disposition", 'attachment; filename="portfolio-export.json"')
      .type("application/json")
      .send(JSON.stringify(body, null, 2));
  });
}
