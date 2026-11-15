import test from "node:test";
import assert from "node:assert/strict";
import { asaas } from "../apps/api/src/billing/asaas.ts";

/* Contract test for the Asaas client: request shapes, auth header, status
   mapping and webhook authentication. fetch is stubbed; nothing leaves the
   machine and no money moves. */

type Call = { method: string; url: string; headers: Record<string, string>; body: unknown };
function stub(responses: Record<string, unknown>) {
  const calls: Call[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    const key = (init.method ?? "GET") + " " + url.replace(/^https:\/\/[^/]+/, "").split("?")[0];
    calls.push({ method: init.method ?? "GET", url, headers: init.headers as Record<string, string>, body: init.body ? JSON.parse(String(init.body)) : undefined });
    const value = responses[key];
    if (value === undefined) return new Response("not found", { status: 404 });
    return new Response(JSON.stringify(value), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  return { calls, restore: () => (globalThis.fetch = original) };
}

const token = "webhook-token-for-tests-0123456789abcdef";

test("Asaas client sends documented requests and maps provider state", async () => {
  const s = stub({
    "GET /v3/customers": { data: [] },
    "POST /v3/customers": { id: "cus_1" },
    "GET /v3/subscriptions": { data: [] },
    "POST /v3/subscriptions": { id: "sub_1" },
    "GET /v3/subscriptions/sub_1": { id: "sub_1", status: "ACTIVE" },
    "GET /v3/subscriptions/sub_1/payments": {
      hasMore: false,
      data: [
        { id: "pay_1", status: "CONFIRMED", value: 12.9, dueDate: "2026-11-13", confirmedDate: "2026-11-13", invoiceUrl: "https://sandbox.asaas.com/i/1", billingType: "CREDIT_CARD" },
        { id: "pay_2", status: "OVERDUE", value: 12.9, dueDate: "2026-12-13", invoiceUrl: "https://sandbox.asaas.com/i/2", billingType: "CREDIT_CARD" },
        { id: "pay_3", status: "REFUNDED", value: 12.9, dueDate: "2026-10-13" },
        { id: "pay_4", status: "PENDING", value: 12.9, dueDate: "2027-01-13", deleted: true },
      ],
    },
  });
  try {
    const p = asaas({ apiKey: "$aact_test", env: "sandbox", webhookToken: token });
    assert.equal(p.live, false);
    const customer = await p.ensureCustomer({ userId: "u1", name: "Luna", email: "l@example.org", taxId: "529.982.247-25" });
    assert.equal(customer, "cus_1");
    const created = s.calls.find((c) => c.method === "POST" && c.url.endsWith("/v3/customers"))!;
    assert.match(created.url, /^https:\/\/api-sandbox\.asaas\.com\//);
    assert.equal(created.headers.access_token, "$aact_test");
    assert.deepEqual(created.body, { name: "Luna", email: "l@example.org", cpfCnpj: "52998224725", externalReference: "u1" });

    assert.equal(await p.findSubscription("ref-1"), null);
    const id = await p.createSubscription({ customer, reference: "ref-1", cycle: "yearly", method: "pix", amount: 12900, currency: "BRL", startsOn: "2026-11-13", description: "Plano" });
    assert.equal(id, "sub_1");
    assert.deepEqual(s.calls.find((c) => c.method === "POST" && c.url.endsWith("/v3/subscriptions"))!.body, {
      customer: "cus_1",
      billingType: "PIX",
      value: 129,
      nextDueDate: "2026-11-13",
      cycle: "YEARLY",
      description: "Plano",
      externalReference: "ref-1",
    });
    await assert.rejects(p.createSubscription({ customer, reference: "x", cycle: "monthly", method: "card", amount: 100, currency: "USD", startsOn: "2026-11-13", description: "" }));

    const sub = await p.getSubscription("sub_1");
    assert.equal(sub.ended, false);
    assert.deepEqual(
      sub.payments.map((x) => [x.id, x.status, x.amount]),
      [["pay_1", "confirmed", 1290], ["pay_2", "overdue", 1290], ["pay_3", "refunded", 1290], ["pay_4", "deleted", 1290]],
    );
    // Removing an already-removed subscription is treated as success.
    await p.cancelSubscription("sub_gone");
  } finally {
    s.restore();
  }
});

test("Asaas webhooks authenticate with the shared token and expose the subscription", () => {
  const p = asaas({ apiKey: "k", env: "production", webhookToken: token });
  assert.equal(p.live, true);
  assert.equal(p.verifyWebhook({ "asaas-access-token": token }), true);
  assert.equal(p.verifyWebhook({ "asaas-access-token": token.slice(0, -1) + "x" }), false);
  assert.equal(p.verifyWebhook({}), false);
  assert.deepEqual(p.parseEvent({ id: "evt_1", event: "PAYMENT_CONFIRMED", dateCreated: "2026-11-13", payment: { id: "pay_1", subscription: "sub_1" } }), {
    eventId: "evt_1",
    type: "PAYMENT_CONFIRMED",
    subscriptionId: "sub_1",
  });
  assert.equal(p.parseEvent({ id: "evt_2", event: "SUBSCRIPTION_DELETED", subscription: { id: "sub_9" } }).subscriptionId, "sub_9");
  assert.throws(() => p.parseEvent({ event: "PAYMENT_CONFIRMED" }));
});
