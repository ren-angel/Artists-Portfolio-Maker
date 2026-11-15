import { connect, sql, rows } from "@studio/db";
import { config } from "./config.ts";
import { storage } from "./storage.ts";
import { provider } from "./billing/index.ts";
import { maintain } from "./billing/service.ts";
import { recheckDomains } from "./domains.ts";
import { pruneAnalytics } from "./analytics.ts";
const env = config();
const { db, pool } = connect(env.DATABASE_URL);
const store = storage(env);
try {
  await db.execute(sql`delete from uploads where expires_at<=now()`);
  await db.execute(sql`delete from sessions where expires_at<=now()`);
  await db.execute(sql`delete from tokens where expires_at<=now()`);
  let count = 0;
  do {
    count = await db.transaction(async (tx) => {
      const keys = await rows<{ object_key: string }>(
        tx,
        sql`select object_key from garbage where created_at<now()-interval '1 hour' limit 100 for update skip locked`,
      );
      for (const { object_key } of keys) {
        await store.remove(object_key);
        await tx.execute(
          sql`delete from garbage where object_key=${object_key}`,
        );
      }
      return keys.length;
    });
  } while (count === 100);
  // Billing reconciliation, domain re-verification and analytics retention.
  // Each step is independent so one failing provider does not block others.
  for (const [name, step] of [
    ["billing", () => maintain(db, provider(env))],
    ["domains", () => recheckDomains(db, env)],
    ["analytics", () => pruneAnalytics(db, env)],
  ] as const)
    await step().catch((err: Error) =>
      console.error(JSON.stringify({ job: "maintenance", step: name, error: err.message })),
    );
} finally {
  await pool.end();
}
