import { assert } from "../../../platform/errors.ts";

/* Upload quota rules. Pure: callers supply current usage and the
   effective plan limits read inside the site lock. */

export type Usage = { art: number; bytes: number };
export type MediaLimits = { artworks: number; storage: number; upload: number };

/** A new reservation must fit the per-file, artwork-count and storage limits.
    Replacing an existing work does not add to the artwork count. */
export function assertCanReserve(
  request: { bytes: number; replacement: boolean; restricted: boolean },
  used: Usage,
  limits: MediaLimits,
) {
  assert(request.bytes <= limits.upload, 413, "upload_size");
  assert(!request.restricted, 403, "account_restricted");
  assert(request.replacement || used.art < limits.artworks, 409, "art_limit");
  assert(used.bytes + request.bytes <= limits.storage, 409, "storage_limit");
}

/** After processing, the stored derivatives replace the reserved source bytes. */
export function assertFitsAfterProcessing(
  used: Usage,
  reservedSourceBytes: number,
  outputBytes: number,
  storageLimit: number,
) {
  assert(
    used.bytes - reservedSourceBytes + outputBytes <= storageLimit,
    409,
    "storage_limit",
  );
}

/** Storage for a private file that replaces any previous file of the same product. */
export function assertFitsStorage(used: Usage, addedBytes: number, storageLimit: number) {
  assert(used.bytes + addedBytes <= storageLimit, 409, "storage_limit");
}

export const MEDIA_SIZES = ["master", "thumb"] as const;
export type MediaSize = (typeof MEDIA_SIZES)[number];
export const objectKey = (site: string, asset: string, size: MediaSize | "staging") =>
  site + "/" + asset + "/" + (size === "staging" ? "staging" : size + ".webp");
