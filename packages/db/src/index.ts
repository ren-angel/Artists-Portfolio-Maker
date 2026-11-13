import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql, type SQL } from "drizzle-orm";
import * as schema from "./schema.ts";
export { sql, schema };
export function connect(url: string) {
  const pool = new pg.Pool({
    connectionString: url,
    max: 10,
    connectionTimeoutMillis: 5000,
  });
  return { pool, db: drizzle(pool, { schema }) };
}
export type Database = ReturnType<typeof connect>["db"];
export type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];
export async function rows<T>(db: Database | Tx, query: SQL): Promise<T[]> {
  return (await db.execute(query)).rows as T[];
}
export async function first<T>(
  db: Database | Tx,
  query: SQL,
): Promise<T | undefined> {
  return (await rows<T>(db, query))[0];
}
