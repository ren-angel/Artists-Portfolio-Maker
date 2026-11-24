import { sql, first, type Database, type Tx } from "@doodallery/db";
import { legalDocuments, requiredConsents } from "@doodallery/shared";
import { digest, token } from "../../../platform/crypto.ts";
import {
  EMAIL_TOKEN_MINUTES,
  SESSION_DAYS,
  type Account,
  type TokenPurpose,
} from "../domain/credentials.ts";

/* PostgreSQL persistence for accounts, sessions and single-use email tokens.
   Only SHA-256 digests of session and email tokens are stored. */

export async function accountForSession(db: Database, raw: string) {
  return first<Account>(
    db,
    sql`select u.id,email,display_name as "displayName",verified,avatar_asset as avatar,restricted_at is not null as restricted
      from sessions s join users u on u.id=s.user_id where s.digest=${digest(raw)} and s.expires_at>now()`,
  );
}

export async function createSession(tx: Tx, user: string) {
  const raw = token();
  await tx.execute(
    sql`insert into sessions values(${digest(raw)},${user},now()+make_interval(days => ${SESSION_DAYS}))`,
  );
  return raw;
}

export async function deleteSession(db: Database, raw: string) {
  await db.execute(sql`delete from sessions where digest=${digest(raw)}`);
}

/** Issues a new token for the purpose, replacing any earlier one. */
export async function issueEmailToken(tx: Tx, user: string, purpose: TokenPurpose) {
  const secret = token();
  await tx.execute(
    sql`insert into tokens values(${digest(secret)},${user},${purpose},now()+make_interval(mins => ${EMAIL_TOKEN_MINUTES}))
      on conflict(user_id,purpose) do update set digest=excluded.digest,expires_at=excluded.expires_at`,
  );
  return secret;
}

/** Consumes a valid token exactly once and returns its owner. */
export async function consumeEmailToken(tx: Tx, secret: string, purpose: TokenPurpose) {
  return (
    await first<{ user_id: string }>(
      tx,
      sql`delete from tokens where digest=${digest(secret)} and purpose=${purpose} and expires_at>now() returning user_id`,
    )
  )?.user_id;
}

export async function insertAccount(
  tx: Tx,
  a: { email: string; passwordHash: string; displayName: string },
) {
  const u = await first<{ id: string }>(
    tx,
    sql`insert into users(email,password_hash,display_name) values(${a.email},${a.passwordHash},${a.displayName}) returning id`,
  );
  await tx.execute(sql`insert into entitlements(user_id) values(${u!.id})`);
  for (const d of requiredConsents)
    await tx.execute(
      sql`insert into consents(user_id,document,version) values(${u!.id},${d},${legalDocuments[d]})`,
    );
  return u!.id;
}

export const passwordHashOf = (db: Database | Tx, email: string) =>
  first<{ id: string; password_hash: string }>(
    db,
    sql`select id,password_hash from users where email=${email}`,
  );

export async function recordEvent(db: Database | Tx, user: string, event: string) {
  await db.execute(sql`insert into events(user_id,event) values(${user},${event})`);
}
