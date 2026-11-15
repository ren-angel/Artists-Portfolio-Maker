import type { Catalog } from "../components/studio/plan-text";

export async function catalog(): Promise<Catalog | null> {
  try {
    const res = await fetch((process.env.API_INTERNAL_ORIGIN || "http://127.0.0.1:4000") + "/billing/plans", {
      cache: "no-store", signal: AbortSignal.timeout(4000),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}
