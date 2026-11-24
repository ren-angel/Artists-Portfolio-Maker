import { sql, first, type Database, type Tx } from "@doodallery/db";
import { limitsFor, plans, type PlanId } from "@doodallery/shared";
import type { Config } from "../../../platform/config.ts";

/* The effective plan is derived from stored subscription rows and their
   confirmed periods. Public pages and quota checks never call the payment
   provider, so a provider outage cannot take portfolios offline. */
export const planSql = (user: unknown) => sql`coalesce((
  select plan from subscriptions
  where user_id=${user} and status in ('active','past_due','canceling')
    and greatest(period_end, coalesce(grace_until, period_end)) > now()
  order by case plan when 'studio' then 2 else 1 end desc limit 1), 'free')`;

export async function planOf(db: Database | Tx, user: string): Promise<PlanId> {
  return (await first<{ plan: PlanId }>(db, sql`select ${planSql(user)} as plan`))!.plan;
}

export function limits(env: Config, plan: PlanId) {
  const l = limitsFor(plan, {
    pages: env.MAX_PAGES,
    artworks: env.MAX_ARTWORKS,
    storage: env.MAX_STORAGE_BYTES,
    sites: env.MAX_SITES,
  });
  return { ...l, upload: env.MAX_UPLOAD_BYTES };
}

export async function entitlement(db: Database | Tx, env: Config, user: string) {
  const plan = await planOf(db, user);
  return { plan, limits: limits(env, plan), features: plans[plan].features };
}
