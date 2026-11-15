import type { Config } from "../config.ts";
import { asaas } from "./asaas.ts";
import { mock, type MockProvider } from "./mock.ts";
import type { BillingProvider } from "./provider.ts";

export function provider(env: Config): BillingProvider | MockProvider {
  if (env.BILLING_DRIVER === "asaas")
    return asaas({ apiKey: env.ASAAS_API_KEY!, env: env.ASAAS_ENV, webhookToken: env.BILLING_WEBHOOK_TOKEN });
  return mock({
    dir: env.NODE_ENV === "test" ? undefined : env.LOCAL_DATA_DIR,
    origin: env.APP_ORIGIN,
    webhookToken: env.BILLING_WEBHOOK_TOKEN,
  });
}
export const isMock = (p: BillingProvider): p is MockProvider => p.name === "mock";
