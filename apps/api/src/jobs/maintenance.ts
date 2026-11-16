import { connect, sql } from "@studio/db";
import { config } from "../platform/config.ts";
import { collectGarbage, expireReservations, storage } from "../modules/media/index.ts";
import { maintain, provider } from "../modules/billing/index.ts";
import { recheckDomains } from "../modules/domains/index.ts";
import { pruneAnalytics } from "../modules/analytics/index.ts";

/* Hourly maintenance (`pnpm cleanup`). Each step is independent so one
   failing provider does not block the others. Logs one JSON line per failure. */

const env = config();
const { db, pool } = connect(env.DATABASE_URL);
const store = storage(env);
try {
  await expireReservations(db);
  await db.execute(sql`delete from sessions where expires_at<=now()`);
  await db.execute(sql`delete from tokens where expires_at<=now()`);
  await collectGarbage(db, store);
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
