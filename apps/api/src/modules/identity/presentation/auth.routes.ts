import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import type { Database } from "@doodallery/db";
import type { Config } from "../../../platform/config.ts";
import { Fault } from "../../../platform/errors.ts";
import {
  emailSchema,
  emailTokenSchema,
  loginSchema,
  passwordSchema,
  profileSchema,
  registrationSchema,
  sessionCookie,
} from "../domain/credentials.ts";
import { accounts, type IdentityHooks } from "../application/accounts.ts";
import { deleteSession } from "../infrastructure/credential-store.ts";
import { account } from "./current-account.ts";

export function authRoutes(
  app: FastifyInstance,
  db: Database,
  env: Config,
  hooks: IdentityHooks = {},
) {
  const limit = {
    config: { rateLimit: { max: 10, timeWindow: "10 minutes" } },
  };
  const cookie = sessionCookie(env.NODE_ENV === "production");
  const use = accounts(db, env, app.log);
  function setSession(reply: FastifyReply, raw: string, remember = true) {
    reply.setCookie(cookie.name, raw, {
      ...cookie.options,
      ...(remember ? { maxAge: cookie.maxAge } : {}),
    });
  }

  app.post("/auth/register", limit, async (req, reply) => {
    const { email, password, displayName } = registrationSchema.parse(req.body);
    const result = await use.register({ email, password, displayName });
    setSession(reply, result.session);
    return reply.code(201).send({ ok: true, verificationSent: result.verificationSent });
  });
  app.post("/auth/login", limit, async (req, reply) => {
    const { email, password, remember } = loginSchema.parse(req.body);
    setSession(reply, await use.login(email, password), remember);
    return { ok: true };
  });
  app.post("/auth/logout", async (req, reply) => {
    await deleteSession(db, req.cookies[cookie.name] ?? "");
    reply.clearCookie(cookie.name, cookie.options);
    return { ok: true };
  });
  app.post("/auth/forgot", limit, async (req) => {
    const { email } = z.object({ email: emailSchema }).parse(req.body);
    await use.requestReset(email);
    return { ok: true };
  });
  app.post("/auth/resend", limit, async (req) => {
    const u = await account(db, req, env);
    if (!(await use.resendVerification(u))) throw new Fault(503, "mail_failed");
    return { ok: true };
  });
  for (const purpose of ["verify", "reset"] as const)
    app.post("/auth/" + purpose, limit, async (req) => {
      const body = z
        .object({ token: emailTokenSchema, password: passwordSchema.optional() })
        .parse(req.body);
      const password =
        purpose === "reset" ? passwordSchema.parse(body.password) : undefined;
      await use.redeem(purpose, body.token, password);
      return { ok: true };
    });
  app.get("/me", async (req) => account(db, req, env));
  app.patch("/me", async (req) => {
    const u = await account(db, req, env);
    const { displayName, avatar } = profileSchema.parse(req.body);
    await use.updateProfile(u.id, displayName, avatar, hooks);
    return { ok: true };
  });
  app.delete("/me", limit, async (req, reply) => {
    const u = await account(db, req, env);
    const { password } = z.object({ password: passwordSchema }).parse(req.body);
    await use.deleteAccount(u.id, password, hooks);
    reply.clearCookie(cookie.name, cookie.options);
    return { ok: true };
  });
}
