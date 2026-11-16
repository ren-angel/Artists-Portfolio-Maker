# Artists Portfolio Maker checkpoint

## DDD refactor and production readiness · 15 November 2026

Branch `refactor/ddd-production-readiness`. The API is organized into bounded-context modules and the web app into `shared/`, `entities/portfolio/` and `features/` ([architecture](DDD-ARCHITECTURE.md)). Comics, Characters, Projects and Shop are now studio sections instead of "Coming soon". Rate limits work per client behind the web proxy (`TRUST_PROXY`), sharp is upgraded, and new domain, architecture, security, studio-section and screenshot tests were added. Routes, payloads and the database schema are unchanged; no migration was added.

All local checks pass (55 integration/unit tests, 26 browser tests, lint, typecheck, build) — see the [test report](TEST-REPORT.md). Production is **not** ready: providers, edge/TLS, backups, scheduling and legal review are outstanding. Next steps are in [PRODUCTION-DEPLOYMENT-TODO.md](PRODUCTION-DEPLOYMENT-TODO.md); feature coverage is in [FEATURE-STATUS.md](FEATURE-STATUS.md).

## Phase 3 · 15 November 2026 (earlier)

Artist authoring is available in **Studio → Pages**. Comics, characters, projects and digital products use the existing page, theme and publication workflow. The page editor includes responsive containers, reusable sections and private revision history. Artist directory participation is opt-in. See the [Phase 3 guide](PHASE3.md) for limits, checkout ownership, reader behavior and rollout.

| Verification | Observed result |
| --- | --- |
| `pnpm migrate`, `pnpm db:test:migrate` | Applied 0009 and 0010 to the configured local studio. All ten migrations applied on fresh PostgreSQL 16 databases. Running the test migration again made no changes. |
| `pnpm test:sql`, `pnpm test:unit`, `pnpm test` | Passed. The full suite ran 37 tests with zero failures or skips. Coverage includes tenant isolation, publication filtering, chapter ordering, content relationships, download authorization and expiry, plan limits and opt-out. |
| `pnpm lint`, `pnpm typecheck`, `pnpm build` | Passed, including the production API bundle and Next.js build. |
| `pnpm exec playwright install chromium`, `pnpm e2e` | Chromium available. All seven browser journeys passed against isolated local services. New journeys cover comic authoring and mobile reader resume, plus editor undo/redo, section reuse and revision restore after reload. |

Baseline testing exposed a renewal-date display mismatch when PostgreSQL returned a timestamp in the local timezone. The billing response now serializes the period end in UTC. Browser verification also caught a template choice that could receive a click before hydration. The picker now enables its controls when the client can handle selection.

Testing used local PostgreSQL, file storage, file mail and mock subscription billing. External provider playback, a real seller purchase, production object storage, mail and domain TLS still require staging. The marketplace checkout has no implementation. Legal texts remain drafts pending review.

## Earlier checkpoints

## Recovery handoff · 14 November 2026

The source and storage recovery, current command results and outstanding temporary image are recorded in the [recovery record](RECOVERY-STATUS.md). See the [Phase 2 audit](PHASE2-AUDIT.md) for local coverage and the provider release gates, and the [design audit](DESIGN-COMPLETENESS-AUDIT.md) for full-page comparisons. The original interrupted state is preserved on `codex/pre-recovery-20261114`. The verified work is on `codex/recovery-20261114`. The older entries below are historical.


1. Establish pnpm workspace, runtime configuration, shared validators and versioned database.
2. Implement accounts, tenant ownership and safe host routing.
3. Connect normalized draft pages, galleries, memberships and media to a shared template renderer.
4. Implement bounded uploads, image processing, object storage and cleanup.
5. Implement revision-gated saves, immutable publication and private preview.
6. Build the studio, onboarding, editor, bilingual public experience and SEO.
7. Exercise migration, integration/security cases, mobile browser journey and production builds. Record actual results and remaining work here.

## Checkpoint, 13 November 2026

The implementation for steps 1–6 is present. Phase 1 remains open at step 7. The original Design/ export was inspected before writing the visual guide and remains isolated. The export includes remote Base44 image URLs. Four locally bundled original illustrations serve demonstration pages and development seed data.

### Verification actually performed

| Check | Result |
| --- | --- |
| Four SQL migrations on an empty native PostgreSQL 16.15 cluster | Applied all four in order with the standalone PostgreSQL executable. Confirmed 17 application tables. |
| tests/database.sql | Passed on native PostgreSQL. Exercises cross-tenant foreign keys, unique slugs, publication isolation, membership deletion and deletion of a published account, including its queued objects and the surviving second tenant. |
| tests/model.test.ts and tests/render.test.ts | Eight tests passed with Node's test runner, cached React/Zod/Sharp and a local TypeScript loader. Includes actual decoding, scrypt, environment validation and React SSR of all four templates. Package versions came from locally available caches rather than a resolved workspace lockfile. |
| Handler and SQL smoke test | Passed with the production route callbacks, actual parameterized SQL on embedded PostgreSQL (PGlite), development mail files, real Sharp processing, and temporary adapters for query execution, route registration and object bytes. Exercised two accounts, denial of another user's draft, verification, upload failure/retry, quota reservations, galleries, featured artwork, conflicts, publication, image survival after draft deletion, unpublication, reset, session revocation, logout and deletion. This bypassed Fastify HTTP transport, Drizzle's driver and S3. |
| Syntax and partial type checks | Parsed 50 TS/TSX source files with TypeScript. Type-checked 17 selected studio/shared/test entry points and their resolved dependencies with zero diagnostics. |
| Package install | Registry DNS lookup failed. Offline pnpm resolution reported ERR_PNPM_NO_OFFLINE_META. The required Next.js, Fastify and Drizzle workspace could not be installed. No lockfile was synthesized. |
| Normal build, lint, integration and browser commands | Attempted both workspace build scripts, lint, the full test script and Playwright. They stopped before execution because the workspace dependencies were missing. No production build, full typecheck, real Fastify HTTP test, browser interaction, accessibility audit or pixel-level visual comparison is verified. |
| Provider integrations | Live R2/MinIO, Resend, wildcard DNS and TLS remain untested. Local email was exercised without sending email externally. |

The verification run found and corrected an optional-link validator that threw on empty strings and a foreign-key ordering problem during deletion of an account with published artwork.

### Resume here

1. In a network-enabled checkout run the local setup in README.md. Generate and review pnpm-lock.yaml, apply migrations through the actual Drizzle runner to a fresh database, then rerun against the same database to check idempotence.
2. Follow the complete README verification sequence. Fix type or runtime errors, rerun both builds, and execute the two Playwright tests against running Next and Fastify processes. Verify tenant hostnames with the intended ingress and a signed-out browser.
3. Compare rendered desktop and mobile views with Design/, including onboarding, keyboard reordering, focus, autosave conflict recovery, template demos and publishing. Test real storage PUT CORS/signatures and transactional delivery using staging credentials. Update this file with observed results.
4. Production keeps a single active publication. Image cache revalidation preserves the ability to withdraw access. Old slugs return 404 after republishing. The Phase 1 studio targets one portfolio per account. Keep MAX_SITES=1 until a site picker and multi-site preview selector exist.
5. Before launch, configure trusted edge rate limits, scheduled cleanup, backup restoration, mail monitoring, report triage and public privacy information as described in DEPLOYMENT.md.

### Phase 2 handoff

Start Phase 2 after the remaining Phase 1 checks pass. Extend the entitlements table into explicit per-plan limits and subscription states. Add authenticated checkout and an idempotent, signature-verified webhook processor. Apply quota increases and downgrades through the same site-lock transactions that reserve uploads. Retain access to existing work when an artist downgrades. If offering rollback, retain revisions and their asset pins together with a retention/usage policy. Add paid navigation and marketing pricing only after the corresponding workflows work end to end.


## Phase 2 checkpoint, 13 November 2026

Phase 2 (commercial launch) is implemented in local and test mode. Live payments and custom-domain TLS are **not** verified: they need real Asaas and hosting configuration.

### Implemented
- **Plans:** central catalog with configurable prices; quotas enforced in the API from the effective plan; plan-gated publishing that keeps draft content.
- **Billing:** Asaas client and mock driver behind one provider interface; checkout through the hosted invoice; durable idempotent webhook log; reconciliation by re-reading the provider; upgrade/downgrade scheduling; cancellation to period end; 7-day grace; expiry; payment history; account deletion stops charges.
- **Custom domains:** normalization and blocking of platform/internal names; DNS TXT ownership proof; CNAME/A checks; TLS handshake probe; primary domain and canonical URLs; on-demand TLS gate; daily re-verification; routing by the web proxy.
- **Commissions:** status, types, ranges, currencies, examples, terms, allowed/disallowed lists, contacts (email, WhatsApp, links), four new sections, and counted contact clicks via a redirect that cannot be used as an open redirect.
- **Analytics:** cookie-free daily aggregates, bot filtering, referrer categories, optional edge country, tenant isolation, 400-day retention, plan-gated advanced reports.
- **Customization:** palette presets, extra type pairings, corners, shadows, hover, artwork shape, uniform/masonry grids, section background images, footer note and social toggle. Schema defaults keep older drafts and snapshots valid.
- **Studio and account:** plan/usage/domain/analytics summaries with limit warnings; public pricing page; draft legal pages marked for legal review; terms acceptance records; data export; support requests; copyright takedown form; admin console with audit log and account restriction.

### Verification actually performed
- `pnpm test`: Phase 1 plus billing (lifecycle, duplicates, out-of-order events, failure, grace, cancel, upgrade, downgrade, content preservation, concurrent quotas) and platform (domains, collisions, routing rules, commissions gating, analytics isolation, admin authorization, consents, export, deletion stops charges), against PostgreSQL with the mock provider.
- `pnpm test:unit`: includes the pure lifecycle, tax ID, price and entitlement tests.
- Playwright: the Phase 1 journeys and a free → Artist (simulated confirmed payment) → paid feature → cancel journey.
- Manual checks against the running dev pair: custom-domain routing via the Host header (canonical URL, no branding, private routes 404, unknown hosts 404); real-browser view counting with bots excluded; `pnpm cleanup` with billing maintenance.

### Launch blockers
1. **Asaas:** sandbox account, webhook, and an end-to-end sandbox run including card renewal on the invoice page and refunds; confirm fees and adjust prices.
2. **Hosting:** edge with on-demand TLS (or a managed custom-domain API), the DNS target, and the hourly maintenance schedule.
3. **Legal:** qualified review of all `/legal` documents (LGPD, CDC right of withdrawal, refund window, mature content policy, provider list); fill `LEGAL_ENTITY_NAME` and `SUPPORT_EMAIL`.
4. **Production secrets:** `INTERNAL_TOKEN`, `BILLING_WEBHOOK_TOKEN`, and shared edge rate limits.

### Phase 3 preparation
- The provider interface allows an international driver (for example Stripe) and per-currency prices (`PLAN_PRICES` already accepts currencies).
- Multiple sites per account remain capped at one; the plan catalog already carries a `sites` limit.
- The commission tools are informational. Payments for commissions, contact forms with spam protection and a marketplace are deliberately not built.
