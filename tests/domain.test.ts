import test from "node:test";
import assert from "node:assert/strict";
import { initialDraft, newCreative, type Draft } from "@studio/shared";
import { Fault } from "../apps/api/src/platform/errors.ts";
import { classify } from "../apps/api/src/platform/http.ts";
import {
  assertArtworkAssets,
  assertCanPublish,
  assertPageQuota,
  changedPages,
  trimToChapter,
} from "../apps/api/src/modules/portfolio/domain/rules.ts";
import { assertCanReserve, assertFitsAfterProcessing, objectKey } from "../apps/api/src/modules/media/domain/quota.ts";
import { evaluateDns, normalizeHost } from "../apps/api/src/modules/domains/domain/hostname.ts";
import { countedPath, isAutomated, referrerCategory, reportWindow } from "../apps/api/src/modules/analytics/domain/traffic.ts";
import { sessionCookie } from "../apps/api/src/modules/identity/domain/credentials.ts";

/* Pure domain rules extracted from route handlers. No database. */

const fails = (fn: () => unknown, code: string) =>
  assert.throws(fn, (e: unknown) => e instanceof Fault && e.code === code);

test("page quota excludes the home page and never blocks an over-limit site from shrinking", () => {
  assertPageQuota(6, 1, 5); // home + 5 additional
  fails(() => assertPageQuota(7, 6, 5), "page_limit");
  assertPageQuota(9, 9, 5); // downgraded site keeps its pages
  assertPageQuota(8, 9, 5); // and may reduce them
  fails(() => assertPageQuota(10, 9, 5), "page_limit");
});

test("publication requires a verified, unrestricted account", () => {
  assertCanPublish({ verified: true, restricted: false });
  fails(() => assertCanPublish({ verified: false, restricted: false }), "verify_email");
  fails(() => assertCanPublish({ verified: true, restricted: true }), "account_restricted");
});

test("artworks must keep the asset recorded by the server", () => {
  const d = initialDraft("Studio", "en");
  const id = crypto.randomUUID(), asset = crypto.randomUUID();
  d.artworks.push({ id, assetId: asset, title: "A", description: "", alt: "", featured: false, width: 10, height: 10, details: {} } as Draft["artworks"][number]);
  assertArtworkAssets(d, new Map([[id, asset]]));
  fails(() => assertArtworkAssets(d, new Map([[id, crypto.randomUUID()]])), "invalid_asset");
  fails(() => assertArtworkAssets(d, new Map()), "invalid_asset");
});

test("page history records only changed existing pages", () => {
  const before = initialDraft("Studio", "en");
  const after = structuredClone(before);
  assert.equal(changedPages(before, after).length, 0);
  after.pages[0].title = "Renamed";
  assert.deepEqual(changedPages(before, after).map((p) => p.title), [before.pages[0].title]);
});

test("public chapter views keep panels only for the requested chapter", () => {
  const d = initialDraft("Studio", "en");
  const art = [crypto.randomUUID(), crypto.randomUUID()];
  const creative = newCreative("comic");
  const [a, b] = [crypto.randomUUID(), crypto.randomUUID()];
  creative.chapters = [
    { id: a, title: "One", visible: true, date: null, cover: null, artIds: [art[0]] },
    { id: b, title: "Two", visible: true, date: null, cover: null, artIds: [art[1]] },
  ];
  d.pages.push({ id: crypto.randomUUID(), slug: "night", title: "Night", inNav: true, blocks: [], creative });
  const view = trimToChapter(structuredClone(d), "night", b);
  const chapters = view.pages.at(-1)!.creative!.chapters;
  assert.deepEqual(chapters[0].artIds, []);
  assert.equal(chapters[0].cover, art[0]);
  assert.deepEqual(chapters[1].artIds, [art[1]]);
  const index = trimToChapter(structuredClone(d), undefined, "index");
  assert.ok(index.pages.at(-1)!.creative!.chapters.every((c) => !c.artIds.length && c.cover));
});

test("upload reservations respect size, restriction, artwork and storage limits", () => {
  const limits = { artworks: 2, storage: 1000, upload: 500 };
  assertCanReserve({ bytes: 400, replacement: false, restricted: false }, { art: 1, bytes: 500 }, limits);
  fails(() => assertCanReserve({ bytes: 501, replacement: false, restricted: false }, { art: 0, bytes: 0 }, limits), "upload_size");
  fails(() => assertCanReserve({ bytes: 10, replacement: false, restricted: true }, { art: 0, bytes: 0 }, limits), "account_restricted");
  fails(() => assertCanReserve({ bytes: 10, replacement: false, restricted: false }, { art: 2, bytes: 0 }, limits), "art_limit");
  assertCanReserve({ bytes: 10, replacement: true, restricted: false }, { art: 2, bytes: 0 }, limits);
  fails(() => assertCanReserve({ bytes: 400, replacement: true, restricted: false }, { art: 0, bytes: 700 }, limits), "storage_limit");
  assertFitsAfterProcessing({ art: 1, bytes: 900 }, 400, 450, 1000);
  fails(() => assertFitsAfterProcessing({ art: 1, bytes: 900 }, 400, 600, 1000), "storage_limit");
  assert.equal(objectKey("s", "a", "thumb"), "s/a/thumb.webp");
  assert.equal(objectKey("s", "u", "staging"), "s/u/staging");
});

test("domain DNS evaluation needs the TXT proof and a matching CNAME or A record", () => {
  const claim = { token: "abc" };
  const target = { cname: "sites.example.com.", ip: "203.0.113.7" };
  const proof = ["studio-verify=abc"];
  assert.deepEqual(evaluateDns({ txt: [], cname: ["sites.example.com"], a: [] }, claim, target), { owned: false, dnsOk: true, error: "txt_missing" });
  assert.deepEqual(evaluateDns({ txt: proof, cname: ["other.example.net"], a: [] }, claim, target), { owned: true, dnsOk: false, error: "dns_not_pointing" });
  assert.equal(evaluateDns({ txt: proof, cname: ["SITES.example.com."], a: [] }, claim, target).dnsOk, true);
  assert.equal(evaluateDns({ txt: proof, cname: [], a: ["203.0.113.7"] }, claim, target).error, "tls_pending");
  assert.equal(evaluateDns({ txt: proof, cname: [], a: ["203.0.113.7"] }, claim, {}).dnsOk, false);
  const platform = { PLATFORM_DOMAIN: "muralia.app", APP_ORIGIN: "https://app.muralia.app" };
  assert.equal(normalizeHost("https://Art.Example.org/path", platform), "art.example.org");
  for (const bad of ["muralia.app", "x.muralia.app", "10.0.0.1", "printer.local", "localhost", "a..b.com"])
    fails(() => normalizeHost(bad, platform), "invalid_domain");
});

test("analytics ignores automated traffic and stores only coarse facts", () => {
  assert.equal(isAutomated(""), true);
  assert.equal(isAutomated("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
  assert.equal(isAutomated("Mozilla/5.0 (X11; Linux x86_64) Firefox/140.0"), false);
  assert.equal(countedPath("/works/abc/?utm=1#x"), "/works/abc");
  assert.equal(countedPath("///"), "/");
  assert.equal(referrerCategory("www.instagram.com", ["muralia.app"]), "social");
  assert.equal(referrerCategory("luna.muralia.app", ["muralia.app"]), "internal");
  assert.deepEqual(reportWindow(false, 365), { max: 30, days: 30 });
  assert.deepEqual(reportWindow(true, 90), { max: 365, days: 90 });
});

test("session cookies are host-only and secure in production", () => {
  const prod = sessionCookie(true), dev = sessionCookie(false);
  assert.equal(prod.name, "__Host-session");
  assert.deepEqual(prod.options, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  assert.equal(dev.options.secure, false);
  assert.equal(prod.maxAge, 14 * 86400);
});

test("errors map to stable public codes without internals", () => {
  assert.deepEqual(classify(new Fault(409, "conflict")), { status: 409, code: "conflict" });
  assert.deepEqual(classify(Object.assign(new Error("dup key value"), { code: "23505" })), { status: 409, code: "already_exists" });
  assert.deepEqual(classify(new Error("connection refused at 10.0.0.5")), { status: 500, code: "request_failed" });
  assert.deepEqual(classify(Object.assign(new Error("x"), { statusCode: 429 })), { status: 429, code: "rate_limit" });
});
