import type { FastifyRequest } from "fastify";
import type { Database } from "@doodallery/db";
import type { Config } from "../../../platform/config.ts";
import { assert } from "../../../platform/errors.ts";
import { sessionCookie } from "../domain/credentials.ts";
import { accountForSession } from "../infrastructure/credential-store.ts";

export const cookieName = (env: Config) =>
  sessionCookie(env.NODE_ENV === "production").name;

/** Resolves the session cookie to an account or fails with 401. */
export async function account(db: Database, req: FastifyRequest, env: Config) {
  const raw = req.cookies[cookieName(env)];
  assert(raw, 401, "unauthorized");
  const user = await accountForSession(db, raw);
  assert(user, 401, "unauthorized");
  return user;
}
