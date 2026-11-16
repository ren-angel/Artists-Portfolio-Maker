import { sql, first, rows, type Database } from "@studio/db";
import type { Config } from "../../../platform/config.ts";
import { assert } from "../../../platform/errors.ts";
import { evaluateDns, UNVERIFIED_RETENTION_DAYS, verifyName } from "../domain/hostname.ts";
import { realNetwork, type Network } from "../infrastructure/network.ts";

const quiet = <T>(p: Promise<T[]>) => p.catch(() => [] as T[]);

/** Checks DNS proof and routing for one domain, then probes TLS. */
export async function checkDomain(db: Database, env: Config, net: Network, id: string) {
  const d = await first<{ hostname: string; token: string; site_id: string }>(
    db,
    sql`select hostname,token,site_id from domains where id=${id}`,
  );
  assert(d, 404, "domain_missing");
  const result = evaluateDns(
    {
      txt: await quiet(net.txt(verifyName(d.hostname))),
      cname: await quiet(net.cname(d.hostname)),
      a: await quiet(net.a(d.hostname)),
    },
    d,
    { cname: env.DOMAIN_TARGET, ip: env.DOMAIN_TARGET_IP },
  );
  const { owned, dnsOk } = result;
  // The edge asks the API during the first TLS handshake. Commit the DNS
  // proof before probing so on-demand issuance can succeed on this check.
  const checked = await first<{ stamp: string }>(db, sql`
    update domains set status=${owned ? "verified" : "failed"}, dns_ok=${dnsOk},
      tls_ok=tls_ok and ${owned && dnsOk}, is_primary=is_primary and ${owned && dnsOk},
      last_error=${result.error},
      checked_at=clock_timestamp(), verified_at=case when ${owned} then coalesce(verified_at,now()) else verified_at end
    where id=${id} returning checked_at::text as stamp`);
  if (!checked || !owned || !dnsOk) return;
  const tlsOk = env.DOMAIN_TLS_CHECK === "probe" && (await net.tls(d.hostname));
  await db.transaction(async (tx) => {
    await tx.execute(sql`select id from sites where id=${d.site_id} for update`);
    // A newer DNS result or a disconnect supersedes an outstanding handshake.
    await tx.execute(sql`update domains set tls_ok=${tlsOk},
      last_error=${tlsOk ? null : "tls_pending"},
      is_primary=${tlsOk} and (is_primary or not exists (
        select 1 from domains where site_id=${d.site_id} and is_primary))
      where id=${id} and checked_at=${checked.stamp}::timestamptz`);
  });
}

/** Daily re-verification so a domain whose TXT proof disappears (for
    example after expiry or a transfer) stops routing instead of lingering. */
export async function recheckDomains(db: Database, env: Config, net: Network = realNetwork) {
  for (const d of await rows<{ id: string }>(
    db,
    sql`select id from domains where checked_at is null or checked_at < now()-interval '1 day' order by checked_at nulls first limit 200`,
  ))
    await checkDomain(db, env, net, d.id).catch(() => {});
  await db.execute(
    sql`delete from domains where status<>'verified' and created_at < now()-make_interval(days => ${UNVERIFIED_RETENTION_DAYS})`,
  );
}
