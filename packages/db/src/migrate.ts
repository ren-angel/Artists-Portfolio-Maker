import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { connect, sql, first } from "./index.ts";
const url = process.env.DIRECT_DATABASE_URL;
if (!url) throw Error("DIRECT_DATABASE_URL is required");
const { pool, db } = connect(url);
const folder = new URL("../migrations/", import.meta.url);
try {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(73479215)`);
    await tx.execute(
      sql`create table if not exists schema_migrations(name text primary key,digest text not null,applied_at timestamptz default now())`,
    );
    for (const name of (await readdir(folder))
      .filter((n) => /^\d+_.*\.sql$/.test(n))
      .sort()) {
      const source = await readFile(new URL(name, folder), "utf8");
      const digest = createHash("sha256").update(source).digest("hex");
      const existing = await first<{ digest: string }>(
        tx,
        sql`select digest from schema_migrations where name=${name}`,
      );
      if (existing && existing.digest !== digest)
        throw Error("Applied migration changed: " + name);
      if (existing) continue;
      await tx.execute(sql.raw(source));
      await tx.execute(
        sql`insert into schema_migrations(name,digest) values(${name},${digest})`,
      );
      console.info("Applied", name);
    }
  });
} finally {
  await pool.end();
}
