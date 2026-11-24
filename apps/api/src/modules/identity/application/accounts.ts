import { sql, first, type Database, type Tx } from "@doodallery/db";
import type { Config } from "../../../platform/config.ts";
import { assert } from "../../../platform/errors.ts";
import { hashPassword, verifyPassword } from "../../../platform/crypto.ts";
import type { TokenPurpose } from "../domain/credentials.ts";
import {
  consumeEmailToken,
  createSession,
  insertAccount,
  issueEmailToken,
  passwordHashOf,
  recordEvent,
} from "../infrastructure/credential-store.ts";
import { deliver } from "../infrastructure/mailer.ts";

/* Account use cases. Routes translate HTTP to these calls and set cookies. */

export type IdentityHooks = {
  /** Stops recurring charges before an account row disappears. */
  beforeDelete?: (user: string) => Promise<void>;
  /** Releases media no longer referenced after a profile change. */
  releaseAssets?: (tx: Tx, site: string) => Promise<void>;
};

export function accounts(db: Database, env: Config, log: { error: (o: object, m: string) => void }) {
  async function send(email: string, purpose: TokenPurpose, secret: string) {
    try {
      await deliver(env, email, purpose, secret);
      return true;
    } catch {
      log.error({ purpose }, "Transactional email delivery failed");
      return false;
    }
  }

  return {
    async register(input: { email: string; password: string; displayName: string }) {
      const passwordHash = await hashPassword(input.password);
      const result = await db.transaction(async (tx) => {
        const user = await insertAccount(tx, { ...input, passwordHash });
        return {
          session: await createSession(tx, user),
          secret: await issueEmailToken(tx, user, "verify"),
        };
      });
      return {
        session: result.session,
        verificationSent: await send(input.email, "verify", result.secret),
      };
    },

    /** Returns a new session token. Verifies the password in constant work. */
    async login(email: string, password: string) {
      const u = await passwordHashOf(db, email);
      assert(
        (await verifyPassword(password, u?.password_hash)) && u,
        401,
        "invalid_credentials",
      );
      return db.transaction(async (tx) => {
        // A concurrent reset invalidates this attempt.
        assert(
          await first(
            tx,
            sql`select id from users where id=${u.id} and password_hash=${u.password_hash} for update`,
          ),
          401,
          "invalid_credentials",
        );
        return createSession(tx, u.id);
      });
    },

    /** Always succeeds so the response does not reveal registered emails. */
    async requestReset(email: string) {
      const u = await passwordHashOf(db, email);
      if (u)
        await send(email, "reset", await db.transaction((tx) => issueEmailToken(tx, u.id, "reset")));
    },

    async resendVerification(user: { id: string; email: string; verified: boolean }) {
      if (user.verified) return true;
      const secret = await db.transaction((tx) => issueEmailToken(tx, user.id, "verify"));
      return send(user.email, "verify", secret);
    },

    /** Consumes an email token. A reset replaces the password and ends every session. */
    async redeem(purpose: TokenPurpose, secret: string, newPassword?: string) {
      const hash = purpose === "reset" ? await hashPassword(newPassword!) : null;
      await db.transaction(async (tx) => {
        const user = await consumeEmailToken(tx, secret, purpose);
        assert(user, 400, "expired_token");
        if (hash) {
          await tx.execute(sql`update users set password_hash=${hash},updated_at=now() where id=${user}`);
          await tx.execute(sql`delete from sessions where user_id=${user}`);
        } else await tx.execute(sql`update users set verified=true,updated_at=now() where id=${user}`);
        await recordEvent(tx, user, purpose);
      });
    },

    async updateProfile(user: string, displayName: string, avatar: string | null, hooks: IdentityHooks) {
      await db.transaction(async (tx) => {
        // Serialize thumbnail replacement/deletion with profile updates.
        const ownedSites = await tx.execute(
          sql`select id from sites where owner_id=${user} order by id for update`,
        );
        if (avatar)
          assert(
            await first(
              tx,
              sql`select a.id from assets a join sites s on s.id=a.site_id where a.id=${avatar} and s.owner_id=${user}`,
            ),
            400,
            "invalid_asset",
          );
        await tx.execute(
          sql`update users set display_name=${displayName},avatar_asset=${avatar},updated_at=now() where id=${user}`,
        );
        for (const row of ownedSites.rows) await hooks.releaseAssets?.(tx, String(row.id));
      });
    },

    /** Rechecks the password, stops billing, then deletes the account. */
    async deleteAccount(user: string, password: string, hooks: IdentityHooks) {
      const current = await first<{ password_hash: string }>(
        db,
        sql`select password_hash from users where id=${user}`,
      );
      assert(await verifyPassword(password, current?.password_hash), 403, "invalid_credentials");
      await hooks.beforeDelete?.(user);
      assert(
        await first(
          db,
          sql`delete from users where id=${user} and password_hash=${current!.password_hash} returning id`,
        ),
        409,
        "conflict",
      );
    },
  };
}
