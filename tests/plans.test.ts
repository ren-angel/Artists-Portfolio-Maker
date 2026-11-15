import test from "node:test";
import assert from "node:assert/strict";
import {
  addCycle,
  draftSchema,
  derive,
  entitle,
  initialDraft,
  newBlock,
  plans,
  priceBook,
  publishable,
  validTaxId,
  type PaymentRecord,
} from "@studio/shared";

const day = 86_400_000;
const now = new Date("2026-11-13T12:00:00Z");
const facts = (o: Partial<Parameters<typeof derive>[0]> = {}) => ({
  status: "pending" as const,
  createdAt: new Date(now.getTime() - day),
  cancelRequested: false,
  providerEnded: false,
  ...o,
});
const paid = (offsetDays: number): PaymentRecord => ({ status: "confirmed", periodEnd: new Date(now.getTime() + offsetDays * day) });

test("subscription state is derived from confirmed payments, independent of event order", () => {
  assert.equal(derive(facts(), [], now).status, "pending");
  assert.equal(derive(facts({ createdAt: new Date(now.getTime() - 8 * day) }), [], now).status, "expired");
  assert.equal(derive(facts(), [{ status: "pending", periodEnd: null }], now).status, "pending");
  const active = derive(facts(), [paid(20)], now);
  assert.equal(active.status, "active");
  assert.equal(derive(facts({createdAt: new Date(now.getTime()+day)}), [paid(31)], now).status, "pending");
  // Same facts in any order give the same answer.
  const a = derive(facts(), [paid(-10), paid(20), { status: "overdue", periodEnd: null }], now);
  const b = derive(facts(), [{ status: "overdue", periodEnd: null }, paid(20), paid(-10)], now);
  assert.deepEqual(a, b);
  assert.equal(derive(facts(), [paid(-2)], now).status, "past_due");
  assert.equal(derive(facts(), [paid(-2)], now).graceUntil!.getTime(), now.getTime() + 5 * day);
  assert.equal(derive(facts(), [paid(-8)], now).status, "expired");
  // Refunds remove coverage.
  assert.equal(derive(facts(), [{ status: "refunded", periodEnd: null }], now).status, "pending");
  assert.equal(derive(facts({ cancelRequested: true }), [paid(5)], now).status, "canceling");
  assert.equal(derive(facts({ cancelRequested: true }), [paid(-1)], now).status, "canceled");
  assert.equal(derive(facts({ providerEnded: true }), [paid(5)], now).status, "canceling");
  // Terminal states never reopen from stale data.
  assert.equal(derive(facts({ status: "canceled" }), [paid(30)], now).status, "canceled");
});

test("cycles, tax IDs and price overrides", () => {
  assert.equal(addCycle(new Date("2026-01-31T00:00:00Z"), "yearly").toISOString().slice(0, 10), "2027-01-31");
  assert.equal(addCycle(new Date("2026-11-13T00:00:00Z"), "monthly").toISOString().slice(0, 10), "2026-12-13");
  assert.equal(addCycle(new Date("2026-01-31T00:00:00Z"), "monthly").toISOString().slice(0, 10), "2026-02-28");
  assert.equal(addCycle(new Date("2024-02-29T00:00:00Z"), "yearly").toISOString().slice(0, 10), "2025-02-28");
  assert(validTaxId("529.982.247-25"));
  assert(validTaxId("11.222.333/0001-81"));
  assert(!validTaxId("111.111.111-11"));
  assert(!validTaxId("529.982.247-24"));
  const book = priceBook(JSON.stringify({ studio: { yearly: { amount: 19900, currency: "USD" } } }));
  assert.deepEqual(book.studio.yearly, { amount: 19900, currency: "USD" });
  assert.equal(book.artist.monthly.amount, 1290);
  assert.throws(() => priceBook(JSON.stringify({ artist: { monthly: 12.9 } })));
});

test("entitlements filter published output without touching the draft", () => {
  const d = initialDraft("Studio", "en");
  d.theme.radius = "round";
  d.theme.grid = "masonry";
  d.theme.font = "storybook";
  d.pages[0].blocks.push(newBlock("commissionPrices"), newBlock("contactLinks"));
  const free = entitle(d, plans.free.features);
  assert.equal(free.theme.radius, "template");
  assert.equal(free.theme.font, "template");
  assert(!free.pages[0].blocks.some((b) => b.type === "commissionPrices"));
  assert(free.pages[0].blocks.some((b) => b.type === "contactLinks"));
  assert.equal(d.theme.radius, "round", "original draft untouched");
  const artist = publishable(d, "artist");
  assert.equal(artist.theme.radius, "round");
  assert.equal(artist.theme.grid, "template");
  assert.equal(publishable(d, "studio").theme.grid, "masonry");
});

test("Studio can edit and publish a gallery at its advertised artwork limit", () => {
  const draft = initialDraft("Archive", "en");
  draft.artworks = Array.from({ length: plans.studio.limits.artworks }, (_, i) => ({
    id: crypto.randomUUID(), assetId: crypto.randomUUID(), title: "Study " + i,
    alt: "", description: "", featured: false,
  }));
  draft.galleries = [{ id: crypto.randomUUID(), slug: "archive", title: "Archive", visible: true,
    cover: null, description: "", artIds: draft.artworks.map(a => a.id) }];
  assert.ok(draftSchema.safeParse(draft).success);
  assert.equal(publishable(draft, "studio").artworks.length, plans.studio.limits.artworks);
});
