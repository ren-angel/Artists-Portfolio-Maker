/* Identity & Access: registration, sign-in, sessions, email verification,
   password reset, profile and account deletion. */
export { account, cookieName } from "./presentation/current-account.ts";
export { authRoutes } from "./presentation/auth.routes.ts";
export type { Account } from "./domain/credentials.ts";
export type { IdentityHooks } from "./application/accounts.ts";
