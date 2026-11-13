import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Config } from "./config.ts";
export async function deliver(
  env: Config,
  email: string,
  purpose: "reset" | "verify",
  secret: string,
) {
  const path = purpose === "verify" ? "verify" : "reset";
  const link = env.APP_ORIGIN + "/auth/" + path + "#" + secret;
  const subject =
    purpose === "verify"
      ? "Confirme seu e-mail / Verify your email"
      : "Redefinir senha / Reset password";
  if (env.MAIL_DRIVER === "file") {
    const folder = join(env.LOCAL_DATA_DIR, "mail");
    await mkdir(folder, { recursive: true, mode: 0o700 });
    await writeFile(
      join(folder, crypto.randomUUID() + ".json"),
      JSON.stringify({ email, purpose, link }),
      { mode: 0o600 },
    );
    return;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(8000),
    headers: {
      Authorization: "Bearer " + env.RESEND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [email],
      subject,
      text: subject + "\n\n" + link,
    }),
  });
  if (!response.ok) throw Error("Mail delivery failed");
}
