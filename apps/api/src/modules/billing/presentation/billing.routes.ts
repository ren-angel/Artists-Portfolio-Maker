import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { sql, first, rows, type Database } from "@studio/db";
import { cycles, formatMoney, methods, plans, validTaxId } from "@studio/shared";
import type { Config } from "../../../platform/config.ts";
import { account } from "../../identity/index.ts";
import { assert } from "../../../platform/errors.ts";
import { entitlement, limits } from "../../entitlements/index.ts";
import { usage } from "../../media/index.ts";
import type { BillingProvider } from "../infrastructure/provider.ts";
import { isMock } from "../infrastructure/provider-factory.ts";
import { cancel, checkout, processEvent, recordEvent, sync } from "../application/subscriptions.ts";

export function billingRoutes(app: FastifyInstance, db: Database, env: Config, provider: BillingProvider) {
  const limited = { config: { rateLimit: { max: 10, timeWindow: "10 minutes" } } };

  app.get("/billing/plans", async () => ({
    provider: provider.name,
    live: provider.live,
    plans: Object.values(plans).map((p) => ({
      id: p.id,
      limits: limits(env, p.id),
      features: p.features,
      prices: p.id === "free" ? null : env.prices[p.id],
    })),
    methods: {
      card: { recurring: true },
      // Pix subscriptions issue one invoice per cycle that the artist pays.
      pix: { recurring: false },
    },
  }));

  app.get("/billing", async (req) => {
    const u = await account(db, req, env);
    const e = await entitlement(db, env, u.id);
    const site = await first<{ id: string; pages: number }>(
      db,
      sql`select s.id,(select count(*)::int from pages p where p.site_id=s.id) as pages from sites s where owner_id=${u.id} order by created_at limit 1`,
    );
    const used = site ? await db.transaction((tx) => usage(tx, site.id)) : { art: 0, bytes: 0 };
    const subscriptions = await rows<Record<string,unknown>>(
      db,
      sql`select id,plan,cycle,method,amount,currency,status,period_end as "periodEnd",grace_until as "graceUntil",
        cancel_requested_at as "cancelRequestedAt",starts_at::text as "startsAt",replaces,created_at as "createdAt"
        from subscriptions where user_id=${u.id} order by created_at desc limit 10`,
    );
    const payments = await rows(
      db,
      sql`select p.id,p.subscription_id as "subscriptionId",p.status,p.amount,p.currency,p.due_date::text as "dueDate",p.paid_at as "paidAt",p.invoice_url as "invoiceUrl",p.method,s.plan
        from payments p join subscriptions s on s.id=p.subscription_id where s.user_id=${u.id} and p.status<>'deleted' order by p.due_date desc limit 24`,
    );
    return {
      ...e,
      usage: { artworks: Number(used.art), storage: Number(used.bytes), pages: Math.max(0, (site?.pages ?? 1) - 1) },
      subscriptions: subscriptions.map(s => ({...s, periodEnd:s.periodEnd ? new Date(String(s.periodEnd)).toISOString() : null})),
      payments,
      provider: provider.name,
      live: provider.live,
    };
  });

  app.post("/billing/checkout", limited, async (req) => {
    const u = await account(db, req, env);
    const body = z
      .object({
        plan: z.enum(["artist", "studio"]),
        cycle: z.enum(cycles),
        method: z.enum(methods),
        taxId: z.string().max(20).optional(),
        name: z.string().trim().min(1).max(120).optional(),
      })
      .parse(req.body);
    if (body.taxId) assert(validTaxId(body.taxId), 400, "invalid_tax_id");
    const known = await first(db, sql`select 1 from billing_customers where user_id=${u.id} and provider=${provider.name}`);
    assert(known || body.taxId || isMock(provider), 400, "tax_id_required");
    const result = await checkout(db, provider, env, u, body);
    req.log.info({ subscription: result.subscriptionId, plan: body.plan, price: formatMoney(env.prices[body.plan][body.cycle], "pt-BR") }, "Checkout started");
    return result;
  });

  // Called when the artist returns from the hosted invoice. The redirect
  // proves nothing; this re-reads the provider before reporting status.
  app.post("/billing/sync", limited, async (req) => {
    const u = await account(db, req, env);
    let failed = false;
    for (const s of await rows<{ id: string }>(
      db,
      sql`select id from subscriptions where user_id=${u.id} and status in ('pending','active','past_due','canceling')`,
    ))
      await sync(db, provider, s.id).catch(() => {
        failed = true;
        req.log.warn({ subscription: s.id }, "Billing sync failed");
      });
    assert(!failed, 503, "billing_sync_failed");
    return { ok: true };
  });

  app.post("/billing/cancel", limited, async (req) => {
    const u = await account(db, req, env);
    const { subscriptionId } = z.object({ subscriptionId: z.uuid() }).parse(req.body);
    const next = await cancel(db, provider, u.id, subscriptionId);
    await db.execute(sql`insert into events(user_id,event) values(${u.id},'subscription_cancel_requested')`);
    return next;
  });

  // Provider webhooks: authenticate, persist, answer 200 quickly, then
  // reconcile. Asaas treats any response other than 200 as a failure.
  app.post("/billing/webhooks/" + provider.name, async (req, reply) => {
    assert(provider.verifyWebhook(req.headers), 401, "invalid_webhook");
    const e = provider.parseEvent(req.body);
    const id = await recordEvent(db, provider.name, e, req.body);
    if (id) setImmediate(() => void processEvent(db, provider, id));
    return reply.code(200).send({ ok: true, duplicate: !id });
  });

  if (isMock(provider) && env.NODE_ENV !== "production") {
    const owned = async (userId: string, paymentId: string) => {
      const p = provider.payment(paymentId);
      assert(p, 404, "payment_missing");
      assert(
        await first(db, sql`select 1 from subscriptions where user_id=${userId} and provider_subscription_id=${p.subscriptionId}`),
        404,
        "payment_missing",
      );
      return p;
    };
    app.get("/billing/mock/:payment", async (req) => {
      const u = await account(db, req, env);
      return owned(u.id, (req.params as { payment: string }).payment);
    });
    app.post("/billing/mock/:payment/:action", async (req) => {
      const u = await account(db, req, env);
      const { payment, action } = z
        .object({ payment: z.string(), action: z.enum(["confirm", "fail", "refund", "renew"]) })
        .parse(req.params);
      await owned(u.id, payment);
      const e = provider.act(payment, action);
      // Delivered through the same path as an authenticated webhook.
      const id = await recordEvent(db, provider.name, e, { id: e.eventId, event: e.type, payment: { id: payment, subscription: e.subscriptionId } });
      if (id) await processEvent(db, provider, id);
      return { ok: true, event: e.type };
    });
  }
}
