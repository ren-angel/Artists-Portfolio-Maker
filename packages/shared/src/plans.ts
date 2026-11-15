/* Central plan catalog. Entitlements (limits and features) are separate from
   prices and from display text. Prices are defaults; operators override them
   with PLAN_PRICES and every purchase snapshots the price it was sold at. */

export const planIds = ["free", "artist", "studio"] as const;
export type PlanId = (typeof planIds)[number];
export const cycles = ["monthly", "yearly"] as const;
export type Cycle = (typeof cycles)[number];
export const methods = ["card", "pix"] as const;
export type Method = (typeof methods)[number];

export type Limits = {
  sites: number;
  pages: number;
  artworks: number;
  storage: number;
  upload: number;
};
export type Features = {
  customDomain: boolean;
  removeBranding: boolean;
  commissions: boolean;
  /** basic: template, palette, typeface, navigation. more: shape, shadow,
      hover, aspect, footer, extra type and palettes. advanced: grid styles
      and section background images. */
  appearance: "basic" | "more" | "advanced";
  analytics: "basic" | "advanced";
};
export type Plan = { id: PlanId; rank: number; limits: Limits; features: Features };
export type Price = { amount: number; currency: string };
export type PriceBook = Record<Exclude<PlanId, "free">, Record<Cycle, Price>>;

const MB = 1024 ** 2;
export const plans: Record<PlanId, Plan> = {
  free: {
    id: "free",
    rank: 0,
    limits: { sites: 1, pages: 5, artworks: 50, storage: 200 * MB, upload: 12 * MB },
    features: { customDomain: false, removeBranding: false, commissions: false, appearance: "basic", analytics: "basic" },
  },
  artist: {
    id: "artist",
    rank: 1,
    limits: { sites: 1, pages: 15, artworks: 350, storage: 2048 * MB, upload: 12 * MB },
    features: { customDomain: true, removeBranding: true, commissions: true, appearance: "more", analytics: "basic" },
  },
  studio: {
    id: "studio",
    rank: 2,
    limits: { sites: 1, pages: 30, artworks: 1500, storage: 10240 * MB, upload: 12 * MB },
    features: { customDomain: true, removeBranding: true, commissions: true, appearance: "advanced", analytics: "advanced" },
  },
};

/** Default prices in minor units (centavos). Annual prices carry the annual
    discount explicitly so the catalog never computes money from floats. */
export const defaultPrices: PriceBook = {
  artist: { monthly: { amount: 1290, currency: "BRL" }, yearly: { amount: 12900, currency: "BRL" } },
  studio: { monthly: { amount: 2490, currency: "BRL" }, yearly: { amount: 24900, currency: "BRL" } },
};

/** Parses an operator override such as
    {"artist":{"monthly":1490,"yearly":14900},"studio":{...}} (BRL centavos). */
export function priceBook(json?: string): PriceBook {
  const book = structuredClone(defaultPrices);
  if (!json) return book;
  const raw = JSON.parse(json) as Partial<Record<keyof PriceBook, Partial<Record<Cycle, number | Price>>>>;
  for (const plan of ["artist", "studio"] as const)
    for (const cycle of cycles) {
      const v = raw[plan]?.[cycle];
      if (v === undefined) continue;
      const price = typeof v === "number" ? { amount: v, currency: "BRL" } : v;
      if (!Number.isInteger(price.amount) || price.amount <= 0 || !/^[A-Z]{3}$/.test(price.currency))
        throw Error("Invalid PLAN_PRICES entry for " + plan + "." + cycle);
      book[plan][cycle] = price;
    }
  return book;
}

export const isPlan = (v: unknown): v is PlanId => planIds.includes(v as PlanId);

/** Limits for a plan; the free tier honours the deployment's MAX_* overrides. */
export function limitsFor(plan: PlanId, freeOverride?: Partial<Limits>): Limits {
  return plan === "free" ? { ...plans.free.limits, ...freeOverride } : plans[plan].limits;
}

export function formatMoney(price: Price, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: price.currency }).format(price.amount / 100);
}

/* Subscription lifecycle. `derive` is pure so that duplicate or out-of-order
   provider events converge on the same result: it only looks at the current
   provider state and confirmed payment records, never at event order. */

export const subscriptionStatuses = [
  "pending", // checkout started, no confirmed payment yet
  "active", // a confirmed payment covers now
  "past_due", // paid period ended, renewal not confirmed, still within grace
  "canceling", // cancellation requested; access continues until period end
  "canceled", // ended by the artist or provider; now on the free plan
  "expired", // never paid, or grace elapsed without payment
] as const;
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];
export const paymentStatuses = ["pending", "overdue", "confirmed", "refunded", "failed", "deleted"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export const GRACE_DAYS = 7;
export const PENDING_DAYS = 7;
const DAY = 86_400_000;

export type PaymentRecord = { status: PaymentStatus; periodEnd: Date | null };
export type SubscriptionFacts = {
  status: SubscriptionStatus;
  createdAt: Date;
  /** The artist asked to cancel; we already stopped future provider charges. */
  cancelRequested: boolean;
  /** The provider no longer has this subscription (deleted or inactive). */
  providerEnded: boolean;
};
export type Derived = { status: SubscriptionStatus; periodEnd: Date | null; graceUntil: Date | null };

export function derive(s: SubscriptionFacts, payments: PaymentRecord[], now: Date): Derived {
  const paid = payments.filter((p) => p.status === "confirmed" && p.periodEnd);
  const periodEnd = paid.length ? new Date(Math.max(...paid.map((p) => p.periodEnd!.getTime()))) : null;
  const covered = periodEnd !== null && periodEnd > now;
  if (s.status === "canceled" || s.status === "expired") return { status: s.status, periodEnd, graceUntil: null };
  if (s.createdAt > now) return {status: s.cancelRequested || s.providerEnded ? "canceled" : "pending", periodEnd, graceUntil: null};
  if (s.cancelRequested || s.providerEnded)
    return { status: covered ? "canceling" : "canceled", periodEnd, graceUntil: null };
  if (covered) return { status: "active", periodEnd, graceUntil: null };
  if (periodEnd) {
    const graceUntil = new Date(periodEnd.getTime() + GRACE_DAYS * DAY);
    return { status: graceUntil > now ? "past_due" : "expired", periodEnd, graceUntil };
  }
  return {
    status: now.getTime() - s.createdAt.getTime() < PENDING_DAYS * DAY ? "pending" : "expired",
    periodEnd: null,
    graceUntil: null,
  };
}

/** Statuses that grant the subscribed plan (time limits applied in SQL too). */
export const grantingStatuses: SubscriptionStatus[] = ["active", "past_due", "canceling"];

export function addCycle(date: Date, cycle: Cycle) {
  const d = new Date(date);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + (cycle === "yearly" ? 12 : 1));
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  d.setUTCDate(Math.min(date.getUTCDate(), last.getUTCDate()));
  return d;
}

/** Brazilian CPF/CNPJ check digits; formatting characters are ignored. */
export function validTaxId(value: string) {
  const d = value.replace(/\D/g, "");
  if (!/^(\d{11}|\d{14})$/.test(d) || /^(\d)\1+$/.test(d)) return false;
  const digit = (base: string, weights: number[]) => {
    const sum = weights.reduce((acc, w, i) => acc + Number(base[i]) * w, 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  if (d.length === 11) {
    const w = (n: number) => Array.from({ length: n }, (_, i) => n + 1 - i);
    return digit(d, w(9)) === Number(d[9]) && digit(d, w(10)) === Number(d[10]);
  }
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, ...w1];
  return digit(d, w1) === Number(d[12]) && digit(d, w2) === Number(d[13]);
}
