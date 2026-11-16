import type { Catalog } from "./plan-text";
import { apiOrigin, internalHeaders } from "../../shared/lib/internal-api";

export async function catalog(): Promise<Catalog | null> {
  try {
    const res = await fetch(apiOrigin() + "/billing/plans", {
      cache: "no-store", signal: AbortSignal.timeout(4000), headers: internalHeaders(),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}
