import { creativeBlockTypes, type Draft } from "@studio/shared";
import { assert } from "../../../platform/errors.ts";

/* Portfolio invariants enforced on every save and publication. Pure
   functions: callers pass the stored draft, the proposed draft and limits.
   The draft schema, block allowlist and publication filter are shared with
   the web app in @studio/shared. */

/** A downgrade never locks editing: an over-limit site may keep or reduce
    its pages, but cannot add more until it is within the plan. The home
    page does not count toward the additional-page quota. */
export function assertPageQuota(nextPages: number, storedPages: number, additionalPages: number) {
  assert(nextPages - 1 <= additionalPages || nextPages <= storedPages, 409, "page_limit");
}

/** The client may reorder or edit artwork metadata, but each artwork must
    keep the asset the server recorded for it. */
export function assertArtworkAssets(draft: Draft, stored: Map<string, string>) {
  assert(
    draft.artworks.every((a) => stored.get(a.id) === a.assetId),
    400,
    "invalid_asset",
  );
}

export function assertCanPublish(user: { verified: boolean; restricted: boolean }) {
  assert(user.verified, 403, "verify_email");
  assert(!user.restricted, 403, "account_restricted");
}

const chapterCount = (d: Draft) =>
  d.pages.reduce((n, p) => n + (p.creative?.chapters.length ?? 0), 0);

/** Chapter capacity follows the plan; retained chapters survive a downgrade.
    With the CREATIVE_TOOLS rollout flag off, existing specialist pages and
    blocks stay editable but no new ones can be introduced. */
export function checkCreativeChanges(
  before: Draft,
  after: Draft,
  enabled: boolean,
  chapterLimit: number,
) {
  assert(
    chapterCount(after) <= Math.max(chapterCount(before), chapterLimit),
    409,
    "chapter_limit",
  );
  if (enabled) return;
  const oldPages = new Map(before.pages.map((p) => [p.id, p]));
  for (const p of after.pages) {
    const old = oldPages.get(p.id);
    assert(
      !p.creative || old?.creative?.kind === p.creative.kind,
      403,
      "creative_disabled",
    );
    for (const b of p.blocks)
      if (creativeBlockTypes.some((t) => t === b.type))
        assert(
          old?.blocks.some((o) => o.id === b.id && o.type === b.type),
          403,
          "creative_disabled",
        );
  }
}

/** Pages whose content changed and therefore get a private history entry. */
export function changedPages(before: Draft, after: Draft) {
  const prior = new Map(before.pages.map((p) => [p.id, p]));
  return after.pages.flatMap((p) => {
    const old = prior.get(p.id);
    return old && JSON.stringify(p) !== JSON.stringify(old) ? [old] : [];
  });
}

export const PAGE_HISTORY_LIMIT = 12;
export const SAVED_SECTION_LIMIT = 24;

/** A public chapter request carries panel lists only for the requested
    chapter. Other chapters keep a cover so series indexes stay light. */
export function trimToChapter(snapshot: Draft, series: string | undefined, chapter: string) {
  for (const p of snapshot.pages)
    for (const h of p.creative?.chapters ?? [])
      if (p.slug !== series || h.id !== chapter) {
        h.cover ??= h.artIds[0] ?? null;
        h.artIds = [];
      }
  return snapshot;
}
