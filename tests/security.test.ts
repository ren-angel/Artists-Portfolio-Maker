import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { HTTPMethods } from "fastify";
import { createApp } from "../apps/api/src/app.ts";
import { config } from "../apps/api/src/platform/config.ts";
import { mock } from "../apps/api/src/modules/billing/infrastructure/mock.ts";

/* HTTP security boundaries: browser origin checks for mutations, secrets
   for webhooks and internal routes, authentication rate limits, response
   headers and error bodies that reveal no internals. */

const webhookToken = "test-webhook-token-0123456789abcdef0123";
const internalToken = "test-internal-token-0123456789abcdef";

test("mutations, webhooks and internal routes reject callers without the right proof", async () => {
  assert(process.env.TEST_DATABASE_URL, "Provide a migrated TEST_DATABASE_URL");
  const origin = "http://localhost:3000";
  const env = config({
    NODE_ENV: "test",
    APP_ORIGIN: origin,
    PLATFORM_DOMAIN: "localhost",
    DATABASE_URL: process.env.TEST_DATABASE_URL,
    LOCAL_DATA_DIR: await mkdtemp(join(tmpdir(), "studio-security-")),
    BILLING_WEBHOOK_TOKEN: webhookToken,
    INTERNAL_TOKEN: internalToken,
  });
  const app = await createApp(env, mock({ origin, webhookToken }));
  const send = (method: HTTPMethods, url: string, headers: Record<string, string> = {}, payload?: object) =>
    app.inject({ method, url, headers, payload });
  const browser = { origin, "x-studio-request": "1" };
  try {
    const email = "sec-" + crypto.randomUUID().slice(0, 8) + "@example.test";
    const account = { email, password: "a-long-security-password", displayName: "Sec", accept: true };

    // Cross-site form posts and scripted requests without the custom header are refused.
    const refused: Record<string, string>[] = [{}, { origin: "https://evil.example" }, { origin }, { "x-studio-request": "1" }];
    for (const headers of refused) {
      const r = await send("POST", "/auth/register", headers, account);
      assert.equal(r.statusCode, 403, JSON.stringify(headers));
      assert.deepEqual(r.json(), { error: "invalid_origin" });
    }
    const registered = await send("POST", "/auth/register", browser, account);
    assert.equal(registered.statusCode, 201);
    const cookie = registered.cookies[0];
    assert.equal(cookie.httpOnly, true);
    assert.equal(cookie.sameSite, "Lax");
    assert.equal(cookie.path, "/");

    // Every response is private and not sniffable.
    const me = await send("GET", "/me", { cookie: cookie.name + "=" + cookie.value });
    assert.equal(me.statusCode, 200);
    assert.equal(me.headers["cache-control"], "private, no-store");
    assert.equal(me.headers["x-content-type-options"], "nosniff");
    assert.equal(me.headers["referrer-policy"], "no-referrer");
    assert.ok(!("password_hash" in me.json()) && !("passwordHash" in me.json()));

    // A forged session cookie is anonymous.
    assert.equal((await send("GET", "/me", { cookie: cookie.name + "=" + "A".repeat(43) })).statusCode, 401);

    // Payment webhooks require the provider's shared secret.
    const event = { id: "evt_" + crypto.randomUUID(), event: "PAYMENT_CONFIRMED", payment: { id: "pay_x", subscription: "sub_x" } };
    assert.equal((await send("POST", "/billing/webhooks/mock", {}, event)).statusCode, 401);
    assert.equal((await send("POST", "/billing/webhooks/mock", { "asaas-access-token": "wrong" }, event)).statusCode, 401);

    // Internal routes require the web server's token (constant-time compared).
    const hit = { handle: "nobody", kind: "view", path: "/", agent: "Mozilla/5.0" };
    for (const token of [undefined, "", internalToken.slice(0, -1), internalToken + "x"]) {
      const headers: Record<string, string> = token === undefined ? {} : { "x-internal-token": token };
      assert.equal((await send("POST", "/internal/analytics/hit", headers, hit)).statusCode, 401);
      assert.equal((await send("GET", "/internal/domains/resolve?host=art.example.org", headers)).statusCode, 401);
    }
    assert.equal((await send("POST", "/internal/analytics/hit", { "x-internal-token": internalToken }, hit)).statusCode, 200);

    // Invalid input yields a stable code, not validation internals.
    const invalid = await send("POST", "/auth/login", browser, { email: "not-an-email", password: "x" });
    assert.equal(invalid.statusCode, 400);
    assert.deepEqual(invalid.json(), { error: "invalid_input" });

    // Credential guessing is rate limited per client.
    let limited = false;
    for (let i = 0; i < 12 && !limited; i++) {
      const r = await send("POST", "/auth/login", browser, { email, password: "wrong-password-" + i });
      if (r.statusCode === 429) {
        limited = true;
        assert.deepEqual(r.json(), { error: "rate_limit" });
      } else assert.equal(r.statusCode, 401);
    }
    assert.ok(limited, "login attempts are rate limited");
  } finally {
    await app.close();
  }
});

test("behind a trusted proxy, rate limits apply per client and server calls are exempt", async () => {
  assert(process.env.TEST_DATABASE_URL, "Provide a migrated TEST_DATABASE_URL");
  const origin = "http://localhost:3000";
  const env = config({
    NODE_ENV: "test",
    APP_ORIGIN: origin,
    PLATFORM_DOMAIN: "localhost",
    DATABASE_URL: process.env.TEST_DATABASE_URL,
    LOCAL_DATA_DIR: await mkdtemp(join(tmpdir(), "studio-proxy-")),
    INTERNAL_TOKEN: internalToken,
    TRUST_PROXY: "127.0.0.1, ::1",
  });
  const app = await createApp(env, mock({ origin, webhookToken }));
  const login = (client: string) =>
    app.inject({
      method: "POST",
      url: "/auth/login",
      remoteAddress: "127.0.0.1",
      headers: { origin, "x-studio-request": "1", "x-forwarded-for": client },
      payload: { email: "nobody-" + client + "@example.test", password: "wrong-password-123" },
    });
  try {
    const statuses = [];
    for (let i = 0; i < 11; i++) statuses.push((await login("198.51.100.7")).statusCode);
    assert.equal(statuses.at(-1), 429, "the guessing client is limited");
    assert.equal((await login("203.0.113.9")).statusCode, 401, "another client behind the same proxy is not");
    // A spoofed address prepended by the client does not escape the limit:
    // the right-most untrusted hop is the one the edge observed.
    assert.equal((await login("10.9.9.9, 198.51.100.7")).statusCode, 429);

    const health = (headers: Record<string, string>) =>
      app.inject({ method: "GET", url: "/health", remoteAddress: "127.0.0.1", headers });
    assert.ok("x-ratelimit-remaining" in (await health({})).headers);
    assert.ok(!("x-ratelimit-remaining" in (await health({ "x-internal-token": internalToken })).headers));
    assert.ok("x-ratelimit-remaining" in (await health({ "x-internal-token": "wrong" })).headers);
  } finally {
    await app.close();
  }
});
