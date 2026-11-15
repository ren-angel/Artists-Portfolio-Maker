import type { Cycle, Method, PaymentStatus } from "@studio/shared";

/* Payment provider boundary. The rest of the API only depends on this shape,
   so another Brazilian or international provider can be added as a driver. */

export type ProviderPayment = {
  id: string;
  status: PaymentStatus;
  /** Minor units (centavos). */
  amount: number;
  currency: string;
  /** YYYY-MM-DD */
  dueDate: string;
  paidAt: string | null;
  invoiceUrl: string | null;
  method: string | null;
};
export type ProviderSubscription = { id: string; ended: boolean; payments: ProviderPayment[] };
export type ProviderEvent = {
  eventId: string;
  type: string;
  /** Provider subscription the event concerns, when known. */
  subscriptionId: string | null;
};
export type NewSubscription = {
  customer: string;
  reference: string;
  cycle: Cycle;
  method: Method;
  amount: number;
  currency: string;
  /** First due date, YYYY-MM-DD. */
  startsOn: string;
  description: string;
};

export interface BillingProvider {
  readonly name: string;
  /** Whether payments here are real money. */
  readonly live: boolean;
  ensureCustomer(c: { userId: string; name: string; email: string; taxId?: string }): Promise<string>;
  /** Idempotent lookup by our own reference, used before creating. */
  findSubscription(reference: string): Promise<string | null>;
  createSubscription(s: NewSubscription): Promise<string>;
  getSubscription(id: string): Promise<ProviderSubscription>;
  cancelSubscription(id: string): Promise<void>;
  /** Authenticates an incoming webhook request. */
  verifyWebhook(headers: Record<string, string | string[] | undefined>): boolean;
  parseEvent(body: unknown): ProviderEvent;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
  }
}
