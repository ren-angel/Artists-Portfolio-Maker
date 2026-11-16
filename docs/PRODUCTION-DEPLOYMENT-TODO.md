# Production deployment TODO

State on 15 November 2026, after the DDD refactor and verification pass (branch `refactor/ddd-production-readiness`). Everything below was checked against the repository; local test results are in [TEST-REPORT.md](TEST-REPORT.md) and feature coverage in [FEATURE-STATUS.md](FEATURE-STATUS.md).

**Verdict: not ready for public launch yet.** The application builds and every local test passes, but no production provider (payments, mail, object storage, DNS/TLS) has ever been exercised, the legal texts are unreviewed drafts with placeholders, and there are no backups, monitoring or scheduled jobs. Work through the P0 items, run the staging acceptance (A-9), then launch.

Priorities: **P0** blocks launch · **P1** do before or within the first weeks of real traffic · **P2** later.
Status values: Implemented · Implemented, unverified · Missing · External configuration required · Optional after launch.
Each item ends with: manual user action? · external credentials? · complexity.

## Recommended setup for launch

A single small stack, close to Brazilian users, with no Kubernetes:

| Piece | Recommendation | Why |
| --- | --- | --- |
| Edge + web + API | One VPS in São Paulo (2 vCPU / 4 GB is enough to start) running **Caddy** → Next.js (port 3000) → Fastify (port 4000, loopback only), supervised by systemd or Docker Compose | The code already assumes this shape: Caddy on-demand TLS calls `/domains/tls-ask`, Next proxies `/api` to a private Fastify listener. Any VPS provider with a São Paulo region works. |
| PostgreSQL | **Neon** in the region closest to São Paulo that your plan offers, on a paid plan with point-in-time restore; pooled URL for `DATABASE_URL`, direct URL for `DIRECT_DATABASE_URL` | Already used for development/testing; low latency to a São Paulo VPS |
| Object storage | **Cloudflare R2**, one private bucket, scoped API token | The S3 adapter supports R2 (`S3_REGION=auto`); no egress fees |
| Mail | **Resend** with a verified sending domain | Driver already implemented |
| DNS | Cloudflare DNS (needed anyway for R2 and for wildcard-certificate DNS challenges) | |
| Payments | **Asaas** (Pix and card, BRL) | Driver already implemented |

Costs: the VPS, a small Neon paid plan and R2/Resend free tiers keep the fixed monthly cost low. Check current prices before committing; Asaas charges per transaction.

---

## A. Critical blockers

### A-1 · Legal texts reviewed and placeholders filled — P0
- **Status:** Missing. `apps/web/features/legal/legal.ts` states the texts are not legal advice; without env values they render `[LEGAL ENTITY NAME AND CNPJ]` and `[SUPPORT EMAIL]`.
- **Why:** Terms, privacy (LGPD), refunds (CDC right of withdrawal), copyright/takedown and acceptable-use texts are binding, and users accept them at registration (consents are recorded).
- **Action:** Have a Brazilian lawyer review every document in `legal.ts` (terms, privacy, refunds, content, acceptable use, copyright — all versioned as drafts); set `LEGAL_ENTITY_NAME` (legal name + CNPJ) and `SUPPORT_EMAIL`; bump the document versions in `packages/shared/src/legal.ts` after changes so existing users are asked to re-accept.
- **Where:** `apps/web/features/legal/legal.ts`, `packages/shared/src/legal.ts`, `/legal/*` pages.
- **Verify:** `/legal/terms`, `/legal/privacy` etc. show no placeholders; registration records the new versions (`consents` table).
- Manual: yes · Credentials: no · Small (code) / external (legal)

### A-2 · Production infrastructure provisioned — P0
- **Status:** External configuration required.
- **Why:** Production config refuses to start without HTTPS `APP_ORIGIN`, S3 storage, Resend mail, the Asaas driver and non-default secrets (`apps/api/src/platform/config.ts`).
- **Action:** Create the VPS, Neon project/branch, R2 bucket and Resend domain from the table above (see C-1 to C-4).
- **Verify:** `pnpm --filter @studio/api start` boots with `NODE_ENV=production`; `GET https://app.DOMAIN/api/health` returns `{"ok":true,"billing":"asaas","live":…}`.
- Manual: yes · Credentials: yes · Medium

### A-3 · Production secrets generated and stored — P0
- **Status:** External configuration required.
- **Why:** `INTERNAL_TOKEN` authenticates the web server to the API (custom-domain routing, analytics, and now the rate-limit exemption for server-rendered reads). `BILLING_WEBHOOK_TOKEN` authenticates Asaas webhooks. Production rejects the development defaults; the web server now logs an error if `INTERNAL_TOKEN` is missing.
- **Action:** Generate long random values (`openssl rand -base64 36`) for `INTERNAL_TOKEN` (same value on web **and** API) and `BILLING_WEBHOOK_TOKEN`; store them, plus `ASAAS_API_KEY`, `RESEND_API_KEY`, S3 keys and database URLs, in the host's secret store or a root-only env file, never in Git. Development credentials in the local `.env` must not be reused.
- **Verify:** Custom-domain resolution and analytics work in staging (both use `/internal/*`); `/api/health` 200.
- Manual: yes · Credentials: yes · Small

### A-4 · Edge: TLS, host validation and client addresses — P0
- **Status:** External configuration required (code ready).
- **Why:** Portfolios live on `handle.DOMAIN` (needs a wildcard certificate) and on artist-owned domains (needs on-demand certificates gated by `/domains/tls-ask`). The API now derives client addresses from `X-Forwarded-For` only when `TRUST_PROXY` is set; without it every visitor shares one rate-limit bucket (10 failed logins anywhere would lock sign-in for everyone).
- **Action:**
  1. Caddy with a DNS-provider module (e.g. Cloudflare) to obtain `DOMAIN` + `*.DOMAIN` via DNS-01, plus an `on_demand_tls { ask http://127.0.0.1:4000/domains/tls-ask }` catch-all site for custom domains (example in `docs/DEPLOYMENT.md`).
  2. Reverse-proxy everything to Next on `127.0.0.1:3000`; Fastify listens on loopback only (`HOST=127.0.0.1`).
  3. Make Caddy set `X-Forwarded-For` to the client address (Caddy does this by default for untrusted clients) and set `TRUST_PROXY=127.0.0.1,::1` on the API.
  4. Allow request bodies of at least `MAX_UPLOAD_BYTES` (default 12 MiB).
- **Where:** edge config; `apps/api/src/platform/config.ts` (`TRUST_PROXY`), `apps/web/proxy.ts`.
- **Verify:** `curl -I https://anything.DOMAIN` serves a valid certificate; unknown hosts return 404; a test custom domain gets a certificate only after verification in the studio; from two machines, failing login 11 times on one does not block the other (`tests/security.test.ts` covers the API side).
- Manual: yes · Credentials: DNS API token · Medium

### A-5 · Asaas sandbox journey, then production — P0
- **Status:** Implemented, unverified against Asaas. Mock-provider lifecycle is fully tested (`tests/billing.test.ts`, `tests/browser/billing.spec.ts`).
- **Why:** Real money; renewals, failures and refunds have never run against the provider.
- **Action:** Follow `docs/DEPLOYMENT.md` → Billing: sandbox key, `BILLING_DRIVER=asaas`, `ASAAS_ENV=sandbox`, webhook to `https://app.DOMAIN/api/billing/webhooks/asaas` (sequential, `PAYMENT_*` and `SUBSCRIPTION_*`, same token, no redirects). Run card and Pix: upgrade, renewal, failed card, cancellation, refund, downgrade. Reconcile in `/admin/billing`. Only then switch to `ASAAS_ENV=production`.
- **Verify:** Each transition appears in the studio billing page and `/admin/billing` with no `sync_error`; duplicate webhook deliveries are ignored.
- Manual: yes · Credentials: Asaas · Medium

### A-6 · Transactional mail delivers — P0
- **Status:** Implemented, unverified (only the local file driver has run).
- **Why:** Publishing requires a verified email; password reset depends on mail.
- **Action:** Verify the sending domain in Resend (SPF, DKIM, DMARC); set `MAIL_DRIVER=resend`, `MAIL_FROM`, `RESEND_API_KEY`. Test Gmail/Outlook delivery.
- **Where:** `apps/api/src/modules/identity/infrastructure/mailer.ts`.
- **Verify:** Register in staging, receive the email, verify, publish; reset a password (all sessions end).
- Manual: yes · Credentials: Resend · Small

### A-7 · Hourly maintenance job scheduled — P0
- **Status:** Implemented (`pnpm cleanup` → `apps/api/src/jobs/maintenance.ts`), not scheduled.
- **Why:** Without it, expired upload reservations still count against quotas, deleted images are never removed from R2, subscriptions never move to grace/expired, missed webhooks are never retried, custom domains are never re-verified and analytics are never pruned.
- **Action:** systemd timer or cron running `pnpm cleanup` hourly with the API's environment. Alert on non-zero exit and on its JSON error lines.
- **Verify:** Run once manually (verified locally); check `garbage` drains and `provider_events` has no old unprocessed rows.
- Manual: yes · Credentials: no · Small

### A-8 · Backups and a restore rehearsal — P0
- **Status:** Missing.
- **Why:** Artwork and portfolios are irreplaceable for artists; database rows and R2 objects must be restorable to the same point.
- **Action:** Enable Neon point-in-time restore with adequate retention. Check what object versioning or retention R2 offers for your account; independently, schedule a periodic copy (e.g. `rclone sync` with a retention window) to a second bucket or provider. Rehearse: restore DB and objects into an isolated environment, run `pnpm cleanup`, re-sync billing in `/admin/billing`, open a published portfolio.
- **Verify:** A dated restore report in `docs/`.
- Manual: yes · Credentials: Neon, R2 · Medium

### A-9 · Staging acceptance run — P0
- **Status:** Missing.
- **Action:** Deploy the exact production configuration to a staging host and walk the five steps in `docs/PHASE2-AUDIT.md` → Staging acceptance (mail, upload/publish/withdraw on R2, Asaas journey, two platform hosts + a test custom domain, maintenance + restore). Also run `pnpm e2e` against staging with a disposable database.
- **Verify:** Record results in `docs/CHECKPOINT.md`.
- Manual: yes · Credentials: all · Medium

### A-10 · Fiscal setup for subscription revenue — P0
- **Status:** External configuration required.
- **Why:** Charging Brazilian customers for a SaaS normally requires issuing service invoices (NFS-e) under your company's tax regime.
- **Action:** Confirm the regime and invoicing obligations with an accountant; Asaas can issue NFS-e automatically once configured. Align `PLAN_PRICES` with taxes and Asaas fees.
- Manual: yes · Credentials: Asaas, city hall/NFS-e · Small–Medium (external)

## B. Security

### B-1 · Trusted proxy and per-client rate limits — P0
- **Status:** Implemented in this pass (`TRUST_PROXY`, internal-token exemption); needs configuration (A-4).
- **Why:** Fixes platform-wide lockouts and prevents public SSR reads from exhausting the shared global limit under load.
- **Verify:** `tests/security.test.ts`; in staging, server logs show distinct client IPs.
- Manual: yes · Credentials: no · Small

### B-2 · Edge rate limiting and abuse protection — P1
- **Status:** Missing at the edge. Fastify limits are in memory per process (reset on restart, not shared).
- **Action:** Add per-IP limits in Caddy (rate-limit module) or Cloudflare in front of `/api/auth/*`, `/api/reports`, `/api/support/public`, uploads. If you ever run more than one API process, move `@fastify/rate-limit` to a shared store (Redis).
- Manual: yes · Credentials: no · Small

### B-3 · Password hashing capacity — P1
- **Status:** Implemented (scrypt N=2¹⁷, 128 MiB per hash, runs on the libuv thread pool).
- **Why:** Concurrent logins use roughly 128 MiB each and can starve the thread pool used by file and DNS work.
- **Action:** Size the VPS memory accordingly, set `UV_THREADPOOL_SIZE` (for example 8) for the API, and keep the edge login limits from B-2.
- Manual: yes · Credentials: no · Small

### B-4 · Redact secrets from access logs — P1
- **Status:** External configuration required.
- **Why:** Download grants are bearer tokens in the path `/api/downloads/<token>` (5-minute lifetime).
- **Action:** Configure Caddy log filters to redact that path segment (email tokens are in URL fragments and never reach the server).
- Manual: yes · Credentials: no · Small

### B-5 · Database least privilege — P1
- **Status:** Missing (one role for everything).
- **Action:** Use a migration role (DDL) only for `pnpm migrate`; give the runtime role DML on application tables only; create a separate read-only/moderation role for operators.
- Manual: yes · Credentials: Neon · Small

### B-6 · Object storage permissions — P0
- **Status:** External configuration required.
- **Action:** Private R2 bucket (no public access); API token limited to that bucket with object read/write; CORS allowing `PUT` with `Content-Type` from `APP_ORIGIN` only (presigned uploads are browser → R2).
- **Verify:** Anonymous GET of an object URL fails; an upload from the studio succeeds; an unpublished image returns 404 to a signed-out browser.
- Manual: yes · Credentials: R2 · Small

### B-7 · Dependency hygiene — P1
- **Status:** `sharp` upgraded to 0.35.5 (three high advisories in its image decoders) and libvips restricted to JPEG/PNG/WebP loaders. Remaining: one moderate advisory in `minimatch` via `typescript-eslint` (development tooling only).
- **Action:** Run `pnpm audit` in CI; update Next.js, Fastify and sharp regularly.
- Manual: no · Credentials: no · Small

### B-8 · Operator account protection — P1
- **Status:** Implemented server-side authorization; no MFA exists.
- **Action:** Grant `/admin` (`pnpm admin grant`) only to operators using unique long passwords; consider adding TOTP for admins before growing the team.
- Manual: yes · Credentials: no · Small (process) / Medium (MFA)

### B-9 · Smaller hardening items — P2
- Registration reveals whether an email exists (`409 already_exists`); acceptable for now, revisit if abused.
- CSP allows inline styles (`style-src 'unsafe-inline'`), required by the current design; scripts are nonce-locked.
- Document a secret-rotation procedure for `INTERNAL_TOKEN`/`BILLING_WEBHOOK_TOKEN` (requires restarting both services).
- Manual: partly · Credentials: no · Small

## C. Infrastructure

### C-1 · Host and process layout — P0
- **Status:** External configuration required.
- **Action:** On the VPS: Node 24 LTS, pnpm 10.32.1, `pnpm install --frozen-lockfile`, `pnpm build` **with the production environment loaded** (`API_INTERNAL_ORIGIN` and `MAX_UPLOAD_BYTES` are baked into the Next build), then supervise `pnpm --filter @studio/api start` and `pnpm --filter @studio/web start` with restart-on-failure and memory limits.
- **Verify:** Reboot the VPS; both services and Caddy come back.
- Manual: yes · Credentials: no · Medium

### C-2 · PostgreSQL — P0
- **Action:** Neon project near São Paulo; `DATABASE_URL` = pooled, `DIRECT_DATABASE_URL` = direct (with `sslmode=require`); run `pnpm migrate` once per release before starting the API (migrations 0001–0010; the runner is checksum-locked and idempotent).
- **Verify:** `/api/health` 200 (it checks required columns).
- Manual: yes · Credentials: Neon · Small

### C-3 · Object storage — P0
- **Action:** `STORAGE_DRIVER=s3`, `S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com`, `S3_REGION=auto`, `S3_BUCKET`, keys (B-6). The CSP automatically allows the S3 endpoint for uploads.
- **Verify:** Upload, publish, unpublish, delete an artwork; object disappears after the next maintenance run past the 1-hour grace period.
- Manual: yes · Credentials: R2 · Small

### C-4 · DNS — P0
- **Action:** `DOMAIN`, `www`, `app` and `*` → the VPS. Set `PLATFORM_DOMAIN`, `APP_ORIGIN=https://app.DOMAIN` (or the apex), `DOMAIN_TARGET` (CNAME target for artists, e.g. `sites.DOMAIN`) and `DOMAIN_TARGET_IP` (the VPS IPv4 for apex domains).
- Manual: yes · Credentials: DNS · Small

### C-5 · Creative tools rollout flag — P1
- **Status:** Implemented. `CREATIVE_TOOLS` defaults to **off** in production.
- **Why:** With it off, Comics/Characters/Projects/Shop are visible but show "not enabled on this server yet" and the API refuses new specialist pages/blocks.
- **Action:** Set `CREATIVE_TOOLS=on` once the legal texts (A-1) cover products and the private-download flow has been tested on R2.
- Manual: yes · Credentials: no · Small

### C-6 · Continuous integration — P1
- **Status:** Missing (no CI config in the repository).
- **Action:** Pipeline with PostgreSQL 16 service: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm db:test:migrate`, `pnpm test:sql`, `pnpm test`, `pnpm build`; Playwright on demand. Note: visual baselines are Linux/Chromium-specific.
- Manual: yes · Credentials: no · Medium

## D. Billing

### D-1 · Webhook endpoint configured — P0
- See A-5. URL must answer 200 directly (no redirect); events are persisted then reconciled by re-reading the provider, so duplicates and out-of-order delivery are safe.
- Manual: yes · Credentials: Asaas · Small

### D-2 · Final prices and fees — P0
- **Status:** Defaults in `packages/shared/src/plans.ts`; override with `PLAN_PRICES` (centavos).
- **Action:** Decide prices including Asaas fees and taxes (A-10); the pricing page and checkout read the same catalog.
- Manual: yes · Credentials: no · Small

### D-3 · Cancellation and refund policy — P0
- **Status:** Implemented behavior: cancellation keeps access until period end, no proration, refunds handled in the Asaas dashboard and reflected by sync.
- **Action:** Make the published refund policy match the CDC 7-day right of withdrawal for online purchases (legal review, A-1) and document the operator refund procedure.
- Manual: yes · Credentials: Asaas · Small

### D-4 · Reconciliation monitoring — P1
- **Action:** Alert on subscriptions with `sync_error` and on `provider_events` unprocessed for more than one hour (both visible in `/admin` overview). Pix subscriptions are not auto-charged; confirm Asaas reminder emails are enabled.
- Manual: yes · Credentials: no · Small

### D-5 · Artist sales stay external — P2 (informational)
- Digital product checkout links point to the artist's own store; SaaS billing credentials are never used for artist sales. A marketplace would need seller onboarding, settlement, disputes and legal review.

## E. Reliability

### E-1 · Monitoring and alerting — P1
- **Status:** Health endpoint implemented; nothing monitors it.
- **Action:** External uptime checks on `https://app.DOMAIN/api/health` and a published portfolio; alert on API 5xx rate, maintenance job failures, disk and memory.
- Manual: yes · Credentials: monitoring service · Small

### E-2 · Logs — P1
- **Status:** API writes structured JSON (pino) and never logs bodies, cookies or SQL values.
- **Action:** Persist and rotate logs (journald or a log service) with a defined retention period consistent with the privacy policy.
- Manual: yes · Credentials: no · Small

### E-3 · Incident and recovery runbook — P2
- **Action:** Short runbook: restart services, roll back a release (previous build + migrations are additive), restore from backup (A-8), rotate secrets, take a portfolio offline (`/admin` restriction).
- Manual: yes · Credentials: no · Small

### E-4 · Capacity notes — P2
- One API process with a 10-connection pool and 5 s acquisition timeout; Neon pooling handles bursts. Image processing (sharp) and scrypt are CPU/memory heavy: watch memory on the VPS.

## F. Legal and privacy

### F-1 · LGPD obligations — P0
- **Status:** Partially implemented: data export (`/me/export`), account deletion, cookie-free analytics, consent records.
- **Action:** Identify the controller and the data-protection contact (encarregado) in the privacy policy; list processors and **international transfers** (Neon, Cloudflare, Resend, and possibly your VPS provider, process data outside Brazil); define retention for backups, logs, billing records and deleted accounts; prepare an incident-notification procedure (ANPD and affected users).
- Manual: yes · Credentials: no · Medium (legal)

### F-2 · Copyright and takedown workflow — P1
- **Status:** Implemented: public notice form (`/legal/copyright`), report form on portfolios, `/admin` reports and restrictions with audit log.
- **Action:** Define response times, counter-notice/appeal handling and who reviews; monitor `/admin` daily at launch.
- Manual: yes · Credentials: no · Small

### F-3 · Mature content and acceptable use — P1
- **Action:** Decide the mature-content policy referenced in the terms and how it is enforced (reports + restriction).
- Manual: yes · Credentials: no · Small

### F-4 · Cookie notice — P2
- Only essential cookies are set (session, `studio_lang`); analytics are cookie-free. Confirm with counsel that no banner is required and say so in the privacy policy.

## G. Performance

### G-1 · Image delivery caching — P1
- **Status:** Every image request goes edge → Next → Fastify → PostgreSQL authorization → R2 download. Public images use `Cache-Control: public, max-age=0, must-revalidate` with an ETag, favoring instant withdrawal on unpublish.
- **Why:** Galleries with many images multiply API work and R2 read operations.
- **Action:** Measure in staging. Options: let the edge cache public images for a short time (e.g. 60 s) and accept that delay for withdrawal, or serve published images from R2 through signed/short-lived URLs.
- Manual: no · Credentials: no · Medium

### G-2 · Public page rendering — P2
- Each portfolio view reads the active snapshot from PostgreSQL (one joined query) and records an analytics hit. Fine for launch; benchmark before raising catalog limits (`docs/PHASE3.md`).

### G-3 · Artwork discovery query — P2
- `/discover` (artwork search) scans all opted-in published snapshots on each request; the artist directory uses a GIN index. Add a materialized search table if discovery traffic grows.

### G-4 · Large libraries and autosave — P2
- Each draft save rewrites the site's page/gallery/artwork rows in one transaction. Measure with plan maximums (Studio plan limits) before raising them.

## H. Product and UX

### H-1 · Legal placeholders visible — P0
- Covered by A-1.

### H-2 · Creative sections notice in production — P1
- Covered by C-5. Until enabled, the four Create sections explain that creation is not enabled yet.

### H-3 · Color contrast — P1 (design decision)
- **Status:** An axe-core WCAG 2.1 AA scan of 18 pages found no missing labels/alt text but 615 low-contrast text nodes, all from the design's light secondary text (`text-ink/35`–`/45`, tags, captions).
- **Action:** Decide whether to raise secondary text to ≥ 4.5:1 (roughly `ink/60` on the paper background). This changes the approved Base44 look, so it needs a design sign-off; update the visual baselines afterwards.
- Manual: yes (decision) · Credentials: no · Medium

### H-4 · Missing account features — P2
- No MFA, no Google sign-in, one portfolio per account, no renewal/receipt emails from the platform (Asaas sends payment emails), demo template text is English in both languages.

### H-5 · Studio sidebar at short heights — P2
- Below ~900 px viewport height the lower navigation scrolls under the storage card. Consider a more compact sidebar.

## I. Optional improvements after launch

- Remove the 18 MB of review archives tracked in `docs/recovery-review/` (or move them to release assets).
- Shared rate-limit store and stateless sessions checks only if scaling beyond one API process.
- Error tracking (e.g. Sentry) for the web and API.
- Scheduled publication, reader accounts, marketplace payments (Phase 3 future work).
- Automated accessibility checks in CI (axe-core with Playwright).
