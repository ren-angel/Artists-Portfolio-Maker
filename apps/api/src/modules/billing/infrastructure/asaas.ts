import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { PaymentStatus } from "@doodallery/shared";
import { ProviderError, type BillingProvider, type ProviderPayment } from "./provider.ts";

/* Asaas REST v3 client (docs.asaas.com, reviewed November 2026).
   - Auth: `access_token` request header.
   - Subscriptions: POST /v3/subscriptions, GET /v3/subscriptions/{id},
     GET /v3/subscriptions/{id}/payments, DELETE /v3/subscriptions/{id}.
   - Webhooks carry the configured authToken in `asaas-access-token`; delivery
     is at least once, so events are deduplicated by their `id`.
   - There is no idempotency-key header, so creation first looks up our own
     externalReference, and creation requests use a long timeout. */

const BASE = { sandbox: "https://api-sandbox.asaas.com", production: "https://api.asaas.com" };
const STATUS: Record<string, PaymentStatus> = {
  PENDING: "pending",
  AWAITING_RISK_ANALYSIS: "pending",
  CONFIRMED: "confirmed",
  RECEIVED: "confirmed",
  RECEIVED_IN_CASH: "confirmed",
  OVERDUE: "overdue",
  DUNNING_REQUESTED: "overdue",
  DUNNING_RECEIVED: "confirmed",
  REFUNDED: "refunded",
  REFUND_REQUESTED: "refunded",
  REFUND_IN_PROGRESS: "refunded",
  CHARGEBACK_REQUESTED: "refunded",
  CHARGEBACK_DISPUTE: "refunded",
  AWAITING_CHARGEBACK_REVERSAL: "refunded",
};
const payment = z.object({
  id: z.string(),
  status: z.string(),
  value: z.number(),
  dueDate: z.string(),
  paymentDate: z.string().nullish(),
  clientPaymentDate: z.string().nullish(),
  confirmedDate: z.string().nullish(),
  invoiceUrl: z.string().nullish(),
  billingType: z.string().nullish(),
  deleted: z.boolean().optional(),
});
const event = z.object({
  id: z.string(),
  event: z.string(),
  payment: z.object({ id: z.string(), subscription: z.string().nullish() }).partial().nullish(),
  subscription: z.object({ id: z.string() }).partial().nullish(),
});

export function asaas(opts: { apiKey: string; env: "sandbox" | "production"; webhookToken: string }): BillingProvider {
  const base = BASE[opts.env];
  async function call<T>(method: string, path: string, body?: object, timeout = 20_000): Promise<T> {
    let res: Response;
    try {
      res = await fetch(base + path, {
        method,
        signal: AbortSignal.timeout(timeout),
        headers: {
          access_token: opts.apiKey,
          "content-type": "application/json",
          "user-agent": "doodallery-billing",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      throw new ProviderError("Asaas unreachable: " + (err as Error).name);
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new ProviderError("Asaas " + method + " " + path.split("?")[0] + " " + res.status + " " + detail.slice(0, 200), res.status);
    }
    return (await res.json()) as T;
  }
  const map = (p: z.infer<typeof payment>): ProviderPayment => ({
    id: p.id,
    status: p.deleted ? "deleted" : (STATUS[p.status] ?? "pending"),
    amount: Math.round(p.value * 100),
    currency: "BRL",
    dueDate: p.dueDate,
    paidAt: p.confirmedDate ?? p.paymentDate ?? p.clientPaymentDate ?? null,
    invoiceUrl: p.invoiceUrl ?? null,
    method: p.billingType ?? null,
  });
  const token = Buffer.from(opts.webhookToken);
  return {
    name: "asaas",
    live: opts.env === "production",
    async ensureCustomer({ userId, name, email, taxId }) {
      const found = await call<{ data: { id: string }[] }>("GET", "/v3/customers?externalReference=" + encodeURIComponent(userId));
      if (found.data[0]) return found.data[0].id;
      if (!taxId) throw new ProviderError("tax_id_required", 400);
      const created = await call<{ id: string }>(
        "POST",
        "/v3/customers",
        { name, email, cpfCnpj: taxId.replace(/\D/g, ""), externalReference: userId },
        60_000,
      );
      return created.id;
    },
    async findSubscription(reference) {
      const r = await call<{ data: { id: string; deleted?: boolean }[] }>(
        "GET",
        "/v3/subscriptions?externalReference=" + encodeURIComponent(reference),
      );
      return r.data.find((s) => !s.deleted)?.id ?? null;
    },
    async createSubscription(s) {
      if (s.currency !== "BRL") throw new ProviderError("Asaas subscriptions are billed in BRL");
      const r = await call<{ id: string }>(
        "POST",
        "/v3/subscriptions",
        {
          customer: s.customer,
          billingType: s.method === "card" ? "CREDIT_CARD" : "PIX",
          value: s.amount / 100,
          nextDueDate: s.startsOn,
          cycle: s.cycle === "yearly" ? "YEARLY" : "MONTHLY",
          description: s.description.slice(0, 500),
          externalReference: s.reference,
        },
        60_000,
      );
      return r.id;
    },
    async getSubscription(id) {
      const sub = await call<{ id: string; status: string; deleted?: boolean }>("GET", "/v3/subscriptions/" + encodeURIComponent(id));
      const payments: ProviderPayment[] = [];
      for (let offset = 0; offset < 1000; offset += 100) {
        const page = await call<{ data: unknown[]; hasMore: boolean }>(
          "GET",
          "/v3/subscriptions/" + encodeURIComponent(id) + "/payments?limit=100&offset=" + offset,
        );
        payments.push(...page.data.map((p) => map(payment.parse(p))));
        if (!page.hasMore) break;
      }
      return { id: sub.id, ended: Boolean(sub.deleted) || sub.status !== "ACTIVE", payments };
    },
    async cancelSubscription(id) {
      try {
        await call("DELETE", "/v3/subscriptions/" + encodeURIComponent(id));
      } catch (err) {
        // Already removed at the provider: the desired end state holds.
        if ((err as ProviderError).status !== 404) throw err;
      }
    },
    verifyWebhook(headers) {
      const given = headers["asaas-access-token"];
      if (typeof given !== "string") return false;
      const b = Buffer.from(given);
      return b.length === token.length && timingSafeEqual(b, token);
    },
    parseEvent(body) {
      const e = event.parse(body);
      return {
        eventId: e.id,
        type: e.event,
        subscriptionId: e.payment?.subscription ?? e.subscription?.id ?? null,
      };
    },
  };
}
