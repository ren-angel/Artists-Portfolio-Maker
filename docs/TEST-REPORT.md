# Test report · 15 November 2026

Branch `refactor/ddd-production-readiness`. All commands below were executed on the development machine (Node 24.22, pnpm 10.32.1, PostgreSQL 16 in Docker on port 5433, Chromium via Playwright 1.65). Nothing ran against production providers.

## Environment

| Purpose | Database | Storage / mail / billing |
| --- | --- | --- |
| Integration tests (`pnpm test`) | `TEST_DATABASE_URL` (disposable `recovery_20261114_test`) | temp directories, file mail, mock billing |
| Browser tests (`pnpm e2e`) | new disposable `studio_e2e` (all 10 migrations applied fresh) | separate data directory; API on :4100, Next dev on :3100, `CREATIVE_TOOLS=on` |

The developer database and the developer's running servers (:3000/:4000) were not used or modified.

## Results (final run, after all changes)

| Command | Result |
| --- | --- |
| `pnpm db:test:migrate` | Pass — no pending migrations (0009/0010 had been applied at the start of this pass) |
| `pnpm test:sql` | Pass — constraint checks in a rolled-back transaction |
| `pnpm test:unit` | **37/37 pass** (model, image, password, renderer, plans, Asaas, homepage, domain rules, architecture) |
| `pnpm test` | **55/55 pass**, 0 skipped (all unit tests + real Fastify/PostgreSQL integration: API, billing, platform, security) |
| `pnpm lint` | Pass, no warnings |
| `pnpm typecheck` | Pass (root + web) |
| `pnpm build` | Pass — API bundle 146 kB; Next.js production build |
| `pnpm e2e` (isolated pair) | **26/26 pass**: 8 journeys + 18 screenshot comparisons |
| `pnpm cleanup` (maintenance job) | Pass against `studio_e2e` |
| `pnpm seed` | Pass against `studio_e2e`; `/site/demo-creative` → 200 |
| `pnpm audit --prod` | Before: 3 high (sharp). After upgrade: 0 production advisories; 1 moderate in dev tooling (`minimatch` via `typescript-eslint`) |

Baseline at the start of the pass: lint, typecheck, SQL checks and 37/37 integration tests passed; production build passed.

## Tests added

| File | Covers |
| --- | --- |
| `tests/domain.test.ts` | Extracted domain rules: page quota with downgrade tolerance, publication eligibility, artwork asset identity, page-history diffing, chapter trimming, upload quotas, DNS evaluation and hostname blocking, traffic classification, session cookie policy, error mapping |
| `tests/architecture.test.ts` | API domain layers free of Fastify/SQL/providers; cross-module access only via `index.ts`; no module cycles; web `shared/` independent of features; public routes free of studio code; no server packages in the web app |
| `tests/security.test.ts` | Origin/CSRF enforcement on mutations, session cookie flags, response headers, forged sessions, webhook token, internal-token checks, stable error codes, login rate limiting, per-client limits behind a trusted proxy, internal-token rate-limit exemption |
| `tests/model.test.ts` (new case) | Only JPEG, PNG and WebP decoders reach libvips (TIFF, GIF, AVIF, SVG rejected) |
| `tests/browser/studio-sections.spec.ts` | Comics/Characters/Projects/Shop navigation, kind-scoped creation, autosave through the draft API, Pages listing, history navigation |
| `tests/browser/visual.spec.ts` | Screenshot baselines of homepage, pricing and four templates at 1440, 768 and 390 px |

## Visual regression evidence

- Compiled CSS before the refactor vs after: the marketing bundle is byte-identical; the studio/portfolio bundles differ only by `tracking-[0.15em]` (removed "Coming soon" disclosure) and `border-butter` (new rollout notice).
- Screenshot baselines were generated after the refactor, whose CSS matches the pre-refactor build, and re-ran stably. Later accessibility edits changed no existing baseline.

## Accessibility scan (axe-core 4, WCAG 2.0/2.1 A + AA, 18 pages)

Run once, not part of the suite (axe was installed outside the project). Results: no violations for labels, alt text, landmarks, ARIA or keyboard traps. **615 color-contrast nodes** across all pages (design's light secondary text; left unchanged pending a design decision, see deployment TODO H-3). **27 label-in-name mismatches** (language toggle, Explore cards) — fixed.

## Bugs and issues found and fixed

1. Comics, Characters, Projects and Shop were shown as "Coming soon" although implemented — activated as studio sections.
2. All visitors shared one rate-limit address behind the web proxy (platform-wide login lockout; public SSR reads competing in one global bucket) — `TRUST_PROXY` and internal-token exemption.
3. `sharp` 0.34 with three high-severity decoder advisories processing untrusted uploads — upgraded to 0.35.5 and loaders restricted.
4. Web silently fell back to the development internal token in production — now reported.
5. Deprecated Fastify `disableRequestLogging` option (warning on every start) — replaced with `LogController`.
6. Accessible-name mismatches on the language toggle and Explore cards.
7. `/discover` accepted an unbounded offset — now capped like the artist directory.

## Remaining limitations

- No test exercised Asaas, Resend, R2/S3 presigned uploads, wildcard DNS, real TLS issuance, or a backup restore.
- Browser tests ran against `next dev`, not `next start`; the production build was verified separately.
- Visual baselines are Linux/Chromium specific; other platforms need their own baselines.
- Not covered by automated tests: individual appearance options, comparison/carousel/process/timeline block rendering, the commission contact redirect route, keyboard-only journeys, and real load/performance measurements.
