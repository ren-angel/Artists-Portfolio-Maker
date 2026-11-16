import { sql, first, type Tx } from "@studio/db";
import type { Draft } from "@studio/shared";
import { assert } from "../../platform/errors.ts";

/* Tenant boundary shared by every module. A site belongs to exactly one
   account. `owned` both authorizes the caller and takes the site row lock
   that serializes draft saves, upload reservations and publication. */

export type Site = {
  id: string;
  handle: string;
  version: number;
  title: string;
  description: string;
  language: Draft["language"];
  step: number;
  home: string;
  social: string[];
  published_id: string | null;
  owner_id: string;
  settings: { commissions?: unknown };
};

/** Locks the site for update when it belongs to `user`; otherwise 404. */
export async function owned(tx: Tx, site: string, user: string) {
  const row = await first<Site>(
    tx,
    sql`select * from sites where id=${site} and owner_id=${user} for update`,
  );
  assert(row, 404, "site_missing");
  return row;
}
