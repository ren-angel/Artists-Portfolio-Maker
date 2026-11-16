import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
export const token = () => randomBytes(32).toString("base64url");
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
function derive(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(
      password,
      salt,
      64,
      { N: 131072, r: 8, p: 1, maxmem: 160 * 1024 ** 2 },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return salt + "." + (await derive(password, salt)).toString("hex");
}
export async function verifyPassword(password: string, hash?: string) {
  const [salt, expected] = (
    hash ?? "00000000000000000000000000000000." + "00".repeat(64)
  ).split(".");
  const key = await derive(password, salt);
  return timingSafeEqual(key, Buffer.from(expected, "hex")) && !!hash;
}
