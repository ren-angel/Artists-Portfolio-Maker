import { sql, rows, type Database } from "@doodallery/db";
import type { Storage } from "../infrastructure/object-storage.ts";

/** Removes queued objects older than the one-hour grace period, in batches. */
export async function collectGarbage(db: Database, store: Storage) {
  let count = 0;
  do {
    count = await db.transaction(async (tx) => {
      const keys = await rows<{ object_key: string }>(
        tx,
        sql`select object_key from garbage where created_at<now()-interval '1 hour' limit 100 for update skip locked`,
      );
      for (const { object_key } of keys) {
        await store.remove(object_key);
        await tx.execute(sql`delete from garbage where object_key=${object_key}`);
      }
      return keys.length;
    });
  } while (count === 100);
}

/** Expires stale upload reservations, sessions and email tokens. */
export async function expireReservations(db: Database) {
  await db.execute(sql`delete from uploads where expires_at<=now()`);
}
