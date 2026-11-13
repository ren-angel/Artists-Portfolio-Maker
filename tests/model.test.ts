import test from "node:test";
import assert from "node:assert/strict";
import {
  draftSchema,
  initialDraft,
  newBlock,
  publishable,
  tenantFromHost,
  handle,
  safeLink,
  templateNames,
} from "@studio/shared";
import {
  hashPassword,
  verifyPassword,
  digest,
  token,
} from "../apps/api/src/security.ts";
import { optimize } from "../apps/api/src/images.ts";
import sharp from "sharp";
test("handle boundaries reserve infrastructure and reject nested or unrelated hosts", () => {
  for (const s of [
    "app",
    "admin",
    "api",
    "help",
    "billing",
    "www",
    "support",
    "cdn",
    "with.dot",
    "-start",
    "ab",
  ])
    assert.equal(handle.safeParse(s).success, false);
  assert.equal(tenantFromHost("luna.example.test:443", "example.test"), "luna");
  for (const host of [
    "luna.example.test.evil",
    "x.luna.example.test",
    "admin.example.test",
    "x, luna.example.test",
  ])
    assert.equal(tenantFromHost(host, "example.test"), null);
  assert.equal(tenantFromHost("theo.example.test", "example.test"), "theo");
});
test("each starting template uses the same versioned block and theme schema", () => {
  for (const template of templateNames) {
    const d = initialDraft("Ateliê");
    d.theme.template = template;
    assert.deepEqual(draftSchema.parse(d), d);
  }
});
test("draft validates membership and unique slugs and excludes unreferenced, hidden work from publication", () => {
  const d = initialDraft("Mika");
  const make = (title: string, featured = false) => ({
    id: crypto.randomUUID(),
    assetId: crypto.randomUUID(),
    title,
    alt: "",
    description: "",
    featured,
  });
  const [publicArt, hidden, cover, unused] = [
    make("Featured", true),
    make("Private"),
    make("Cover"),
    make("Unassigned"),
  ];
  d.artworks = [publicArt, hidden, cover, unused];
  const g = {
    id: crypto.randomUUID(),
    slug: "drawings",
    title: "Drawings",
    visible: true,
    description: "",
    artIds: [publicArt.id],
    cover: cover.id,
  };
  const hiddenGallery = {
    ...g,
    id: crypto.randomUUID(),
    slug: "secret",
    visible: false,
    artIds: [hidden.id],
    cover: null,
  };
  d.galleries = [g, hiddenGallery];
  d.pages[0].blocks.push({
    ...newBlock("image"),
    visible: false,
    artId: hidden.id,
  });
  const snapshot = publishable(d);
  assert.deepEqual(
    snapshot.artworks.map((a) => a.title),
    ["Featured", "Cover"],
  );
  assert.equal(snapshot.galleries.length, 1);
  assert.deepEqual(snapshot.galleries[0].artIds, [publicArt.id]);
  d.title = "Later draft";
  assert.equal(snapshot.title, "Mika");
  d.galleries[0].artIds.push(crypto.randomUUID());
  assert.equal(draftSchema.safeParse(d).success, false);
});
test("rejects active links, arbitrary block layouts and unknown schema versions", () => {
  for (const s of [
    "javascript:alert(1)",
    "data:text/html,x",
    "https://user:pass@example.org",
    "//example.org",
  ])
    assert.equal(safeLink.safeParse(s).success, false);
  const d = initialDraft("Luna");
  assert.equal(draftSchema.safeParse({ ...d, version: 2 }).success, false);
  assert.equal(
    draftSchema.safeParse({ ...d, pages: [d.pages[0], d.pages[0]] }).success,
    false,
  );
});
test("password verification salts each hash and token digests do not reveal the token", async () => {
  const a = await hashPassword("not-a-real-password"),
    b = await hashPassword("not-a-real-password");
  assert.notEqual(a, b);
  assert(await verifyPassword("not-a-real-password", a));
  assert.equal(await verifyPassword("different", a), false);
  const raw = token();
  assert.equal(raw.length, 43);
  assert.notEqual(digest(raw), raw);
});
test("real raster decoder rejects fake content, strips metadata and produces a high-resolution master", async () => {
  for (const b of [
    Buffer.from("<svg/>"),
    Buffer.from("not an image"),
    Buffer.from([137, 80, 78, 71]),
  ])
    await assert.rejects(optimize(b));
  const png = await sharp({
    create: { width: 1200, height: 900, channels: 3, background: "#b87358" },
  })
    .withMetadata()
    .png()
    .toBuffer();
  const i = await optimize(png);
  assert.equal(i.width, 1200);
  assert.equal(i.sourceHeight, 900);
  assert.equal((await sharp(i.master).metadata()).format, "webp");
  assert.equal((await sharp(i.thumb).metadata()).width, 800);
  assert.equal((await sharp(i.master).metadata()).exif, undefined);
});

test("environment defaults support local testing and reject incomplete production configuration", async () => {
  const { config } = await import("../apps/api/src/config.ts");
  const base = {
    DATABASE_URL: "postgresql://test@localhost/test",
    APP_ORIGIN: "http://localhost:3000",
    PLATFORM_DOMAIN: "localhost",
  };
  const env = config(base);
  assert.equal(env.MAX_ARTWORKS, 50);
  assert.equal(env.STORAGE_DRIVER, "local");
  assert.throws(() => config({ ...base, NODE_ENV: "production" }));
  assert.throws(() => config({ ...base, STORAGE_DRIVER: "s3" }));
  assert.throws(() => config({ ...base, MAIL_DRIVER: "resend" }));
  assert.throws(() => config({ ...base, MAX_STORAGE_BYTES: "-1" }));
});
