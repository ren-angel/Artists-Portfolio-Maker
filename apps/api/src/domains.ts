import type { FastifyInstance, FastifyRequest } from "fastify";
import { resolveTxt, resolveCname, resolve4 } from "node:dns/promises";
import { connect as tlsConnect } from "node:tls";
import { isIP } from "node:net";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { sql, first, rows, type Database } from "@studio/db";
import { plans } from "@studio/shared";
import type { Config } from "./config.ts";
import { account } from "./auth.ts";
import { owned } from "./drafts.ts";
import { siteId } from "./sites.ts";
import { assert, Fault } from "./errors.ts";
import { entitlement, planSql } from "./plan.ts";
import { token } from "./security.ts";

/* Custom domains. Ownership is proven with a DNS TXT record; only verified
   hostnames of entitled, unrestricted accounts ever resolve to a portfolio.
   TLS is issued by the hosting edge (for example Caddy on-demand TLS, which
   asks /domains/tls-ask); this API never acts as a certificate authority and
   reports a certificate as active only after a real handshake succeeds. */

export type Network = {
  txt(name: string): Promise<string[]>;
  cname(name: string): Promise<string[]>;
  a(name: string): Promise<string[]>;
  tls(host: string): Promise<boolean>;
};
export const realNetwork: Network = {
  txt: async (n) => (await resolveTxt(n)).map((r) => r.join("")),
  cname: (n) => resolveCname(n),
  a: (n) => resolve4(n),
  tls: (host) =>
    new Promise((resolve) => {
      const socket = tlsConnect({ host, servername: host, port: 443, timeout: 5000 }, () => {
        resolve(socket.authorized);
        socket.end();
      });
      socket.on("error", () => resolve(false));
      socket.on("timeout", () => {
        socket.destroy();
        resolve(false);
      });
    }),
};
const quiet = <T>(p: Promise<T[]>) => p.catch(() => [] as T[]);

const BLOCKED_SUFFIXES = [".local", ".localhost", ".internal", ".invalid", ".example", ".lan", ".home", ".corp", ".arpa", ".onion"];
export function normalizeHost(input: string, env: Config) {
  let raw = input.trim().toLowerCase();
  if (!/^[a-z]+:\/\//.test(raw)) raw = "http://" + raw;
  let host: string;
  try {
    host = new URL(raw).hostname.replace(/\.$/, "");
  } catch {
    throw new Fault(400, "invalid_domain");
  }
  const labels = host.split(".");
  const ok =
    host.length <= 253 &&
    labels.length >= 2 &&
    !isIP(host) &&
    labels.every((l) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(l)) &&
    /^(?:[a-z]{2,63}|xn--[a-z0-9-]+)$/.test(labels.at(-1)!) &&
    !BLOCKED_SUFFIXES.some((s) => host.endsWith(s)) &&
    !/^(?:example|localhost)\./.test(host) &&
    host !== env.PLATFORM_DOMAIN &&
    !host.endsWith("." + env.PLATFORM_DOMAIN) &&
    host !== new URL(env.APP_ORIGIN).hostname;
  if (!ok) throw new Fault(400, "invalid_domain");
  return host;
}

export const verifyName = (host: string) => "_studio-verify." + host;

async function check(db: Database, env: Config, net: Network, id: string) {
  const d = await first<{ hostname: string; token: string; site_id: string }>(
    db,
    sql`select hostname,token,site_id from domains where id=${id}`,
  );
  assert(d, 404, "domain_missing");
  const txt = await quiet(net.txt(verifyName(d.hostname)));
  const owned = txt.includes("studio-verify=" + d.token);
  const cname = await quiet(net.cname(d.hostname));
  const a = await quiet(net.a(d.hostname));
  const target = env.DOMAIN_TARGET?.toLowerCase().replace(/\.$/, "");
  const dnsOk =
    (!!target && cname.some((c) => c.toLowerCase().replace(/\.$/, "") === target)) ||
    (!!env.DOMAIN_TARGET_IP && a.includes(env.DOMAIN_TARGET_IP));
  const tlsOk = owned && dnsOk && env.DOMAIN_TLS_CHECK === "probe" ? await net.tls(d.hostname) : false;
  const error = !owned ? "txt_missing" : !dnsOk ? "dns_not_pointing" : !tlsOk ? "tls_pending" : null;
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`update domains set status=${owned ? "verified" : "failed"},dns_ok=${dnsOk},tls_ok=${tlsOk},last_error=${error},checked_at=now(),
        verified_at=case when ${owned} then coalesce(verified_at,now()) else verified_at end,
        is_primary=case when ${owned} then is_primary else false end where id=${id}`,
    );
    // The first verified domain becomes primary automatically.
    if (owned)
      await tx.execute(
        sql`update domains set is_primary=true where id=${id} and not exists (select 1 from domains where site_id=${d.site_id} and is_primary)`,
      );
  });
}

const view = (env: Config) => (d: Record<string, unknown>) => ({
  ...d,
  instructions: {
    txt: { name: verifyName(String(d.hostname)), value: "studio-verify=" + d.token },
    cname: env.DOMAIN_TARGET ?? null,
    a: env.DOMAIN_TARGET_IP ?? null,
  },
});

export function domainRoutes(app: FastifyInstance, db: Database, env: Config, net: Network = realNetwork) {
  const internal = (req: FastifyRequest) => {
    const given = Buffer.from(String(req.headers["x-internal-token"] ?? ""));
    const expected = Buffer.from(env.INTERNAL_TOKEN);
    assert(given.length === expected.length && timingSafeEqual(given, expected), 401, "unauthorized");
  };
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
      assert(n!.n < 3, 409, "domain_limit");
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
    await check(db, env, net, id);
    return view(env)((await first<Record<string, unknown>>(db, sql`${select} where id=${id}`))!);
  });
  app.post("/sites/:site/domains/:id/primary", async (req) => {
    const u = await account(db, req, env);
    const { id } = z.object({ id: z.uuid() }).parse(req.params);
    await db.transaction(async (tx) => {
      const s = await owned(tx, siteId(req), u.id);
      assert(await first(tx, sql`select 1 from domains where id=${id} and site_id=${s.id} and status='verified'`), 409, "domain_unverified");
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
    internal(req);
    const host = z.object({ host: z.string().max(260) }).parse(req.query).host.toLowerCase().replace(/:\d+$/, "");
    const r = await first<{ handle: string; plan: keyof typeof plans }>(
      db,
      sql`select s.handle,${planSql(sql`s.owner_id`)} as plan from domains d join sites s on s.id=d.site_id join users u on u.id=s.owner_id
        where d.hostname=${host} and d.status='verified' and u.restricted_at is null and s.published_id is not null`,
    );
    assert(r && plans[r.plan].features.customDomain, 404, "domain_missing");
    return { handle: r.handle };
  });
  // On-demand TLS gate for the edge (Caddy `on_demand_tls { ask }`).
  app.get("/domains/tls-ask", async (req, reply) => {
    const host = z.object({ domain: z.string().max(260) }).parse(req.query).domain.toLowerCase();
    const r = await first<{ plan: keyof typeof plans }>(
      db,
      sql`select ${planSql(sql`s.owner_id`)} as plan from domains d join sites s on s.id=d.site_id where d.hostname=${host} and d.status='verified'`,
    );
    return reply.code(r && plans[r.plan].features.customDomain ? 200 : 404).send();
  });
}

/** Daily re-verification so a domain whose TXT proof disappears (for
    example after expiry or a transfer) stops routing instead of lingering. */
export async function recheckDomains(db: Database, env: Config, net: Network = realNetwork) {
  for (const d of await rows<{ id: string }>(
    db,
    sql`select id from domains where checked_at is null or checked_at < now()-interval '1 day' order by checked_at nulls first limit 200`,
  ))
    await check(db, env, net, d.id).catch(() => {});
  // Unverified claims are released after 14 days so they cannot squat names.
  await db.execute(sql`delete from domains where status<>'verified' and created_at < now()-interval '14 days'`);
}
