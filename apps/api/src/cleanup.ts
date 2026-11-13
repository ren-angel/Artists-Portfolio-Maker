import { connect, sql, rows } from "@studio/db";
import { config } from "./config.ts";
import { storage } from "./storage.ts";
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
} finally {
  await pool.end();
}
