import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { HTTPMethods } from "fastify";
import { createApp } from "../apps/api/src/app.ts";
import { config } from "../apps/api/src/platform/config.ts";
import { mock } from "../apps/api/src/modules/billing/infrastructure/mock.ts";
import { connect, sql, first } from "@doodallery/db";

/* Billing lifecycle against PostgreSQL with the mock provider. No money moves
   and no provider is contacted. */

const origin = "http://localhost:3000";
const token = "test-webhook-token-0123456789abcdef0123";

async function harness(overrides: Record<string, string> = {}) {
  assert(process.env.TEST_DATABASE_URL, "Provide a migrated TEST_DATABASE_URL");
  const env = config({
    NODE_ENV: "test",
    APP_ORIGIN: origin,
    PLATFORM_DOMAIN: "localhost",
    DATABASE_URL: process.env.TEST_DATABASE_URL,
    LOCAL_DATA_DIR: await mkdtemp(join(tmpdir(), "doodallery-billing-")),
    BILLING_WEBHOOK_TOKEN: token,
    MAX_PAGES: "2",
    ...overrides,
  });
  const provider = mock({ origin, webhookToken: token });
  const app = await createApp(env, provider);
  const { db, pool } = connect(process.env.TEST_DATABASE_URL);
  const request = (method: HTTPMethods, url: string, body?: object, cookie = "", headers: Record<string, string> = {}) =>
    app.inject({ method, url, headers: { origin, "x-doodallery-request": "1", cookie, ...headers }, payload: body });
  async function artist() {
    const email = "bill-" + crypto.randomUUID().slice(0, 8) + "@example.test";
    const r = await request("POST", "/auth/register", { email, password: "a-long-test-password", displayName: "Billing artist", accept: true });
    assert.equal(r.statusCode, 201, r.body);
    const cookie = r.cookies[0].name + "=" + r.cookies[0].value;
    await db.execute(sql`update users set verified=true where email=${email}`);
    const site = await request("POST", "/sites", { handle: "b-" + crypto.randomUUID().slice(0, 8), title: "Billing" }, cookie);
    assert.equal(site.statusCode, 200, site.body);
    return { cookie, email, site: site.json().id as string };
  }
  const billing = async (cookie: string) => (await request("GET", "/billing", undefined, cookie)).json();
  const close = async () => {
    await app.close();
    await pool.end();
  };
  return { env, app, db, provider, request, artist, billing, close };
}

test("plan catalog exposes configurable prices and honest payment methods", async () => {
  const h = await harness({ PLAN_PRICES: JSON.stringify({ artist: { monthly: 1490 } }) });
  try {
    const r = (await h.request("GET", "/billing/plans")).json();
    const artist = r.plans.find((p: { id: string }) => p.id === "artist");
    assert.equal(artist.prices.monthly.amount, 1490);
    assert.equal(artist.prices.yearly.amount, 12900);
    assert.equal(artist.limits.pages, 15);
    assert.equal(r.methods.card.recurring, true);
    assert.equal(r.methods.pix.recurring, false);
    assert.equal(r.live, false);
  } finally {
    await h.close();
  }
});

test("checkout, confirmation, duplicates, out-of-order events, failure, grace, cancellation and downgrade", async () => {
  const h = await harness();
  try {
    const a = await h.artist();
    assert.equal((await h.billing(a.cookie)).plan, "free");

    // Unverified accounts and invalid tax IDs cannot start a purchase.
    const invalid = await h.request("POST", "/billing/checkout", { plan: "artist", cycle: "monthly", method: "card", taxId: "111.111.111-11" }, a.cookie);
    assert.equal(invalid.json().error, "invalid_tax_id");

    const start = await h.request("POST", "/billing/checkout", { plan: "artist", cycle: "monthly", method: "card", taxId: "529.982.247-25" }, a.cookie);
    assert.equal(start.statusCode, 200, start.body);
    const { subscriptionId, invoiceUrl } = start.json();
    assert.match(invoiceUrl, /\/billing\/mock\/pay_/);
    // Starting again returns the same pending invoice instead of a second charge.
    const again = (await h.request("POST", "/billing/checkout", { plan: "artist", cycle: "monthly", method: "card" }, a.cookie)).json();
    assert.equal(again.subscriptionId, subscriptionId);

    // Returning from checkout without paying grants nothing.
    await h.request("POST", "/billing/sync", {}, a.cookie);
    let b = await h.billing(a.cookie);
    assert.equal(b.plan, "free");
    assert.equal(b.subscriptions[0].status, "pending");

    // Webhooks without the shared token are rejected.
    const forged = await h.app.inject({
      method: "POST",
      url: "/billing/webhooks/mock",
      headers: { "asaas-access-token": "wrong-token-wrong-token-wrong-token-00" },
      payload: { id: "evt_forged", event: "PAYMENT_CONFIRMED", payment: { subscription: "x" } },
    });
    assert.equal(forged.statusCode, 401);

    // Confirmed payment (through the authenticated mock invoice) activates.
    const paymentId = invoiceUrl.split("/").at(-1);
    assert.equal((await h.request("POST", `/billing/mock/${paymentId}/confirm`, {}, a.cookie)).statusCode, 200);
    b = await h.billing(a.cookie);
    assert.equal(b.plan, "artist");
    assert.equal(b.limits.pages, 15);
    assert.equal(b.features.customDomain, true);
    assert.equal(b.subscriptions[0].status, "active");
    const end = new Date(b.subscriptions[0].periodEnd);
    assert(end.getTime() > Date.now() + 25 * 86400_000);

    // Duplicate and stale (out-of-order) deliveries change nothing.
    const sub = await first<{ provider_subscription_id: string }>(h.db, sql`select provider_subscription_id from subscriptions where id=${subscriptionId}`);
    const send = (id: string, event: string) =>
      h.app.inject({
        method: "POST",
        url: "/billing/webhooks/mock",
        headers: { "asaas-access-token": token },
        payload: { id, event, payment: { id: paymentId, subscription: sub!.provider_subscription_id } },
      });
    const first1 = await send("evt_dup", "PAYMENT_CONFIRMED");
    const first2 = await send("evt_dup", "PAYMENT_CONFIRMED");
    assert.equal(first1.statusCode, 200);
    assert.equal(first2.json().duplicate, true);
    await send("evt_old", "PAYMENT_CREATED");
    await new Promise((r) => setTimeout(r, 300));
    const events = await first<{ n: number }>(h.db, sql`select count(*)::int n from provider_events where event_id='evt_dup'`);
    assert.equal(events!.n, 1);
    b = await h.billing(a.cookie);
    assert.equal(b.subscriptions[0].status, "active");
    assert.equal(new Date(b.subscriptions[0].periodEnd).getTime(), end.getTime());

    // Renewal fails after the period ends: past due with grace, still paid.
    await h.db.execute(sql`update payments set period_end=now()-interval '1 day' where subscription_id=${subscriptionId}`);
    const renew = await h.request("POST", `/billing/mock/${paymentId}/renew`, {}, a.cookie);
    assert.equal(renew.statusCode, 200);
    const next = h.provider.payment(paymentId)!;
    const renewal = (await h.provider.getSubscription(next.subscriptionId)).payments.at(-1)!;
    await h.request("POST", `/billing/mock/${renewal.id}/fail`, {}, a.cookie);
    b = await h.billing(a.cookie);
    assert.equal(b.subscriptions[0].status, "past_due");
    assert.equal(b.plan, "artist");
    // Grace elapses without payment: expired, back to free, data untouched.
    await h.db.execute(sql`update payments set period_end=now()-interval '9 days' where subscription_id=${subscriptionId} and status='confirmed'`);
    await h.request("POST", "/billing/sync", {}, a.cookie);
    b = await h.billing(a.cookie);
    assert.equal(b.subscriptions[0].status, "expired");
    assert.equal(b.plan, "free");
  } finally {
    await h.close();
  }
});

test("cancellation keeps paid access until the period ends; upgrades and downgrades are scheduled safely", async () => {
  const h = await harness();
  try {
    const a = await h.artist();
    const pay = async (body: object) => {
      const r = await h.request("POST", "/billing/checkout", { taxId: "52998224725", ...body }, a.cookie);
      assert.equal(r.statusCode, 200, r.body);
      const { invoiceUrl, subscriptionId } = r.json();
      if (invoiceUrl) await h.request("POST", `/billing/mock/${invoiceUrl.split("/").at(-1)}/confirm`, {}, a.cookie);
      return subscriptionId as string;
    };
    const artist = await pay({ plan: "artist", cycle: "monthly", method: "pix" });
    assert.equal((await h.billing(a.cookie)).plan, "artist");
    assert.equal((await h.request("POST", "/billing/checkout", { plan: "artist", cycle: "monthly", method: "card" }, a.cookie)).json().error, "already_subscribed");

    // Upgrade: Studio applies once its payment is confirmed; Artist ends.
    const studio = await pay({ plan: "studio", cycle: "monthly", method: "card" });
    let b = await h.billing(a.cookie);
    assert.equal(b.plan, "studio");
    const statuses = Object.fromEntries(b.subscriptions.map((s: { id: string; status: string }) => [s.id, s.status]));
    assert.equal(statuses[artist], "canceled");
    assert.equal(statuses[studio], "active");
    const ended = await first<{ provider_ended: boolean }>(h.db, sql`select provider_ended from subscriptions where id=${artist}`);
    assert.equal(ended!.provider_ended, true, "replaced plan stops charging at the provider");

    // Downgrade: Studio continues until its period end; Artist starts then.
    const down = await h.request("POST", "/billing/checkout", { plan: "artist", cycle: "monthly", method: "card" }, a.cookie);
    assert.equal(down.statusCode, 200, down.body);
    b = await h.billing(a.cookie);
    assert.equal(b.plan, "studio");
    const queued = b.subscriptions.find((s: { id: string }) => s.id === down.json().subscriptionId);
    assert.equal(queued.status, "pending");
    assert.equal(queued.startsAt, b.subscriptions.find((s: { id: string }) => s.id === studio).periodEnd.slice(0, 10));
    assert.equal(b.subscriptions.find((s: { id: string }) => s.id === studio).status, "canceling");

    // Cancel everything: access remains until the paid period ends.
    const c = await h.request("POST", "/billing/cancel", { subscriptionId: studio }, a.cookie);
    assert.equal(c.statusCode, 200, c.body);
    b = await h.billing(a.cookie);
    assert.equal(b.plan, "studio");
    assert.equal(b.subscriptions.find((s: { id: string }) => s.id === down.json().subscriptionId).status, "expired");
    await h.db.execute(sql`update payments set period_end=now()-interval '1 minute' where subscription_id=${studio}`);
    await h.request("POST", "/billing/sync", {}, a.cookie);
    b = await h.billing(a.cookie);
    assert.equal(b.plan, "free");
    assert.equal(b.subscriptions.find((s: { id: string }) => s.id === studio).status, "canceled");

    // Another account cannot cancel or inspect this subscription.
    const other = await h.artist();
    assert.equal((await h.request("POST", "/billing/cancel", { subscriptionId: studio }, other.cookie)).statusCode, 404);
  } finally {
    await h.close();
  }
});

test("downgrades preserve content: over-limit pages stay editable but cannot grow", async () => {
  const h = await harness();
  try {
    const a = await h.artist();
    const r = await h.request("POST", "/billing/checkout", { plan: "artist", cycle: "monthly", method: "card", taxId: "52998224725" }, a.cookie);
    await h.request("POST", `/billing/mock/${r.json().invoiceUrl.split("/").at(-1)}/confirm`, {}, a.cookie);
    let state = (await h.request("GET", "/sites/" + a.site, undefined, a.cookie)).json();
    const page = (n: number) => ({ id: crypto.randomUUID(), title: "P" + n, slug: "p-" + n, inNav: true, blocks: [] });
    state.draft.pages.push(...[1, 2, 3, 4].map(page));
    let saved = await h.request("PUT", "/sites/" + a.site, { version: state.version, draft: state.draft }, a.cookie);
    assert.equal(saved.statusCode, 200, saved.body);
    // The plan lapses (MAX_PAGES=2 for free in this harness).
    await h.db.execute(sql`update subscriptions set status='expired' where id=${r.json().subscriptionId}`);
    state = (await h.request("GET", "/sites/" + a.site, undefined, a.cookie)).json();
    assert.equal(state.draft.pages.length, 5, "no content deleted");
    state.draft.pages[1].title = "Still editable";
    saved = await h.request("PUT", "/sites/" + a.site, { version: state.version, draft: state.draft }, a.cookie);
    assert.equal(saved.statusCode, 200, saved.body);
    state.draft.pages.push(page(9));
    const grow = await h.request("PUT", "/sites/" + a.site, { version: saved.json().version, draft: state.draft }, a.cookie);
    assert.equal(grow.json().error, "page_limit");
  } finally {
    await h.close();
  }
});

test("concurrent upload reservations never exceed the artwork quota", async () => {
  const h = await harness({ MAX_ARTWORKS: "3" });
  try {
    const a = await h.artist();
    const results = await Promise.all(
      Array.from({ length: 8 }, () => h.request("POST", `/sites/${a.site}/uploads`, { bytes: 1000 }, a.cookie)),
    );
    assert.equal(results.filter((r) => r.statusCode === 200).length, 3);
    assert(results.filter((r) => r.statusCode === 409).every((r) => r.json().error === "art_limit"));
  } finally {
    await h.close();
  }
});

test("retry after a lost provider response recovers the same invoice without duplicate subscriptions", async () => {
  const h = await harness();
  try {
    const a = await h.artist();
    const create = h.provider.createSubscription;
    let created = 0;
    h.provider.createSubscription = async details => {
      const remote = await create(details);
      if (++created === 1) throw Error("connection interrupted after remote creation");
      return remote;
    };
    const buy = () => h.request("POST", "/billing/checkout", {plan:"artist",cycle:"monthly",method:"card"}, a.cookie);
    assert.equal((await buy()).statusCode, 500);
    const [retry, concurrent] = await Promise.all([buy(), buy()]);
    assert.equal(retry.statusCode, 200);
    assert.equal(concurrent.statusCode, 200);
    assert.ok(retry.json().invoiceUrl);
    assert.deepEqual(retry.json(), concurrent.json());
    assert.equal(created, 1);
    assert.equal((await h.billing(a.cookie)).plan, "free");
  } finally {
    await h.close();
  }
});
