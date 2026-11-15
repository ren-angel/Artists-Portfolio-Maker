import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { timingSafeEqual } from "node:crypto";
import { addCycle, type Cycle } from "@studio/shared";
import type { BillingProvider, NewSubscription, ProviderPayment } from "./provider.ts";

/* Test-mode provider. It never moves money: payments only change when the
   developer presses a button on the local mock invoice page or a test calls
   `act`. Each change produces a webhook-shaped event that goes through the
   same recording and reconciliation path as real provider events. */

type State = {
  customers: Record<string, string>;
  subs: Record<string, NewSubscription & { id: string; ended: boolean; payments: ProviderPayment[] }>;
  seq: number;
};
export type MockAction = "confirm" | "fail" | "refund" | "renew";
export type MockProvider = BillingProvider & {
  act(paymentId: string, action: MockAction): { eventId: string; type: string; subscriptionId: string };
  payment(paymentId: string): (ProviderPayment & { subscriptionId: string; cycle: Cycle }) | null;
};

export function mock(opts: { dir?: string; origin: string; webhookToken: string }): MockProvider {
  const file = opts.dir ? join(opts.dir, "billing-mock.json") : null;
  let state: State = { customers: {}, subs: {}, seq: 0 };
  if (file)
    try {
      state = JSON.parse(readFileSync(file, "utf8"));
    } catch {
      /* first run */
    }
  const save = () => {
    if (!file) return;
    mkdirSync(opts.dir!, { recursive: true, mode: 0o700 });
    writeFileSync(file, JSON.stringify(state), { mode: 0o600 });
  };
  const next = (prefix: string) => prefix + "_" + (++state.seq).toString(36) + Math.random().toString(36).slice(2, 6);
  const invoice = (s: State["subs"][string], dueDate: string): ProviderPayment => {
    const id = next("pay");
    return {
      id,
      status: "pending",
      amount: s.amount,
      currency: s.currency,
      dueDate,
      paidAt: null,
      invoiceUrl: opts.origin + "/billing/mock/" + id,
      method: s.method === "card" ? "CREDIT_CARD" : "PIX",
    };
  };
  const find = (paymentId: string) => {
    for (const s of Object.values(state.subs)) {
      const p = s.payments.find((x) => x.id === paymentId);
      if (p) return { s, p };
    }
    return null;
  };
  const token = Buffer.from(opts.webhookToken);
  return {
    name: "mock",
    live: false,
    async ensureCustomer({ userId }) {
      state.customers[userId] ??= next("cus");
      save();
      return state.customers[userId];
    },
    async findSubscription(reference) {
      return Object.values(state.subs).find((s) => s.reference === reference && !s.ended)?.id ?? null;
    },
    async createSubscription(n) {
      const id = next("sub");
      const s = { ...n, id, ended: false, payments: [] as ProviderPayment[] };
      s.payments.push(invoice(s, n.startsOn));
      state.subs[id] = s;
      save();
      return id;
    },
    async getSubscription(id) {
      const s = state.subs[id];
      if (!s) throw Error("Unknown mock subscription");
      return { id, ended: s.ended, payments: structuredClone(s.payments) };
    },
    async cancelSubscription(id) {
      const s = state.subs[id];
      if (!s) return;
      s.ended = true;
      for (const p of s.payments) if (p.status === "pending" || p.status === "overdue") p.status = "deleted";
      save();
    },
    verifyWebhook(headers) {
      const given = headers["asaas-access-token"];
      return typeof given === "string" && given.length === token.length && timingSafeEqual(Buffer.from(given), token);
    },
    parseEvent(body) {
      const e = body as { id: string; event: string; payment?: { subscription?: string } };
      return { eventId: e.id, type: e.event, subscriptionId: e.payment?.subscription ?? null };
    },
    payment(paymentId) {
      const f = find(paymentId);
      return f ? { ...f.p, subscriptionId: f.s.id, cycle: f.s.cycle } : null;
    },
    act(paymentId, action) {
      const f = find(paymentId);
      if (!f || f.s.ended) throw Error("Unknown or ended mock payment");
      const { s, p } = f;
      let type = "PAYMENT_UPDATED";
      if (action === "confirm") {
        p.status = "confirmed";
        p.paidAt = new Date().toISOString();
        type = "PAYMENT_CONFIRMED";
      } else if (action === "fail") {
        p.status = "overdue";
        type = s.method === "card" ? "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED" : "PAYMENT_OVERDUE";
      } else if (action === "refund") {
        p.status = "refunded";
        type = "PAYMENT_REFUNDED";
      } else {
        const last = s.payments.at(-1)!;
        s.payments.push(invoice(s, addCycle(new Date(last.dueDate + "T00:00:00Z"), s.cycle).toISOString().slice(0, 10)));
        type = "PAYMENT_CREATED";
      }
      save();
      return { eventId: next("evt"), type, subscriptionId: s.id };
    },
  };
}
