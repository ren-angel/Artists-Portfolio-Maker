import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { HTTPMethods } from "fastify";
import { createApp } from "../apps/api/src/app.ts";
import { config } from "../apps/api/src/config.ts";
import { mock } from "../apps/api/src/billing/mock.ts";
import { normalizeHost, recheckDomains, type Network } from "../apps/api/src/domains.ts";
import { referrerCategory } from "../apps/api/src/analytics.ts";
import { connect, sql } from "@studio/db";
import { newBlock, type Draft } from "@studio/shared";

const origin = "http://localhost:3000";
const token = "test-webhook-token-0123456789abcdef0123";
const internal = "test-internal-token-0123456789";

/** DNS and TLS answers controlled by the test; nothing leaves the machine. */
function fakeNetwork() {
  const txt = new Map<string, string[]>(),
    cname = new Map<string, string[]>(),
    tls = new Set<string>();
  const net: Network = {
    txt: async (n) => txt.get(n) ?? [],
    cname: async (n) => cname.get(n) ?? [],
    a: async () => [],
    tls: async (h) => tls.has(h),
  };
  return { net, txt, cname, tls };
}

async function harness() {
  assert(process.env.TEST_DATABASE_URL, "Provide a migrated TEST_DATABASE_URL");
  const env = config({
    NODE_ENV: "test",
    APP_ORIGIN: origin,
    PLATFORM_DOMAIN: "studio.test",
    DATABASE_URL: process.env.TEST_DATABASE_URL,
    LOCAL_DATA_DIR: await mkdtemp(join(tmpdir(), "studio-platform-")),
    BILLING_WEBHOOK_TOKEN: token,
    INTERNAL_TOKEN: internal,
    DOMAIN_TARGET: "sites.studio.test",
  });
  const network = fakeNetwork();
  const app = await createApp(env, mock({ origin, webhookToken: token }), network.net);
  const { db, pool } = connect(process.env.TEST_DATABASE_URL);
  const request = (method: HTTPMethods, url: string, body?: object, cookie = "", headers: Record<string, string> = {}) =>
    app.inject({ method, url, headers: { origin, "x-studio-request": "1", cookie, ...headers }, payload: body });
  async function artist(paid?: "artist" | "studio") {
    const email = "plat-" + crypto.randomUUID().slice(0, 8) + "@example.test";
    const r = await request("POST", "/auth/register", { email, password: "a-long-test-password", displayName: "Platform artist", accept: true });
    assert.equal(r.statusCode, 201, r.body);
    const cookie = r.cookies[0].name + "=" + r.cookies[0].value;
    await db.execute(sql`update users set verified=true where email=${email}`);
    const handle = "p-" + crypto.randomUUID().slice(0, 8);
    const site = (await request("POST", "/sites", { handle, title: "Platform" }, cookie)).json().id as string;
    if (paid) {
      const c = await request("POST", "/billing/checkout", { plan: paid, cycle: "monthly", method: "card", taxId: "52998224725" }, cookie);
      await request("POST", `/billing/mock/${c.json().invoiceUrl.split("/").at(-1)}/confirm`, {}, cookie);
    }
    const id = (await request("GET", "/me", undefined, cookie)).json().id as string;
    return { cookie, email, site, handle, id };
  }
  async function publish(a: { cookie: string; site: string }, change?: (d: Draft) => void) {
    const s = (await request("GET", "/sites/" + a.site, undefined, a.cookie)).json();
    change?.(s.draft);
    const saved = await request("PUT", "/sites/" + a.site, { version: s.version, draft: s.draft }, a.cookie);
    assert.equal(saved.statusCode, 200, saved.body);
    const p = await request("POST", `/sites/${a.site}/publish`, { version: saved.json().version }, a.cookie);
    assert.equal(p.statusCode, 200, p.body);
  }
  const close = async () => {
    await app.close();
    await pool.end();
  };
  return { env, app, db, request, artist, publish, network, close };
}

test("domain normalization blocks platform, internal and malformed hostnames", async () => {
  const env = config({ APP_ORIGIN: origin, PLATFORM_DOMAIN: "studio.test", DATABASE_URL: "postgres://x@localhost/x" });
  assert.equal(normalizeHost("HTTPS://Art.Lunamori.COM/path", env), "art.lunamori.com");
  assert.equal(normalizeHost("portfolio.lunamori.art.", env), "portfolio.lunamori.art");
  assert.equal(normalizeHost("münchen-art.de", env), "xn--mnchen-art-9db.de");
  for (const bad of ["studio.test", "x.studio.test", "localhost", "printer.local", "10.0.0.1", "nodot", "a..b.com", "-bad.com", "api.internal"])
    assert.throws(() => normalizeHost(bad, env), /invalid_domain/, bad);
});

test("custom domains require the plan, DNS proof and stay unique; only verified, entitled domains route", async () => {
  const h = await harness();
  try {
    const free = await h.artist();
    assert.equal((await h.request("POST", `/sites/${free.site}/domains`, { hostname: "free-artist.example.org" }, free.cookie)).json().error, "plan_required");

    const a = await h.artist("artist");
    await h.publish(a);
    const host = "luna-" + a.handle + ".art";
    const added = await h.request("POST", `/sites/${a.site}/domains`, { hostname: "https://" + host.toUpperCase() }, a.cookie);
    assert.equal(added.statusCode, 200, added.body);
    const d = added.json();
    assert.equal(d.hostname, host);
    assert.equal(d.instructions.txt.name, "_studio-verify." + host);

    // Another account cannot claim the same hostname.
    const b = await h.artist("studio");
    assert.equal((await h.request("POST", `/sites/${b.site}/domains`, { hostname: host }, b.cookie)).statusCode, 409);
    // Nor manage the first account's domain.
    assert.equal((await h.request("POST", `/sites/${b.site}/domains/${d.id}/verify`, {}, b.cookie)).statusCode, 404);

    const resolve = (hostname: string) =>
      h.request("GET", "/internal/domains/resolve?host=" + hostname, undefined, "", { "x-internal-token": internal });
    assert.equal((await h.request("GET", "/internal/domains/resolve?host=" + host)).statusCode, 401, "internal token required");
    assert.equal((await resolve(host)).statusCode, 404, "unverified domains never route");

    // Verification needs the TXT proof; DNS pointing and TLS are reported separately.
    let v = (await h.request("POST", `/sites/${a.site}/domains/${d.id}/verify`, {}, a.cookie)).json();
    assert.equal(v.status, "failed");
    assert.equal(v.error, "txt_missing");
    h.network.txt.set("_studio-verify." + host, [d.instructions.txt.value]);
    v = (await h.request("POST", `/sites/${a.site}/domains/${d.id}/verify`, {}, a.cookie)).json();
    assert.equal(v.status, "verified");
    assert.equal(v.primary, false);
    assert.equal((await resolve(host)).statusCode, 404);
    assert.equal((await h.request("GET", "/domains/tls-ask?domain=" + host)).statusCode, 404);
    assert.equal(v.error, "dns_not_pointing");
    assert.equal(v.tlsOk, false);
    h.network.cname.set(host, ["sites.studio.test."]);
    await h.request("POST", `/sites/${a.site}/domains/${d.id}/verify`, {}, a.cookie);
    assert.equal((await h.request("GET", "/domains/tls-ask?domain=" + host)).statusCode, 200);
    assert.equal((await resolve(host)).statusCode, 404);
    assert.equal((await h.request("GET", "/public/" + a.handle)).json().domain, null);
    assert.equal((await h.request("POST", `/sites/${a.site}/domains/${d.id}/primary`, {}, a.cookie)).statusCode, 409);
    h.network.tls.add(host);
    v = (await h.request("POST", `/sites/${a.site}/domains/${d.id}/verify`, {}, a.cookie)).json();
    assert.equal(v.dnsOk, true);
    assert.equal(v.tlsOk, true);
    assert.equal(v.error, null);
    assert.equal((await resolve(host)).json().handle, a.handle);
    assert.equal((await h.request("GET", "/domains/tls-ask?domain=" + host)).statusCode, 200);
    assert.equal((await h.request("GET", "/domains/tls-ask?domain=unknown.example.org")).statusCode, 404);
    const pub = (await h.request("GET", "/public/" + a.handle)).json();
    assert.equal(pub.domain, host);
    assert.equal(pub.branding, false);

    // If the TXT proof disappears, daily re-verification stops routing.
    h.network.txt.delete("_studio-verify." + host);
    await h.db.execute(sql`update domains set checked_at=now()-interval '2 days' where id=${d.id}`);
    await recheckDomains(h.db, h.env, h.network.net);
    assert.equal((await resolve(host)).statusCode, 404);

    // A lapsed plan detaches routing without deleting the record.
    h.network.txt.set("_studio-verify." + host, [d.instructions.txt.value]);
    await h.request("POST", `/sites/${a.site}/domains/${d.id}/verify`, {}, a.cookie);
    await h.db.execute(sql`update subscriptions set status='expired' where user_id=${a.id}`);
    assert.equal((await resolve(host)).statusCode, 404);
    assert.equal((await h.request("GET", "/domains/tls-ask?domain=" + host)).statusCode, 404);
    const after = (await h.request("GET", `/sites/${a.site}/domains`, undefined, a.cookie)).json();
    assert.equal(after.entitled, false);
    assert.equal(after.domains.length, 1);
    assert.equal((await h.request("GET", "/public/" + a.handle)).json().branding, true);
  } finally {
    await h.close();
  }
});

test("commission sections publish only with the commissions feature, and old drafts keep working", async () => {
  const h = await harness();
  try {
    const withCommissions = (d: Draft) => {
      d.commissions.status = "open";
      d.commissions.types.push({ id: crypto.randomUUID(), name: "Headshot", description: "", priceFrom: 180, priceTo: 240, turnaround: "2 weeks", artId: null, visible: true });
      d.commissions.contacts.push({ kind: "email", label: "Email", value: "hi@example.org" });
      d.pages[0].blocks.push(newBlock("commissionStatus"), newBlock("commissionPrices"), newBlock("contactLinks"));
      d.theme.radius = "round";
      d.theme.grid = "masonry";
    };
    const free = await h.artist();
    await h.publish(free, withCommissions);
    let pub = (await h.request("GET", "/public/" + free.handle)).json();
    const types = (p: { draft: Draft }) => p.draft.pages[0].blocks.map((b) => b.type);
    assert(!types(pub).includes("commissionStatus"), "free plan publishes no commission sections");
    assert(types(pub).includes("contactLinks"), "contact links are available to everyone");
    assert.equal(pub.draft.theme.radius, "template");
    // The draft keeps everything for when the artist upgrades.
    const draft = (await h.request("GET", "/sites/" + free.site, undefined, free.cookie)).json().draft;
    assert.equal(draft.commissions.types[0].name, "Headshot");
    assert.equal(draft.theme.radius, "round");

    const paid = await h.artist("artist");
    await h.publish(paid, withCommissions);
    pub = (await h.request("GET", "/public/" + paid.handle)).json();
    assert(types(pub).includes("commissionPrices"));
    assert.equal(pub.draft.commissions.types[0].priceFrom, 180);
    assert.equal(pub.draft.theme.radius, "round", "Artist: more appearance controls");
    assert.equal(pub.draft.theme.grid, "template", "masonry grids are a Studio feature");

    // Unsafe contact values are rejected by the schema.
    const s = (await h.request("GET", "/sites/" + paid.site, undefined, paid.cookie)).json();
    s.draft.commissions.contacts.push({ kind: "link", label: "x", value: "javascript:alert(1)" });
    assert.equal((await h.request("PUT", "/sites/" + paid.site, { version: s.version, draft: s.draft }, paid.cookie)).statusCode, 400);

    // A Phase 1 snapshot without any new fields still parses and renders.
    await h.db.execute(
      sql`update revisions r set snapshot = snapshot - 'commissions' #- '{theme,radius}' #- '{theme,grid}' from sites s where s.handle=${free.handle} and r.id=s.published_id`,
    );
    pub = (await h.request("GET", "/public/" + free.handle)).json();
    assert.equal(pub.draft.commissions.status, "closed");
    assert.equal(pub.draft.theme.radius, "template");
  } finally {
    await h.close();
  }
});

test("analytics count only real public views, stay isolated per artist and gate advanced reports", async () => {
  const h = await harness();
  try {
    const a = await h.artist();
    const b = await h.artist("studio");
    await h.publish(a);
    await h.publish(b);
    const hit = (handle: string, body: object = {}) =>
      h.request("POST", "/internal/analytics/hit", { handle, kind: "view", path: "/", agent: "Mozilla/5.0 Firefox/140", ...body }, "", { "x-internal-token": internal });
    assert.equal((await h.request("POST", "/internal/analytics/hit", { handle: a.handle, kind: "view", path: "/" })).statusCode, 401);
    await hit(a.handle);
    await hit(a.handle, { path: "/galleries/prints?utm=x", referrer: "www.instagram.com", country: "BR" });
    assert.equal((await hit(a.handle, { agent: "Googlebot/2.1" })).json().counted, false);
    await hit(b.handle, { referrer: "www.google.com" });
    await hit(b.handle, { kind: "click", path: "contact:0" });

    const ra = (await h.request("GET", `/sites/${a.site}/analytics?days=365`, undefined, a.cookie)).json();
    assert.equal(ra.total, 2);
    assert.equal(ra.galleryViews, 1);
    assert.equal(ra.artworkViews, 0);
    assert.equal(ra.days, 30, "basic analytics cap the window");
    assert.equal(ra.galleries[0].path, "/galleries/prints");
    assert.equal(ra.referrers, undefined, "advanced breakdowns are Studio-only");
    const rb = (await h.request("GET", `/sites/${b.site}/analytics?days=90`, undefined, b.cookie)).json();
    assert.equal(rb.total, 1);
    assert.equal(rb.referrers[0].key, "search");
    assert.equal(rb.clicks[0].clicks, 1);
    // Artists cannot read each other's analytics.
    assert.equal((await h.request("GET", `/sites/${b.site}/analytics`, undefined, a.cookie)).statusCode, 404);
    const stored = await h.db.execute(sql`select * from analytics_daily where site_id=${a.site}`);
    assert(stored.rows.every((r) => !JSON.stringify(r).match(/\d+\.\d+\.\d+\.\d+|Mozilla/)), "no IPs or user agents stored");
    assert.equal(referrerCategory("t.co", []), "social");
    assert.equal(referrerCategory("www.artstation.com", []), "art");
    assert.equal(referrerCategory(undefined, []), "direct");
  } finally {
    await h.close();
  }
});

test("administration is server-authorized, audited and restricts accounts", async () => {
  const h = await harness();
  try {
    const admin = await h.artist();
    const user = await h.artist();
    await h.publish(user);
    for (const url of ["/admin/overview", "/admin/users?q=x", "/admin/billing", "/admin/audit"])
      assert.equal((await h.request("GET", url, undefined, user.cookie)).statusCode, 404, url);
    await h.db.execute(sql`insert into admins(user_id) values(${admin.id})`);
    const found = (await h.request("GET", "/admin/users?q=" + user.email, undefined, admin.cookie)).json();
    assert.equal(found.length, 1);
    assert(!("password_hash" in found[0]) && !JSON.stringify(found).includes("passwordHash"));
    const r = await h.request("POST", `/admin/users/${user.id}/restriction`, { restricted: true, reason: "copyright" }, admin.cookie);
    assert.equal(r.statusCode, 200, r.body);
    assert.equal((await h.request("GET", "/public/" + user.handle)).statusCode, 404, "restricted portfolios go offline");
    assert.equal((await h.request("GET", "/me", undefined, user.cookie)).statusCode, 401, "restriction ends sessions");
    const audit = (await h.request("GET", "/admin/audit", undefined, admin.cookie)).json();
    assert(audit.some((x: { action: string; target: string }) => x.action === "restrict_user" && x.target === user.id));
    await h.request("POST", `/admin/users/${user.id}/restriction`, { restricted: false }, admin.cookie);
    assert.equal((await h.request("GET", "/public/" + user.handle)).statusCode, 200);
  } finally {
    await h.close();
  }
});

test("terms acceptance is recorded, support and export work, deletion stops charges", async () => {
  const h = await harness();
  try {
    assert.equal(
      (await h.request("POST", "/auth/register", { email: "noaccept@example.test", password: "a-long-test-password", displayName: "x" })).statusCode,
      400,
      "registration requires accepting the terms",
    );
    const a = await h.artist("artist");
    const consents = (await h.request("GET", "/me/consents", undefined, a.cookie)).json();
    assert.deepEqual(consents.missing, []);
    assert(consents.accepted.some((c: { document: string }) => c.document === "terms"));
    assert.equal((await h.request("POST", "/support", { topic: "billing", message: "Question about my invoice" }, a.cookie)).statusCode, 200);
    assert.equal(
      (await h.request("POST", "/support/public", { email: "x@example.org", topic: "copyright", message: "This portfolio uses my artwork without permission.", website: "spam" })).statusCode,
      400,
      "honeypot filled",
    );
    const exp = await h.request("GET", "/me/export", undefined, a.cookie);
    assert.equal(exp.statusCode, 200);
    const data = exp.json();
    assert.equal(data.account.email, a.email);
    assert.equal(data.subscriptions[0].plan, "artist");
    const del = await h.request("DELETE", "/me", { password: "a-long-test-password" }, a.cookie);
    assert.equal(del.statusCode, 200, del.body);
    const sub = await h.db.execute(sql`select provider_ended,cancel_requested_at is not null as asked,user_id from subscriptions where id in (select id from subscriptions where user_id is null order by updated_at desc limit 1)`);
    assert.equal(sub.rows[0].provider_ended, true, "provider charges stopped before deletion");
  } finally {
    await h.close();
  }
});
