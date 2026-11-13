import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { sql, first, type Database, type Tx } from "@studio/db";
import type { Config } from "./config.ts";
import { assert, Fault } from "./errors.ts";
import { token, digest, hashPassword, verifyPassword } from "./security.ts";
import { deliver } from "./mail.ts";
import { prune } from "./drafts.ts";
const emailSchema = z
  .email()
  .max(254)
  .transform((s) => s.toLowerCase());
const passwordSchema = z.string().min(12).max(256);
const credentials = z.object({ email: emailSchema, password: passwordSchema });
type Account = {
  id: string;
  email: string;
  displayName: string;
  verified: boolean;
  avatar: string | null;
};
export function cookieName(env: Config) {
  return env.NODE_ENV === "production" ? "__Host-session" : "studio_session";
}
export async function account(db: Database, req: FastifyRequest, env: Config) {
  const raw = req.cookies[cookieName(env)];
  assert(raw, 401, "unauthorized");
  const user = await first<Account>(
    db,
    sql`select u.id,email,display_name as "displayName",verified,avatar_asset as avatar from sessions s join users u on u.id=s.user_id where s.digest=${digest(raw)} and s.expires_at>now()`,
  );
  assert(user, 401, "unauthorized");
  return user;
}
export function authRoutes(app: FastifyInstance, db: Database, env: Config) {
  const limit = {
    config: { rateLimit: { max: 10, timeWindow: "10 minutes" } },
  };
  const options = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  async function session(tx: Tx, id: string) {
    const raw = token();
    await tx.execute(
      sql`insert into sessions values(${digest(raw)},${id},now()+interval '14 days')`,
    );
    return raw;
  }
  function set(reply: FastifyReply, raw: string) {
    reply.setCookie(cookieName(env), raw, { ...options, maxAge: 14 * 86400 });
  }
  async function issue(tx: Tx, id: string, purpose: "verify" | "reset") {
    const secret = token();
    await tx.execute(
      sql`insert into tokens values(${digest(secret)},${id},${purpose},now()+interval '30 minutes') on conflict(user_id,purpose) do update set digest=excluded.digest,expires_at=excluded.expires_at`,
    );
    return secret;
  }
  async function send(
    email: string,
    purpose: "verify" | "reset",
    secret: string,
  ) {
    try {
      await deliver(env, email, purpose, secret);
      return true;
    } catch {
      app.log.error({ purpose }, "Transactional email delivery failed");
      return false;
    }
  }
  app.post("/auth/register", limit, async (req, reply) => {
    const { email, password, displayName } = credentials
      .extend({ displayName: z.string().trim().min(1).max(80) })
      .parse(req.body);
    const hash = await hashPassword(password);
    const result = await db.transaction(async (tx) => {
      const u = await first<{ id: string }>(
        tx,
        sql`insert into users(email,password_hash,display_name) values(${email},${hash},${displayName}) returning id`,
      );
      await tx.execute(sql`insert into entitlements(user_id) values(${u!.id})`);
      return {
        session: await session(tx, u!.id),
        secret: await issue(tx, u!.id, "verify"),
      };
    });
    const verificationSent = await send(email, "verify", result.secret);
    set(reply, result.session);
    return reply.code(201).send({ ok: true, verificationSent });
  });
  app.post("/auth/login", limit, async (req, reply) => {
    const { email, password } = credentials.parse(req.body);
    const u = await first<{ id: string; password_hash: string }>(
      db,
      sql`select id,password_hash from users where email=${email}`,
    );
    assert(
      (await verifyPassword(password, u?.password_hash)) && u,
      401,
      "invalid_credentials",
    );
    const raw = await db.transaction(async (tx) => {
      assert(
        await first(
          tx,
          sql`select id from users where id=${u.id} and password_hash=${u.password_hash} for update`,
        ),
        401,
        "invalid_credentials",
      );
      return session(tx, u.id);
    });
    set(reply, raw);
    return { ok: true };
  });
  app.post("/auth/logout", async (req, reply) => {
    await db.execute(
      sql`delete from sessions where digest=${digest(req.cookies[cookieName(env)] ?? "")}`,
    );
    reply.clearCookie(cookieName(env), options);
    return { ok: true };
  });
  app.post("/auth/forgot", limit, async (req) => {
    const { email } = z.object({ email: emailSchema }).parse(req.body);
    const u = await first<{ id: string }>(
      db,
      sql`select id from users where email=${email}`,
    );
    if (u)
      await send(
        email,
        "reset",
        await db.transaction((tx) => issue(tx, u.id, "reset")),
      );
    return { ok: true };
  });
  app.post("/auth/resend", limit, async (req) => {
    const u = await account(db, req, env);
    if (!u.verified) {
      const secret = await db.transaction((tx) => issue(tx, u.id, "verify"));
      if (!(await send(u.email, "verify", secret)))
        throw new Fault(503, "mail_failed");
    }
    return { ok: true };
  });
  for (const purpose of ["verify", "reset"] as const)
    app.post("/auth/" + purpose, limit, async (req) => {
      const body = z
        .object({
          token: z.string().length(43),
          password: passwordSchema.optional(),
        })
        .parse(req.body);
      const hash =
        purpose === "reset"
          ? await hashPassword(passwordSchema.parse(body.password))
          : null;
      await db.transaction(async (tx) => {
        const record = await first<{ user_id: string }>(
          tx,
          sql`delete from tokens where digest=${digest(body.token)} and purpose=${purpose} and expires_at>now() returning user_id`,
        );
        assert(record, 400, "expired_token");
        if (hash) {
          await tx.execute(
            sql`update users set password_hash=${hash},updated_at=now() where id=${record.user_id}`,
          );
          await tx.execute(
            sql`delete from sessions where user_id=${record.user_id}`,
          );
        } else
          await tx.execute(
            sql`update users set verified=true,updated_at=now() where id=${record.user_id}`,
          );
        await tx.execute(
          sql`insert into events(user_id,event) values(${record.user_id},${purpose})`,
        );
      });
      return { ok: true };
    });
  app.get("/me", async (req) => account(db, req, env));
  app.patch("/me", async (req) => {
    const u = await account(db, req, env);
    const { displayName, avatar } = z
      .object({
        displayName: z.string().trim().min(1).max(80),
        avatar: z.uuid().nullable(),
      })
      .parse(req.body);
    await db.transaction(async (tx) => {
      // Serialize thumbnail replacement/deletion with profile updates.
      const ownedSites = await tx.execute(
        sql`select id from sites where owner_id=${u.id} order by id for update`,
      );
      if (avatar)
        assert(
          await first(
            tx,
            sql`select a.id from assets a join sites s on s.id=a.site_id where a.id=${avatar} and s.owner_id=${u.id}`,
          ),
          400,
          "invalid_asset",
        );
      await tx.execute(
        sql`update users set display_name=${displayName},avatar_asset=${avatar},updated_at=now() where id=${u.id}`,
      );
      for (const row of ownedSites.rows) await prune(tx, String(row.id));
    });
    return { ok: true };
  });
  app.delete("/me", limit, async (req, reply) => {
    const u = await account(db, req, env);
    const { password } = z.object({ password: passwordSchema }).parse(req.body);
    const current = await first<{ password_hash: string }>(
      db,
      sql`select password_hash from users where id=${u.id}`,
    );
    assert(
      await verifyPassword(password, current?.password_hash),
      403,
      "invalid_credentials",
    );
    assert(
      await first(
        db,
        sql`delete from users where id=${u.id} and password_hash=${current!.password_hash} returning id`,
      ),
      409,
      "conflict",
    );
    reply.clearCookie(cookieName(env), options);
    return { ok: true };
  });
}
