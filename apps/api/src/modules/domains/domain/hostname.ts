import { isIP } from "node:net";
import { Fault } from "../../../platform/errors.ts";

/* Custom-domain rules. Artists connect domains they already own; the
   platform never sells or registers domains. Ownership is proven by a DNS
   TXT record and routing by a CNAME (or A record for apex domains). */

const BLOCKED_SUFFIXES = [".local", ".localhost", ".internal", ".invalid", ".example", ".lan", ".home", ".corp", ".arpa", ".onion"];
export const MAX_DOMAINS_PER_SITE = 3;
/** Unverified claims are released after this many days so names cannot be squatted. */
export const UNVERIFIED_RETENTION_DAYS = 14;

/** Normalizes user input to a bare public hostname, rejecting IPs,
    internal suffixes and any name under the platform's own domains. */
export function normalizeHost(input: string, platform: { PLATFORM_DOMAIN: string; APP_ORIGIN: string }) {
  let raw = input.trim().toLowerCase();
  if (!/^[a-z]+:\/\//.test(raw)) raw = "http://" + raw;
  let host: string;
  try {
    host = new URL(raw).hostname.replace(/\.$/, "");
  } catch {
    throw new Fault(400, "invalid_domain");
  }
  const labels = host.split(".");
  const ok =
    host.length <= 253 &&
    labels.length >= 2 &&
    !isIP(host) &&
    labels.every((l) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(l)) &&
    /^(?:[a-z]{2,63}|xn--[a-z0-9-]+)$/.test(labels.at(-1)!) &&
    !BLOCKED_SUFFIXES.some((s) => host.endsWith(s)) &&
    !/^(?:example|localhost)\./.test(host) &&
    host !== platform.PLATFORM_DOMAIN &&
    !host.endsWith("." + platform.PLATFORM_DOMAIN) &&
    host !== new URL(platform.APP_ORIGIN).hostname;
  if (!ok) throw new Fault(400, "invalid_domain");
  return host;
}

export const verifyName = (host: string) => "_studio-verify." + host;
export const verifyValue = (token: string) => "studio-verify=" + token;

const bare = (name: string) => name.toLowerCase().replace(/\.$/, "");

/** Evaluates DNS answers for one domain claim. */
export function evaluateDns(
  answers: { txt: string[]; cname: string[]; a: string[] },
  claim: { token: string },
  target: { cname?: string; ip?: string },
) {
  const owned = answers.txt.includes(verifyValue(claim.token));
  const cname = target.cname ? bare(target.cname) : "";
  const dnsOk =
    (!!cname && answers.cname.some((c) => bare(c) === cname)) ||
    (!!target.ip && answers.a.includes(target.ip));
  return {
    owned,
    dnsOk,
    error: !owned ? "txt_missing" : !dnsOk ? "dns_not_pointing" : "tls_pending",
  } as const;
}
