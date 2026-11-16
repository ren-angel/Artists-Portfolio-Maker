import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { sql, first, rows, type Database } from "@studio/db";
import { plans } from "@studio/shared";
import type { Config } from "../../../platform/config.ts";
import { assert } from "../../../platform/errors.ts";
import { requireInternal, siteId } from "../../../platform/http.ts";
import { token } from "../../../platform/crypto.ts";
import { account } from "../../identity/index.ts";
import { owned } from "../../tenancy/index.ts";
import { entitlement, planSql } from "../../entitlements/index.ts";
import { MAX_DOMAINS_PER_SITE, normalizeHost, verifyName, verifyValue } from "../domain/hostname.ts";
import { checkDomain } from "../application/verification.ts";
import { realNetwork, type Network } from "../infrastructure/network.ts";

/* Custom domains. Only verified hostnames of entitled, unrestricted accounts
   ever resolve to a portfolio. TLS is issued by the hosting edge (for
   example Caddy on-demand TLS, which asks /domains/tls-ask); this API never
   acts as a certificate authority. */

const view = (env: Config) => (d: Record<string, unknown>) => ({
  ...d,
  instructions: {
    txt: { name: verifyName(String(d.hostname)), value: verifyValue(String(d.token)) },
    cname: env.DOMAIN_TARGET ?? null,
    a: env.DOMAIN_TARGET_IP ?? null,
  },
});

export function domainRoutes(app: FastifyInstance, db: Database, env: Config, net: Network = realNetwork) {
  const limited = { config: { rateLimit: { max: 20, timeWindow: "10 minutes" } } };
  const select = sql`select id,hostname,token,status,is_primary as "primary",dns_ok as "dnsOk",tls_ok as "tlsOk",last_error as "error",checked_at as "checkedAt",verified_at as "verifiedAt" from domains`;

  app.get("/sites/:site/domains", async (req) => {
    const u = await account(db, req, env);
    const { features } = await entitlement(db, env, u.id);
    const s = await db.transaction((tx) => owned(tx, siteId(req), u.id));
    const list = await rows<Record<string, unknown>>(db, sql`${select} where site_id=${s.id} order by created_at`);
    return { entitled: features.customDomain, domains: list.map(view(env)) };
  });
  app.post("/sites/:site/domains", limited, async (req) => {
    const u = await account(db, req, env);
    const hostname = normalizeHost(z.object({ hostname: z.string().max(260) }).parse(req.body).hostname, env);
    const { features } = await entitlement(db, env, u.id);
    assert(features.customDomain, 403, "plan_required");
    const row = await db.transaction(async (tx) => {
      const s = await owned(tx, siteId(req), u.id);
      const n = await first<{ n: number }>(tx, sql`select count(*)::int n from domains where site_id=${s.id}`);
      assert(n!.n < MAX_DOMAINS_PER_SITE, 409, "domain_limit");
      // Unique index: a hostname can belong to only one account.
      return first<Record<string, unknown>>(
        tx,
        sql`insert into domains(site_id,hostname,token) values(${s.id},${hostname},${token().slice(0, 32)}) returning id,hostname,token,status`,
      );
    });
    await db.execute(sql`insert into events(user_id,event) values(${u.id},'domain_added')`);
    return view(env)(row!);
  });
  app.post("/sites/:site/domains/:id/verify", limited, async (req) => {
    const u = await account(db, req, env);
    const { id } = z.object({ id: z.uuid() }).parse(req.params);
    await db.transaction(async (tx) => {
      const s = await owned(tx, siteId(req), u.id);
      assert(await first(tx, sql`select 1 from domains where id=${id} and site_id=${s.id}`), 404, "domain_missing");
    });
    await checkDomain(db, env, net, id);
    const record = await first<Record<string, unknown>>(db, sql`${select} where id=${id}`);
    assert(record, 404, "domain_missing");
    return view(env)(record);
  });
  app.post("/sites/:site/domains/:id/primary", async (req) => {
    const u = await account(db, req, env);
    const { id } = z.object({ id: z.uuid() }).parse(req.params);
    await db.transaction(async (tx) => {
      const s = await owned(tx, siteId(req), u.id);
      assert((await entitlement(tx, env, u.id)).features.customDomain, 403, "plan_required");
      assert(await first(tx, sql`select 1 from domains where id=${id} and site_id=${s.id} and status='verified' and dns_ok and tls_ok`), 409, "domain_unverified");
      await tx.execute(sql`update domains set is_primary=false where site_id=${s.id}`);
      await tx.execute(sql`update domains set is_primary=true where id=${id}`);
    });
    return { ok: true };
  });
  app.delete("/sites/:site/domains/:id", async (req) => {
    const u = await account(db, req, env);
    const { id } = z.object({ id: z.uuid() }).parse(req.params);
    await db.transaction(async (tx) => {
      const s = await owned(tx, siteId(req), u.id);
      assert(await first(tx, sql`delete from domains where id=${id} and site_id=${s.id} returning id`), 404, "domain_missing");
    });
    return { ok: true };
  });

  // Web server lookup for an incoming Host header. Unverified hostnames,
  // lapsed plans and restricted accounts never resolve.
  app.get("/internal/domains/resolve", async (req) => {
    requireInternal(req, env);
    const host = z.object({ host: z.string().max(260) }).parse(req.query).host.toLowerCase().replace(/:\d+$/, "");
    const r = await first<{ handle: string; plan: keyof typeof plans }>(
      db,
      sql`select s.handle,${planSql(sql`s.owner_id`)} as plan from domains d join sites s on s.id=d.site_id join users u on u.id=s.owner_id
        where d.hostname=${host} and d.status='verified' and d.dns_ok and d.tls_ok and u.restricted_at is null and s.published_id is not null`,
    );
    assert(r && plans[r.plan].features.customDomain, 404, "domain_missing");
    return { handle: r.handle };
  });
  // On-demand TLS gate for the edge (Caddy `on_demand_tls { ask }`).
  app.get("/domains/tls-ask", async (req, reply) => {
    const host = z.object({ domain: z.string().max(260) }).parse(req.query).domain.toLowerCase();
    const r = await first<{ plan: keyof typeof plans }>(
      db,
      sql`select ${planSql(sql`s.owner_id`)} as plan from domains d join sites s on s.id=d.site_id join users u on u.id=s.owner_id where d.hostname=${host} and d.status='verified' and d.dns_ok and u.restricted_at is null`,
    );
    return reply.code(r && plans[r.plan].features.customDomain ? 200 : 404).send();
  });
}
