# Deployment and operations

The prioritized launch checklist, with current status and verification steps, is [PRODUCTION-DEPLOYMENT-TODO.md](PRODUCTION-DEPLOYMENT-TODO.md). This runbook describes the mechanics.

1. Install on a network-enabled build host. Install the committed dependency set with `pnpm install --frozen-lockfile`. Run the migration, integration, browser and build commands in the README against disposable services.
2. Provision PostgreSQL, a private object bucket and a verified transactional mail sender. Keep runtime and migration connections separate. Set production variables from .env.example in your secret manager. Restrict database and bucket access to the API and migration/maintenance jobs as appropriate.
3. Set PLATFORM_DOMAIN to the bare domain, APP_ORIGIN to the HTTPS application origin, and API_INTERNAL_ORIGIN to the private Fastify listener. Build with the same upstream and upload limit as runtime. Run pnpm migrate once with direct database credentials. Execute pnpm build, then supervise pnpm --filter @studio/api start and pnpm --filter @studio/web start.
4. Point apex, app and wildcard DNS at the web ingress. Install TLS covering the apex and wildcard (a wildcard certificate needs a DNS-01 challenge). Validate accepted hostnames at ingress and forward the original validated Host. Have the edge set X-Forwarded-For to the client address and set `TRUST_PROXY=127.0.0.1,::1` on the API when the web server runs on the same host; otherwise every visitor shares the web server's address for rate limits. Set the same `INTERNAL_TOKEN` on web and API: server-rendered reads, analytics and custom-domain lookups use it and are exempt from per-address limits. The API should be reachable only from the web service or controlled ingress. Fastify's limits are process-local; also enforce per-client limits at the edge.
5. Set the ingress body limit at least as high as the configured upload maximum. Local uploads pass through Next and Fastify. Configure bucket CORS to allow PUT and Content-Type from APP_ORIGIN for presigned browser uploads. Keep bucket reads private. Bound process memory and request concurrency for decoded images and scrypt (each password hash uses about 128 MiB on the libuv thread pool; consider `UV_THREADPOOL_SIZE=8`). All provider credentials stay on the server.
6. Schedule pnpm cleanup (apps/api/src/jobs/maintenance.ts) at least hourly using the same environment as the API. Asset garbage has a one-hour grace period. Monitor job failures, storage capacity, mail delivery failures and API 5xx errors. Back up PostgreSQL and object storage consistently and rehearse restoration together.
7. Register an artist, verify a delivered email, create and publish an artwork, then change the draft. Verify the public hostname in a signed-out browser. Unpublish it and check both its HTML and image URLs. Complete the reset and deletion flows before enabling registrations.

## Abuse reports and privacy operations

The reports table contains a report ID, site ID, submission time, reason and review status. An authorized operator can list open reports using a restricted database role and record a review outcome. Grant moderation access separately from application credentials. Establish a published privacy notice, contact channel, deletion and backup retention policy with qualified review for the intended jurisdictions. No certification claim is made.

## Production choices still to verify

Check live mail delivery, R2 permissions, DNS, TLS, limits at the edge and deletion propagation under the actual hosting configuration. The local adapter exercises a private filesystem. It does not authenticate to an external provider. Phase 1 uses one API process and rereads public snapshots. Introduce shared rate limits and revision-aware caching before horizontal scale.

## Phase 2 operations

### Billing
1. Create an Asaas account and generate a sandbox API key. Set `BILLING_DRIVER=asaas`, `ASAAS_ENV=sandbox`, `ASAAS_API_KEY` and a random 48-character `BILLING_WEBHOOK_TOKEN`.
2. In Asaas, add a webhook to `https://APP_HOST/api/billing/webhooks/asaas`. Use the same auth token, sequential delivery, and the `PAYMENT_*` and `SUBSCRIPTION_*` events. The URL must answer directly with no redirect.
3. Run the full sandbox journey with a test card and with Pix: upgrade, renewal, failed card, cancellation, refund from the dashboard, downgrade. Confirm that invoice-page card payments renew automatically for your account. Only then switch to `ASAAS_ENV=production` with a production key.
4. Production refuses the mock driver and default secrets. Set `INTERNAL_TOKEN` to a long random value on **both** the web and API services.

See [BILLING.md](BILLING.md) for states, grace and plan-change policy.

### Custom domains and TLS
- Point `DOMAIN_TARGET` (for example `sites.your-domain.example`) at the web ingress and set `DOMAIN_TARGET_IP` for apex domains. Artists add a TXT record `_studio-verify.HOST` with the token shown in the studio, plus a CNAME (or A record).
- The API never issues certificates. Use an edge that supports on-demand TLS and ask the API before issuing. With Caddy:

```
{
  on_demand_tls {
    ask http://API_PRIVATE_HOST:4000/domains/tls-ask
  }
}
https:// {
  tls { on_demand }
  reverse_proxy WEB_PRIVATE_HOST:3000
}
```

  `/domains/tls-ask?domain=` answers 200 only for domains with confirmed ownership, correct routing records and an unrestricted owner on an eligible plan. Canonical selection and public routing also require a successful TLS probe. Managed platforms (Vercel, Cloudflare for SaaS, Fly) can be used instead. Their domain APIs would be added behind the same verification flow.
- The studio reports HTTPS as active only after a real TLS handshake to the domain succeeds (`DOMAIN_TLS_CHECK=probe`).
- Domains are re-verified daily. If the TXT proof disappears, the domain stops routing. Unverified claims are released after 14 days.

### Scheduled work and monitoring
- Run `pnpm cleanup` hourly. It does upload/session cleanup, object garbage collection, billing event retries, time-based subscription transitions, bounded provider re-reads for pending and past-due purchases, retried provider cancellations, domain re-verification and analytics retention. It logs one JSON line per failing step.
- `GET /health` checks database connectivity and the required portfolio, artwork and billing columns, and reports the billing driver. Alert on non-200 responses, API 5xx, unprocessed provider events older than one hour, and subscriptions with `sync_error` (`/admin/billing`).
- Grant operators with `pnpm admin grant person@example.com`. Admin actions are recorded in `admin_audit`.

### Backups and recovery
Enable PostgreSQL point-in-time recovery (Neon branches or your provider's PITR) and versioned object storage. Rehearse restoring the database and bucket to the same point in time, then run `pnpm cleanup` and a billing re-sync (`/admin/billing` → Re-sync) to reconcile any payments received after the backup.

### Analytics
Views are counted by the web server after rendering public pages. The counts are daily aggregates without cookies, IPs or identifiers. Set `ANALYTICS_COUNTRY_HEADER` only if a trusted edge supplies a country code and strips the header from client requests.
