import { sql, first, rows, type Database, type Tx } from "@doodallery/db";
import {
  addCycle,
  derive,
  plans,
  type Cycle,
  type Method,
  type PaymentStatus,
  type PlanId,
  type SubscriptionStatus,
} from "@doodallery/shared";
import type { Config } from "../../../platform/config.ts";
import { assert } from "../../../platform/errors.ts";
import type { BillingProvider, ProviderEvent } from "../infrastructure/provider.ts";

export type SubscriptionRow = {
  id: string;
  user_id: string | null;
  provider: string;
  provider_subscription_id: string | null;
  plan: Exclude<PlanId, "free">;
  cycle: Cycle;
  method: Method;
  amount: number;
  currency: string;
  status: SubscriptionStatus;
  period_end: Date | null;
  grace_until: Date | null;
  cancel_requested_at: Date | null;
  provider_ended: boolean;
  starts_at: string | Date;
  replaces: string | null;
  created_at: Date;
};
const OPEN = sql`('pending','active','past_due','canceling')`;
// Raw queries return timestamps as strings; normalize before comparing.
const day = (d: string | Date) => new Date(d).toISOString().slice(0, 10);

/** Applies stored payment records (optionally refreshed from the provider)
    to one locked subscription row and records any transition. */
async function apply(tx: Tx, s: SubscriptionRow, providerEnded = s.provider_ended) {
  const payments = await rows<{ status: PaymentStatus; period_end: Date | null }>(
    tx,
    sql`select status,period_end from payments where subscription_id=${s.id}`,
  );
  // Pending purchases expire PENDING_DAYS after their first due date.
  const startsAt = new Date(day(s.starts_at) + "T00:00:00Z");
  const next = derive(
    { status: s.status, createdAt: startsAt, cancelRequested: Boolean(s.cancel_requested_at), providerEnded },
    payments.map((p) => ({ status: p.status, periodEnd: p.period_end ? new Date(p.period_end) : null })),
    new Date(),
  );
  await tx.execute(
    sql`update subscriptions set status=${next.status},period_end=${next.periodEnd},grace_until=${next.graceUntil},provider_ended=${providerEnded},updated_at=now() where id=${s.id}`,
  );
  if (next.status !== s.status) {
    await tx.execute(
      sql`insert into events(user_id,event) values(${s.user_id},${"subscription_" + next.status})`,
    );
    // A confirmed replacement ends the subscription it replaces: upgrades
    // take over immediately, scheduled downgrades were already canceled.
    if (next.status === "active" && s.replaces)
      await tx.execute(
        sql`update subscriptions set cancel_requested_at=coalesce(cancel_requested_at,now()),status=case when status in ('active','past_due','pending') then 'canceled' else status end,updated_at=now() where id=${s.replaces} and status in ${OPEN}`,
      );
  }
  return next;
}

/** Stops provider charges for every subscription we asked to end. Runs after
    commits and again from maintenance until the provider confirms. */
export async function stopCharges(db: Database, provider: BillingProvider, ids?: string[]) {
  if (ids && !ids.length) return;
  const due = await rows<{ id: string; provider_subscription_id: string }>(
    db,
    ids
      ? sql`select id,provider_subscription_id from subscriptions where id in (select value::uuid from jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb)) and cancel_requested_at is not null and not provider_ended and provider_subscription_id is not null`
      : sql`select id,provider_subscription_id from subscriptions where provider=${provider.name} and cancel_requested_at is not null and not provider_ended and provider_subscription_id is not null limit 200`,
  );
  for (const s of due)
    try {
      await provider.cancelSubscription(s.provider_subscription_id);
      await db.execute(sql`update subscriptions set provider_ended=true,updated_at=now() where id=${s.id}`);
    } catch (err) {
      await db.execute(sql`update subscriptions set sync_error=${"cancel: " + String((err as Error).message).slice(0, 280)} where id=${s.id}`);
    }
}

/** Re-reads one subscription from the provider under a row lock, so
    concurrent and out-of-order events serialize and converge. */
export async function sync(db: Database, provider: BillingProvider, id: string) {
  const next = await db.transaction(async (tx) => {
    const s = await first<SubscriptionRow>(tx, sql`select * from subscriptions where id=${id} for update`);
    assert(s, 404, "subscription_missing");
    if (!s.provider_subscription_id) return apply(tx, s);
    try {
      const remote = await provider.getSubscription(s.provider_subscription_id);
      for (const p of remote.payments) {
        const confirmed = p.status === "confirmed";
        // A paid period starts at the later of its due date and the
        // previous period end, so early renewals never lose days.
        const due = new Date(p.dueDate + "T00:00:00Z");
        await tx.execute(
          sql`insert into payments(subscription_id,provider_payment_id,status,amount,currency,due_date,paid_at,period_end,invoice_url,method)
            values(${s.id},${p.id},${p.status},${p.amount},${p.currency},${p.dueDate},${p.paidAt},${confirmed ? addCycle(due, s.cycle) : null},${p.invoiceUrl},${p.method})
            on conflict(subscription_id,provider_payment_id) do update set status=excluded.status,amount=excluded.amount,paid_at=excluded.paid_at,
            period_end=case when excluded.status='confirmed' then coalesce(payments.period_end,excluded.period_end) else null end,
            invoice_url=excluded.invoice_url,method=excluded.method,updated_at=now()`,
        );
      }
      await tx.execute(sql`update subscriptions set synced_at=now(),sync_error=null where id=${s.id}`);
      return apply(tx, s, remote.ended);
    } catch (err) {
      throw Object.assign(err as Error, { subscription: s.id });
    }
  }).catch(async (err: Error & { subscription?: string }) => {
    if (err.subscription)
      await db.execute(sql`update subscriptions set sync_error=${String(err.message).slice(0, 300)} where id=${err.subscription}`);
    throw err;
  });
  const replaced = await first<{ replaces: string | null }>(db, sql`select replaces from subscriptions where id=${id}`);
  if (replaced?.replaces) await stopCharges(db, provider, [replaced.replaces]);
  return next;
}

export async function recordEvent(db: Database, providerName: string, e: ProviderEvent, payload: unknown) {
  const row = await first<{ id: string }>(
    db,
    sql`insert into provider_events(provider,event_id,type,object_id,payload) values(${providerName},${e.eventId},${e.type},${e.subscriptionId},${JSON.stringify(payload)}::jsonb)
      on conflict(provider,event_id) do nothing returning id`,
  );
  return row?.id ?? null;
}

/** Processes one recorded event. Duplicates were dropped at insert time; a
    retry after failure re-reads provider state, so it is always safe. */
export async function processEvent(db: Database, provider: BillingProvider, eventId: string) {
  const e = await first<{ object_id: string | null; processed_at: Date | null }>(
    db,
    sql`select object_id,processed_at from provider_events where id=${eventId}`,
  );
  if (!e || e.processed_at) return;
  try {
    const s = e.object_id
      ? await first<{ id: string }>(
          db,
          sql`select id from subscriptions where provider=${provider.name} and provider_subscription_id=${e.object_id}`,
        )
      : undefined;
    if (e.object_id && !s) throw Error("no_matching_subscription");
    if (s) await sync(db, provider, s.id);
    await db.execute(
      sql`update provider_events set processed_at=now(),attempts=attempts+1,last_error=${s ? null : "no_matching_subscription"} where id=${eventId}`,
    );
  } catch (err) {
    await db.execute(
      sql`update provider_events set attempts=attempts+1,last_error=${String((err as Error).message).slice(0, 300)} where id=${eventId}`,
    );
  }
}

type Checkout = { plan: Exclude<PlanId, "free">; cycle: Cycle; method: Method; taxId?: string; name?: string };

export async function checkout(
  db: Database,
  provider: BillingProvider,
  env: Config,
  user: { id: string; email: string; displayName: string; verified: boolean; restricted: boolean },
  req: Checkout,
) {
  assert(user.verified, 403, "verify_email");
  assert(!user.restricted, 403, "account_restricted");
  const price = env.prices[req.plan][req.cycle];
  // Serialize purchases per account.
  type Planned = { id: string; abandoned: string[] };
  const plan = await db.transaction(async (tx): Promise<Planned> => {
    await tx.execute(sql`select id from users where id=${user.id} for update`);
    const open = await rows<SubscriptionRow>(
      tx,
      sql`select * from subscriptions where user_id=${user.id} and status in ${OPEN} order by created_at`,
    );
    const pending = open.find((s) => s.status === "pending");
    if (pending && pending.plan === req.plan && pending.cycle === req.cycle && pending.method === req.method)
      return { id: pending.id, abandoned: [] };
    const current = open.find((s) => s.status !== "pending");
    // Starting a different purchase abandons the unpaid one.
    for (const p of open.filter((s) => s.status === "pending"))
      await tx.execute(sql`update subscriptions set status='expired',cancel_requested_at=now() where id=${p.id}`);
    const abandoned = open.filter((s) => s.status === "pending").map((s) => s.id);
    let startsOn = new Date().toISOString().slice(0, 10);
    let replaces: string | null = null;

    if (current) {
      const rank = plans[req.plan].rank - plans[current.plan].rank;
      const same = rank === 0 && req.cycle === current.cycle;
      assert(!(same && current.status !== "canceling"), 409, "already_subscribed");
      replaces = current.id;
      // Downgrades, cycle changes and resubscribing after a cancellation
      // start when the paid period ends; upgrades start now (no proration).
      if ((rank < 0 || current.status === "canceling" || rank === 0) && current.period_end) {
        startsOn = new Date(current.period_end).toISOString().slice(0, 10);

      }
    }
    const row = await first<{ id: string }>(
      tx,
      sql`insert into subscriptions(user_id,provider,plan,cycle,method,amount,currency,starts_at,replaces)
        values(${user.id},${provider.name},${req.plan},${req.cycle},${req.method},${price.amount},${price.currency},${startsOn},${replaces}) returning id`,
    );
    return { id: row!.id, abandoned };
  });
  await stopCharges(db, provider, plan.abandoned);
  // The durable local ID survives an interrupted creation. Lock the row on
  // retry and look up the provider reference before issuing another charge.
  const replaces = await db.transaction(async tx => {
    const row = await first<SubscriptionRow>(tx, sql`select * from subscriptions
      where id=${plan.id} and user_id=${user.id} for update`);
    assert(row && !row.cancel_requested_at && ["pending", "active"].includes(row.status), 409, "conflict");
    if (!row.provider_subscription_id) {
      const known = await first<{provider_customer_id: string}>(tx, sql`select provider_customer_id
        from billing_customers where user_id=${user.id} and provider=${provider.name}`);
      const customer = known?.provider_customer_id ?? await provider.ensureCustomer({
        userId: user.id, name: req.name || user.displayName, email: user.email, taxId: req.taxId,
      });
      await tx.execute(sql`insert into billing_customers(user_id,provider,provider_customer_id)
        values(${user.id},${provider.name},${customer}) on conflict(user_id) do update
        set provider=excluded.provider,provider_customer_id=excluded.provider_customer_id`);
      const remote = await provider.findSubscription(row.id) ?? await provider.createSubscription({
        customer, reference: row.id, cycle: row.cycle, method: row.method, amount: row.amount,
        currency: row.currency, startsOn: day(row.starts_at), description: "Plano " + row.plan + " (" + row.cycle + ")",
      });
      await tx.execute(sql`update subscriptions set provider_subscription_id=${remote} where id=${row.id}`);
    }
    if (!row.replaces) return null;
    // Schedule non-renewal only after the replacement exists at the provider.
    const previous = await first<{id: string}>(tx, sql`update subscriptions set cancel_requested_at=coalesce(cancel_requested_at,now())
      where id=${row.replaces} and status in ${OPEN} and
      (plan=${row.plan} or plan='studio' or cancel_requested_at is not null) returning id`);
    return previous?.id;
  });
  if (replaces) {
    await stopCharges(db, provider, [replaces]);
    await sync(db, provider, replaces);
  }
  return invoiceFor(db, provider, plan.id);
}

async function invoiceFor(db: Database, provider: BillingProvider, id: string) {
  await sync(db, provider, id);
  const p = await first<{ invoice_url: string | null; due_date: string }>(
    db,
    sql`select invoice_url,due_date::text from payments where subscription_id=${id} and status in ('pending','overdue') order by due_date limit 1`,
  );
  return { subscriptionId: id, invoiceUrl: p?.invoice_url ?? null, dueDate: p?.due_date ?? null };
}

export async function cancel(db: Database, provider: BillingProvider, user: string, id: string) {
  const s = await db.transaction(async (tx) => {
    const row = await first<SubscriptionRow>(
      tx,
      sql`select * from subscriptions where id=${id} and user_id=${user} and status in ${OPEN} for update`,
    );
    assert(row, 404, "subscription_missing");
    await tx.execute(sql`update subscriptions set cancel_requested_at=coalesce(cancel_requested_at,now()) where id=${id}`);
    // Future plans that were waiting on this one are canceled with it.
    await tx.execute(
      sql`update subscriptions set status='expired',cancel_requested_at=now() where replaces=${id} and status='pending'`,
    );
    return row;
  });
  const queued = await rows<{ id: string }>(db, sql`select id from subscriptions where replaces=${id} and status='expired'`);
  await stopCharges(db, provider, [s.id, ...queued.map((q) => q.id)]);
  return sync(db, provider, id).catch(() =>
    db.transaction(async (tx) => {
      const row = await first<SubscriptionRow>(tx, sql`select * from subscriptions where id=${id} for update`);
      return apply(tx, row!);
    }),
  );
}

/** Hourly maintenance: retries unprocessed events, applies time-based
    transitions locally, and re-reads only purchases awaiting payment or in
    grace (bounded polling as a backstop for missed webhooks). */
export async function maintain(db: Database, provider: BillingProvider) {
  for (const e of await rows<{ id: string }>(
    db,
    sql`select id from provider_events where processed_at is null and attempts<10 and received_at<now()-interval '1 minute' order by received_at limit 200`,
  ))
    await processEvent(db, provider, e.id);
  for (const s of await rows<{ id: string; status: string; synced_at: string | null }>(
    db,
    sql`select id,status,synced_at from subscriptions where status in ${OPEN} and provider=${provider.name}`,
  )) {
    const stale = !s.synced_at || Date.now() - new Date(s.synced_at).getTime() > 6 * 3600_000;
    if ((s.status === "pending" || s.status === "past_due") && stale) await sync(db, provider, s.id).catch(() => {});
    else
      await db.transaction(async (tx) => {
        const row = await first<SubscriptionRow>(tx, sql`select * from subscriptions where id=${s.id} for update`);
        if (row) await apply(tx, row);
      });
  }
  await stopCharges(db, provider);
  await db.execute(sql`delete from provider_events where processed_at < now()-interval '180 days'`);
}


/** Ends every open purchase of an account (used before deletion). Failed
    provider calls stay flagged and are retried by maintenance. */
export async function endAll(db: Database, provider: BillingProvider, user: string) {
  const open = await rows<{ id: string }>(
    db,
    sql`update subscriptions set cancel_requested_at=coalesce(cancel_requested_at,now()) where user_id=${user} and status in ${OPEN} returning id`,
  );
  await stopCharges(db, provider, open.map((o) => o.id));
}
