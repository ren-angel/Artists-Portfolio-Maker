import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { sql, first, rows, type Database, type Tx } from "@studio/db";
import type { Config } from "../../../platform/config.ts";
import { account } from "../../identity/index.ts";
import { assert } from "../../../platform/errors.ts";
import { planSql } from "../../entitlements/index.ts";
import { sync, type BillingProvider } from "../../billing/index.ts";

/* Platform administration. Authorization is a separate table checked on the
   server for every request; non-admins receive 404. Responses omit password
   hashes, sessions, tokens and provider secrets. Mutations and searches are
   written to admin_audit. */

export function adminRoutes(app: FastifyInstance, db: Database, env: Config, provider: BillingProvider) {
  async function admin(req: FastifyRequest) {
    const u = await account(db, req, env);
    assert(await first(db, sql`select 1 from admins where user_id=${u.id}`), 404, "not_found");
    return u;
  }
  const audit = (adminId: string, action: string, target: string | null, detail: object = {}, executor:Database|Tx=db) =>
    executor.execute(sql`insert into admin_audit(admin_id,action,target,detail) values(${adminId},${action},${target},${JSON.stringify(detail)}::jsonb)`);

  app.get("/admin/overview", async (req) => {
    await admin(req);
    return first(
      db,
      sql`select (select count(*)::int from users) as users,
        (select count(*)::int from sites where published_id is not null) as published,
        (select coalesce(sum(bytes),0)::bigint::text from assets) as "storageBytes",
        (select jsonb_object_agg(status,n) from (select status,count(*)::int n from subscriptions group by status) x) as subscriptions,
        (select count(*)::int from provider_events where processed_at is null) as "unprocessedEvents",
        (select count(*)::int from subscriptions where sync_error is not null and status in ('pending','active','past_due','canceling')) as "billingErrors",
        (select count(*)::int from domains where status='failed' or (status='verified' and not tls_ok)) as "domainProblems",
        (select count(*)::int from reports where status='open') as "openReports",
        (select count(*)::int from support_requests where status='open') as "openSupport"`,
    );
  });

  app.get("/admin/users", async (req) => {
    const a = await admin(req);
    const q = z.object({ q: z.string().trim().max(120).default("") }).parse(req.query).q;
    await audit(a.id, "search_users", null, { q });
    const like = "%" + q.replace(/[%_\\]/g, "\\$&") + "%";
    return rows(
      db,
      sql`select u.id,u.email,u.display_name as "displayName",u.verified,u.restricted_at as "restrictedAt",u.restriction_reason as "restrictionReason",
        u.created_at as "createdAt",s.handle,${planSql(sql`u.id`)} as plan,
        (select status from subscriptions where user_id=u.id order by created_at desc limit 1) as "subscription",
        (select coalesce(sum(bytes),0)::bigint::text from assets a where a.site_id=s.id) as "storageBytes"
        from users u left join sites s on s.owner_id=u.id
        where ${q} = '' or u.email ilike ${like} or u.display_name ilike ${like} or s.handle ilike ${like}
        order by u.created_at desc limit 50`,
    );
  });

  app.post("/admin/users/:id/restriction", async (req) => {
    const a = await admin(req);
    const { id } = z.object({ id: z.uuid() }).parse(req.params);
    const { restricted, reason } = z.object({ restricted: z.boolean(), reason: z.string().trim().max(500).default("") }).parse(req.body);
    assert(id !== a.id, 400, "cannot_restrict_self");
    await db.transaction(async tx=>{
    const r = await first(
      tx,
      sql`update users set restricted_at=${restricted ? sql`now()` : null},restriction_reason=${restricted ? reason : null} where id=${id} returning id`,
    );
    assert(r, 404, "not_found");
    // Restriction ends sessions so the account must sign in again.
    if (restricted) await tx.execute(sql`delete from sessions where user_id=${id}`);
    await audit(a.id, restricted ? "restrict_user" : "unrestrict_user", id, { reason },tx);
    });
    return { ok: true };
  });

  app.get("/admin/billing", async (req) => {
    await admin(req);
    return {
      subscriptions: await rows(
        db,
        sql`select s.id,u.email,s.plan,s.cycle,s.method,s.status,s.period_end as "periodEnd",s.sync_error as "syncError",s.synced_at as "syncedAt",
          s.provider,s.provider_subscription_id as "providerId" from subscriptions s left join users u on u.id=s.user_id
          where s.sync_error is not null or s.status in ('pending','past_due') order by s.updated_at desc limit 100`,
      ),
      events: await rows(
        db,
        sql`select id,provider,type,object_id as "objectId",received_at as "receivedAt",attempts,last_error as "lastError" from provider_events
          where processed_at is null or last_error is not null order by received_at desc limit 100`,
      ),
    };
  });

  app.post("/admin/billing/:id/sync", async (req) => {
    const a = await admin(req);
    const { id } = z.object({ id: z.uuid() }).parse(req.params);
    await audit(a.id, "sync_subscription", id);
    return sync(db, provider, id);
  });

  app.get("/admin/domains", async (req) => {
    await admin(req);
    return rows(
      db,
      sql`select d.id,d.hostname,d.status,d.dns_ok as "dnsOk",d.tls_ok as "tlsOk",d.last_error as "error",d.checked_at as "checkedAt",s.handle
        from domains d join sites s on s.id=d.site_id where d.status<>'verified' or not d.tls_ok order by d.checked_at desc nulls first limit 100`,
    );
  });

  app.get("/admin/reports", async (req) => {
    await admin(req);
    return rows(
      db,
      sql`select r.id,r.reason,r.status,r.created_at as "createdAt",s.handle from reports r left join sites s on s.id=r.site_id order by (r.status='open') desc,r.created_at desc limit 100`,
    );
  });
  app.post("/admin/reports/:id", async (req) => {
    const a = await admin(req);
    const { id } = z.object({ id: z.uuid() }).parse(req.params);
    const { status } = z.object({ status: z.enum(["open", "reviewed", "actioned", "dismissed"]) }).parse(req.body);
    await db.transaction(async (tx) => {
      assert(
        await first(tx, sql`update reports set status=${status} where id=${id} returning id`),
        404,
        "not_found",
      );
      await audit(a.id, "report_" + status, id, {}, tx);
    });
    return { ok: true };
  });

  app.get("/admin/support", async (req) => {
    await admin(req);
    return rows(
      db,
      sql`select id,email,topic,message,status,created_at as "createdAt" from support_requests order by (status='open') desc,created_at desc limit 100`,
    );
  });
  app.post("/admin/support/:id", async (req) => {
    const a = await admin(req);
    const { id } = z.object({ id: z.uuid() }).parse(req.params);
    const { status } = z.object({ status: z.enum(["open", "answered", "closed"]) }).parse(req.body);
    assert(await first(db, sql`update support_requests set status=${status} where id=${id} returning id`), 404, "not_found");
    await audit(a.id, "support_" + status, id);
    return { ok: true };
  });

  app.get("/admin/audit", async (req) => {
    await admin(req);
    return rows(
      db,
      sql`select l.id::text,l.action,l.target,l.detail,l.created_at as "createdAt",u.email as admin from admin_audit l left join users u on u.id=l.admin_id order by l.id desc limit 200`,
    );
  });
}
