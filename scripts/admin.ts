import { connect, sql, first } from "@studio/db";

/* Grants or revokes platform administration: pnpm admin grant person@example.com */
const [action, email] = process.argv.slice(2);
if (!["grant", "revoke"].includes(action) || !email) {
  console.error("Usage: pnpm admin grant|revoke <email>");
  process.exit(1);
}
const { db, pool } = connect(process.env.DATABASE_URL!);
try {
  const u = await first<{ id: string }>(db, sql`select id from users where email=${email.toLowerCase()}`);
  if (!u) throw Error("No account with that email");
  if (action === "grant") await db.execute(sql`insert into admins(user_id) values(${u.id}) on conflict do nothing`);
  else await db.execute(sql`delete from admins where user_id=${u.id}`);
  await db.execute(sql`insert into admin_audit(admin_id,action,target) values(null,${"cli_" + action + "_admin"},${u.id})`);
  console.info(action === "grant" ? "Granted" : "Revoked", "administration for", email);
} finally {
  await pool.end();
}
