import { z } from "zod";

/* Identity rules: credential formats, lifetimes and the session cookie
   policy. No HTTP or database dependencies. */

export const emailSchema = z
  .email()
  .max(254)
  .transform((s) => s.toLowerCase());
export const passwordSchema = z.string().min(12).max(256);
export const credentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export const registrationSchema = credentialsSchema.extend({
  displayName: z.string().trim().min(1).max(80),
  // The registration form requires accepting the current terms.
  accept: z.literal(true),
});
export const loginSchema = credentialsSchema.extend({
  remember: z.boolean().default(true),
});
export const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  avatar: z.uuid().nullable(),
});
/** Email links carry a 32-byte base64url token in the URL fragment. */
export const emailTokenSchema = z.string().length(43);

export type TokenPurpose = "verify" | "reset";
export const SESSION_DAYS = 14;
export const EMAIL_TOKEN_MINUTES = 30;

/** Production uses a host-only __Host- cookie; it requires Secure and path=/. */
export function sessionCookie(production: boolean) {
  return {
    name: production ? "__Host-session" : "studio_session",
    options: {
      httpOnly: true,
      secure: production,
      sameSite: "lax" as const,
      path: "/",
    },
    maxAge: SESSION_DAYS * 86400,
  };
}

/** The signed-in artist as every other module sees it. */
export type Account = {
  id: string;
  email: string;
  displayName: string;
  verified: boolean;
  avatar: string | null;
  restricted: boolean;
};
