# Billing, plans and entitlements

## Plans

`packages/shared/src/plans.ts` is the single source for plan limits and features. UI components only render what the API returns from `GET /billing/plans`. The server enforces every limit.

| Plan | Pages | Artworks | Storage | Custom domain | No branding | Commission sections | Appearance | Analytics |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Free | 5 | 50 | 200 MB | — | — | — | basic | basic, 30 days |
| Artist | 15 | 350 | 2 GB | ✓ | ✓ | ✓ | more | basic, 30 days |
| Studio | 30 | 1,500 | 10 GB | ✓ | ✓ | ✓ | advanced | advanced, 365 days |

The Free row honours the deployment's `MAX_*` variables. All plans allow one portfolio and the same per-file upload limit.

The default prices are R$12.90 or R$129.00 per year for Artist, and R$24.90 or R$249.00 per year for Studio. These are product hypotheses, not validated prices. Override them with `PLAN_PRICES` (centavos). Each purchase stores its own `amount`, `currency`, `cycle` and `plan`. Changing prices never rewrites existing subscriptions or payment history. The annual discount is the explicit yearly price.

## Provider: Asaas

The Asaas documentation was reviewed in November 2026. The integration uses only documented operations.

- **Auth:** the `access_token` request header. Sandbox `https://api-sandbox.asaas.com`, production `https://api.asaas.com`.
- **Customers:** `POST /v3/customers` (`name`, `cpfCnpj` required, `externalReference` = our user ID), looked up first with `GET /v3/customers?externalReference=`. The CPF/CNPJ is sent to Asaas and not stored by us.
- **Subscriptions:** `POST /v3/subscriptions` with `billingType` `CREDIT_CARD` or `PIX`, `cycle` `MONTHLY` or `YEARLY`, `nextDueDate`, `value` and `externalReference` (our subscription ID).
  - Asaas has no idempotency-key header. Before creating, we look up `GET /v3/subscriptions?externalReference=`, and creation requests use a 60-second timeout as Asaas recommends.
- **Payment page:** the artist pays the first charge on the Asaas-hosted invoice (`invoiceUrl`). We never receive card details.
- **State:** `GET /v3/subscriptions/{id}` and `GET /v3/subscriptions/{id}/payments` (paginated).
- **Cancellation:** `DELETE /v3/subscriptions/{id}`. Asaas deletes pending and overdue charges and keeps paid ones. A 404 counts as already ended.
- **Refunds:** `POST /v3/payments/{id}/refund` exists (card refunds take up to 10 business days to appear). Refunds are processed by an operator in the Asaas dashboard. A refund then appears through the webhook and reconciliation and removes that period's coverage. An in-app refund button is not implemented.

### Payment methods

- **Card:** `billingType=CREDIT_CARD`. The artist enters the card on the Asaas invoice page and later cycles are charged automatically. Asaas validates the card at creation, but that does not guarantee the charge at the due date. Before launch, confirm in the sandbox that an invoice-page card payment is reused for renewals in your Asaas account configuration.
- **Pix:** `billingType=PIX`. Asaas issues one Pix invoice per cycle and the artist pays each one. The product always labels this as manual renewal. Pix Automático exists at Asaas but needs a separate authorization journey (Jornada 3) that is not implemented.
- **Boleto:** not offered.

### Webhooks

Configure a webhook in Asaas pointing at `https://APP_HOST/api/billing/webhooks/asaas`.
- **Events:** at least the `PAYMENT_*` and `SUBSCRIPTION_*` events.
- **Auth token:** set it to `BILLING_WEBHOOK_TOKEN`. Asaas sends it in `asaas-access-token`. There is no HMAC signature; we compare the token in constant time.
- **Delivery:** prefer sequential delivery. Asaas only accepts HTTP 200 as success, does not follow redirects, pauses the queue after 15 consecutive failures and drops events after 14 days. Monitor `GET /admin/billing`.

## How events are processed

1. Authenticate the token.
2. Insert into `provider_events` with a unique `(provider, event_id)`. Duplicates are ignored.
3. Answer 200 and process asynchronously.

Processing never trusts the payload. It locks the subscription row, **re-reads the subscription and its payments from Asaas**, upserts the `payments` rows, and derives the status with the pure function `derive()` in `packages/shared/src/plans.ts`. The result depends only on current provider state and confirmed payment periods, so duplicate, delayed and out-of-order events converge on the same answer. Failed processing is retried hourly by maintenance (up to 10 attempts).

A browser returning from the invoice page calls `POST /billing/sync`. That also re-reads the provider and grants nothing on its own.

## Subscription states

| From | Event | To |
| --- | --- | --- |
| — | checkout started | `pending` |
| `pending` | payment confirmed | `active` (period end = due date + one cycle) |
| `pending` | 7 days after the first due date, unpaid | `expired` |
| `active` | period ended, renewal unconfirmed | `past_due` (7-day grace, plan still granted) |
| `past_due` | renewal confirmed | `active` |
| `past_due` | grace elapsed | `expired` → Free |
| `active` / `past_due` | artist cancels or provider ends the subscription | `canceling` (paid features until period end) |
| `canceling` | period end reached | `canceled` → Free |
| any open state | refund or chargeback removes the only covered period | re-derived (usually `past_due` or `expired`) |

`canceled` and `expired` are terminal. Buying again creates a new subscription.

**The effective plan** is computed in SQL (`apps/api/src/plan.ts`) from subscription rows in `active`, `past_due` or `canceling` whose period (or grace) has not ended. Public pages, uploads, saves and publishing use this query. They never call the provider, so portfolios keep working during provider outages.

## Plan changes

- **Upgrade (higher plan):** a new subscription starts today. Paid features change only when its first payment is confirmed. The previous subscription is then canceled at Asaas. There is no proration.
- **Downgrade, cycle change, or resubscribing after a cancellation:** the new subscription's first charge is due on the current period end. The current subscription is canceled at Asaas immediately, so it won't renew, and stays `canceling` until its period ends.
- **Abandoned checkout:** starting a different purchase expires the unpaid one and cancels it at Asaas.
- **Failed provider cancellation:** if a cancellation request to Asaas fails, the row stays flagged (`cancel_requested_at` set, `provider_ended=false`) and maintenance retries until Asaas confirms. Account deletion uses the same path before deleting the user.

## Downgrade and grace policy

- No artwork, page, gallery or text is deleted when a plan ends.
- **Over-limit content:** it stays published and editable. Uploads are blocked while artworks or storage exceed the plan. A draft save cannot add pages while the site is over its page limit, but can keep or reduce them.
- **Plan-gated output:** commission sections, extra appearance options and section background images remain in the draft and are omitted from what is published and served. `entitle()` runs at publish time and again on every public read.
- **Custom domains:** they stop routing as soon as the plan no longer includes them. The record is kept so it can be reactivated. The platform subdomain always works.
- **Platform branding:** it returns on public pages.
- **Grace:** 7 days after a paid period ends without a confirmed renewal (`GRACE_DAYS`).

## Test mode

`BILLING_DRIVER=mock` is the default outside production.
- The mock provider stores its state in `LOCAL_DATA_DIR/billing-mock.json`, or in memory during tests.
- Its invoice URLs open `/billing/mock/{payment}`, which can simulate an approved or failed payment.
- Each simulation produces a provider-shaped event that goes through the same recording and reconciliation path as Asaas webhooks.
- Production configuration refuses the mock driver.

Automated tests never contact Asaas or move money.

## Fees (verify before launch)

The Asaas pricing page could not be read completely during implementation. Debit card showed R$0.35 + 1.89%. Pix and boleto showed two values (R$2.15 and R$1.08 per received transaction) without a clear label. Credit card fees were not visible. Confirm current fees in the Asaas account before setting final prices, especially for R$12.90 monthly plans, where a fixed fee is a large share.
