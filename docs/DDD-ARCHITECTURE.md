# Domain-driven architecture

The code is organized by product capability (bounded context), not by file type. The structure is deliberately pragmatic: a context gets `domain/`, `application/`, `infrastructure/` and `presentation/` folders only when it has something to put in them. `tests/architecture.test.ts` enforces the rules below.

## Bounded contexts

| Context | API module | Web feature(s) | Owns |
| --- | --- | --- | --- |
| Identity & Access | `identity` | `features/identity` | Registration, sign-in, sessions, email verification, password reset, profile, account deletion |
| Compliance & Support | `compliance` | `features/legal`, `features/account` (support, export) | Consents, LGPD data export, support requests, copyright notices |
| Tenancy (shared kernel) | `tenancy` | - | The site ↔ owner boundary and the site row lock |
| Entitlements | `entitlements` | - (plan data in `@doodallery/shared`) | The effective plan from stored subscription periods; limits and features |
| Portfolio, Editor & Publishing | `portfolio` | `features/studio`, `features/editor`, `features/creative`, `features/galleries`, `features/theme`, `features/commissions`, `features/onboarding`, `entities/portfolio` | Sites, normalized drafts, pages, galleries, creative pages (comics, characters, projects, products), page history, saved sections, publication snapshots, public reads, reports |
| Media & Assets | `media` | `features/library` | Upload reservations, image processing, object storage, delivery authorization, storage accounting, garbage collection |
| Digital Products | `products` | `features/creative/ProductFile.tsx` | Private product files and expiring download grants (checkout stays with the artist's store) |
| Billing | `billing` | `features/billing` | Checkout, plan changes, cancellation, Asaas/mock providers, webhooks, reconciliation |
| Domains | `domains` | `features/domains` | Custom-domain claims, DNS proof, routing checks, TLS gate, re-verification |
| Analytics | `analytics` | `features/analytics` | Cookie-free daily aggregates and reports |
| Artist Discovery | `discovery` | `features/discovery`, `features/marketing` (Explore) | Directory opt-in, artwork discovery, visibility and indexing preferences |
| Administration | `administration` | `features/admin` | Operator console and audit log |

Comics, characters, projects and products are not separate contexts: they are specialist **page kinds** inside Portfolio, so they share the draft, revision and publication workflow. The studio exposes them as separate sections (Create → Comics, Characters, Projects, Shop) that filter Pages by kind.

## Dependency direction

```
presentation → application → domain
      ↓              ↓
 infrastructure ←────┘           (domain depends on nothing outward)

modules ──→ other modules' index.ts only
modules ──→ platform/ (config, errors, crypto, HTTP policy)
platform ─╳→ modules
```

Module dependencies (no cycles; checked by the architecture test):

```
identity, tenancy, entitlements      ← no module dependencies
media        → tenancy, entitlements, identity
portfolio    → tenancy, entitlements, media, identity
products     → tenancy, entitlements, media, identity
domains      → tenancy, entitlements, identity
analytics    → tenancy, entitlements, identity
discovery    → identity
compliance   → identity, tenancy, portfolio
billing      → entitlements, media, identity
administration → identity, entitlements, billing
```

Identity needs two things from other contexts (stop billing before deletion, release unused media after an avatar change). They are injected by the composition root (`app.ts`) as `IdentityHooks`, so Identity has no module dependencies.

## Backend layout (`apps/api/src`)

```
main.ts                 process entry
app.ts                  composition root: adapters + route registration
jobs/maintenance.ts     hourly job (`pnpm cleanup`)
platform/               config.ts, errors.ts (Fault/assert), crypto.ts, http.ts
modules/<context>/
  index.ts              the context's public API - the only file other modules import
  domain/               pure rules and invariants (no Fastify, SQL, storage, network)
  application/          use cases; orchestrate transactions, locks and domain rules
  infrastructure/       SQL repositories, object storage, image processing, providers, DNS/TLS
  presentation/         Fastify routes: parse input (Zod), authenticate, call a use case, map output
```

Examples of rules that moved out of route handlers into `domain/`:

- `portfolio/domain/rules.ts`: page quota with downgrade tolerance, artwork/asset identity, publication eligibility, creative rollout and chapter limits, public chapter trimming.
- `media/domain/quota.ts`: reservation and post-processing storage limits, object key layout.
- `domains/domain/hostname.ts`: hostname normalization and blocking, DNS proof evaluation.
- `analytics/domain/traffic.ts`: automated-traffic filter, path normalization, referrer categories, report windows.
- `identity/domain/credentials.ts`: credential formats, lifetimes, session cookie policy.

Plan definitions, the subscription state machine, the draft contract, block allowlist and the publication filter live in `@doodallery/shared` because both apps use them.

## Frontend layout (`apps/web`)

```
app/                    Next.js routes, layouts, metadata - composition only
proxy.ts                host routing, tenant rewrite, CSP nonce
features/<context>/     a capability's components plus its hooks/model/api files
entities/portfolio/     Portfolio renderer + four templates, shared by editor, preview and public pages
shared/ui/              design-system pieces: bits (Sparkle…), Logo, Field/buttonClasses, Status,
                        Language, studio-kit (PageHeader, EmptyStudio, pills), ui.css
shared/lib/             client.ts (browser API client), copy.ts (PT-BR/EN), cn, reorder,
                        server.ts (server helpers), internal-api.ts (private API origin + token)
```

Rules:

- `shared/` never imports `features/` or `entities/`.
- Public routes (`app/site`, `app/demo`) never import studio, editor, billing or admin code.
- No web file imports `@doodallery/db`, `fastify`, `pg` or the API package. The backend remains authoritative for authorization, quotas and entitlements; the web mirrors limits only for messaging.
- Feature folders stay flat while small. Add `hooks.ts`, `model.ts` or `api.ts` inside the feature when it grows.

### Tailwind sources

`shared/ui/ui.css` (studio, auth, templates) and `features/marketing/home/home.css` (marketing) each declare `@source` lists. **A new folder with Tailwind classes must be added to the matching list**, otherwise its classes silently disappear from that bundle. `app/style.css` scans the whole app. `tests/browser/visual.spec.ts` catches regressions on the homepage, pricing and templates.

## Conventions

- Errors: throw `Fault(status, code)` or `assert(cond, status, code)`; the HTTP policy maps everything else to `invalid_input`, `already_exists`, `rate_limit`, `upload_size` or `request_failed`. Codes are translated in `shared/lib/copy.ts`.
- Tenant access: every site-scoped use case starts with `owned(tx, site, user)` inside a transaction. It returns 404 for other tenants and locks the site row.
- Optimistic concurrency: draft saves and publication require the current `version`; stale versions fail with `409 conflict`.
- SQL: parameterized `sql` templates from `@doodallery/db`; raw SQL lives in `infrastructure/` or `application/` (transactional use cases), never in `domain/`.
- Both PT-BR and English labels for every user-facing string.

## How to add…

**A feature (end to end).** Decide which context owns the data. If it changes the draft, extend the Zod contract in `packages/shared`, add a versioned migration, then the repository, then a use case, then the route. Put pure rules in `domain/` with a unit test in `tests/domain.test.ts`. Add the UI under `features/<context>/`, wire it into `features/studio/Studio.tsx` (tab) and `DashLayout.tsx` (navigation), and add its folder to the `@source` list.

**An API endpoint.** Add the route to `modules/<context>/presentation/*.routes.ts`: parse params/body with Zod, call `account(db, req, env)` for authenticated routes, delegate to an application function, return JSON. Mutations automatically require the app Origin and `x-doodallery-request: 1`; server-to-server routes go under `/internal/` and call `requireInternal`. If another module needs the behavior, export it from that module's `index.ts`.

**A database entity.** Add `packages/db/migrations/00NN_name.sql` (never edit applied migrations), include `site_id` and composite foreign keys for tenant-owned rows, add indexes for the access paths, mirror the table in `packages/db/src/schema.ts`, write the repository in the owning module's `infrastructure/`, and extend `tests/database.sql` for constraints. Run `pnpm migrate` and `pnpm db:test:migrate`.

## File moves in this refactor

| Before | After |
| --- | --- |
| `apps/api/src/auth.ts`, `mail.ts` | `modules/identity/…` (split into domain, application, infrastructure, presentation) |
| `account.ts` | `modules/compliance/presentation/compliance.routes.ts` |
| `sites.ts`, `drafts.ts`, `creative.ts`, `editor-tools.ts` | `modules/portfolio/…`, `modules/tenancy/index.ts`, `modules/discovery/…` (visibility, artwork discovery) |
| `uploads.ts`, `images.ts`, `storage.ts`, `cleanup.ts` | `modules/media/…`, `jobs/maintenance.ts` |
| `plan.ts` | `modules/entitlements/application/entitlements.ts` |
| `billing/*` | `modules/billing/{application,infrastructure,presentation}` |
| `domains.ts`, `analytics.ts`, `directory.ts`, `products.ts`, `admin.ts` | `modules/<context>/…` |
| `config.ts`, `errors.ts`, `security.ts` | `platform/config.ts`, `platform/errors.ts`, `platform/crypto.ts` |
| `apps/web/components/Portfolio.tsx`, `components/templates/*`, `lib/demo.ts` | `entities/portfolio/…` |
| `apps/web/components/studio/*` | `features/{studio,creative,galleries,library,theme,commissions,analytics,domains,billing,account,onboarding}` |
| `components/studio/editor/*` | `features/editor/*` |
| `components/home/*`, `components/marketing/*` | `features/marketing/…`, `features/discovery/…` |
| `components/ui/*`, `components/auth/Field.tsx`, `components/home/{bits,Logo}.tsx`, `components/studio/parts.tsx`, `lib/{client,copy,reorder,server,studio-intent}.ts` | `shared/ui/…`, `shared/lib/…` |
