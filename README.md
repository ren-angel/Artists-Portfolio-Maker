# Artists Portfolio Maker

A bilingual portfolio builder with a Next.js studio, a Fastify API, PostgreSQL and private image storage. The reference export lives in `Design/`. The application runs from `apps/` and `packages/`. See [verification status](docs/CHECKPOINT.md) before deployment.

## Local development

Use Node 24 LTS, pnpm 10.32.1 and PostgreSQL 16 or newer. Install pnpm with Corepack or your preferred package manager. Run commands from the repository root.

1. Copy `.env.example` to `.env`. Generate a local database password and replace `CHANGE_ME` in all three database settings. URL-encode the password in connection URLs. Set `LOCAL_DATA_DIR` to a persistent, private absolute directory you control, such as the ignored `.local/data` folder in this checkout. Back up this folder together with PostgreSQL. Operating-system temporary folders can be emptied at reboot.
2. Start PostgreSQL with `docker compose up -d postgres`, use an existing local database, or set the two connection URLs for a Neon development branch. If another PostgreSQL service owns port 5432, set `POSTGRES_PORT` to a free loopback port (for example 5433) and use that port in both database URLs and the test URL. Preserve the existing Compose volume. For Neon, use its pooled URL at runtime and direct URL for migrations, with its TLS parameters.
3. Install packages, apply migrations and start both services.

```sh
pnpm install
pnpm migrate
pnpm dev
```

Open [the local application](http://localhost:3000). Register, choose an address and portfolio title, and follow setup. The local mail adapter writes private JSON files inside `LOCAL_DATA_DIR/mail/`. Open the verification link from the message for your address and press the confirmation button. Use the same host for registration, verification and editing. The API listens on port 4000 and the web server proxies same-origin requests under `/api`.

### Try the artist workflow

- In **Artwork library**, upload JPEG, PNG or WebP images. Select a thumbnail to edit its caption, accessible description, featured state or file.
- In **Galleries**, create a collection, add works, set their sequence and select a cover. A work can appear in several galleries and the home page simultaneously.
- In **Pages**, create content pages, choose the home page and order the navigation. The editor saves valid changes automatically. Check the save indicator before leaving.
- In **Visual editor**, choose a page, add sections, select a section and adjust its properties. Use the arrow buttons or drag sections to reorder them. **Appearance** sets the template, typography, accent, navigation and portfolio language.
- Open **Preview** to see the private draft. Publish from Overview or the final onboarding step. Visit `/site/YOUR-HANDLE` from a signed-out browser. Later edits go live when published again. Unpublishing also removes anonymous access to the publication’s images.

### Demo content

`/demo/gallery`, `/demo/creative`, `/demo/showcase` and `/demo/story` use original print illustrations bundled with the web application. To populate a development database with four independently published portfolios, run `pnpm seed`. Visit `/site/demo-creative`, for example. Demo accounts receive random passwords and use example.invalid email addresses. A new artist starts with an empty library.

### Optional S3-compatible storage

For MinIO, set a development-only `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD`, then run `docker compose --profile storage up -d`. Create a private bucket in the [local console](http://localhost:9001), create scoped S3 credentials and enable the S3 settings below. Configure bucket CORS to allow PUT requests with Content-Type from APP_ORIGIN. The browser must be able to reach S3_ENDPOINT. With `STORAGE_DRIVER=local`, no object service is required. Run `pnpm cleanup` to process expired reservations and queued object deletions.

## Configuration

| Variables | Purpose |
| --- | --- |
| `DATABASE_URL`, `DIRECT_DATABASE_URL` | Runtime PostgreSQL pool and direct migration connection |
| `TEST_DATABASE_URL` | Separate disposable database for integration tests |
| `APP_ORIGIN`, `PLATFORM_DOMAIN`, `PLATFORM_NAME` | Exact authenticated web origin, bare routing domain and configurable display name |
| `API_INTERNAL_ORIGIN`, `HOST`, `PORT` | Private API upstream, bind address and port. Supply upstream during Next build and runtime. |
| `TRUST_PROXY`, `INTERNAL_TOKEN` | Trusted proxy addresses for per-client rate limits, and the web ↔ API shared secret. Required in production. |
| `LOCAL_DATA_DIR` | Absolute private directory shared by API, maintenance and local test commands |
| `STORAGE_DRIVER`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Local files or private S3-compatible storage. R2 uses its account endpoint and region auto. |
| `MAIL_DRIVER`, `MAIL_FROM`, `RESEND_API_KEY` | Development files or Resend transactional delivery |
| `MAX_SITES`, `MAX_PAGES`, `MAX_ARTWORKS`, `MAX_STORAGE_BYTES`, `MAX_UPLOAD_BYTES` | Server-enforced quotas. Five additional pages plus the home page, 50 works and 200 MiB by default. |
| `POSTGRES_PASSWORD`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` | Optional local Compose services |
| `NODE_ENV` | Set production for deployed services. Production requires HTTPS, S3 storage and transactional mail. |

## Verification

Create a disposable database and set `TEST_DATABASE_URL` in `.env`. For Compose, one way to create it is `docker compose exec postgres createdb -U studio studio_test`. SQL checks require the PostgreSQL command-line client. Browser tests need a running development web/API pair with file mail enabled, a shared absolute `LOCAL_DATA_DIR` and a disposable application database. The browser test intentionally creates a published test portfolio.

```sh
pnpm db:test:migrate
pnpm test:sql
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm exec playwright install chromium
pnpm e2e
```

`pnpm test:unit` runs the model, image, password, renderer, domain-rule and architecture-boundary tests without a database. `pnpm test` runs every file in `tests/*.test.ts`, including the real API integration, billing, platform and security tests, and requires the test database. `pnpm e2e` includes screenshot regression tests (`tests/browser/visual.spec.ts`) for the homepage, pricing and templates; update baselines intentionally with `pnpm e2e tests/browser/visual.spec.ts --update-snapshots`. Run browser tests against their own disposable database, data directory and ports so development data is never touched.

## Plans and billing (Phase 2)

Free, Artist and Studio plans are defined in `packages/shared/src/plans.ts`. Locally, `BILLING_DRIVER=mock` opens a simulated invoice where you can approve or fail a payment; no money moves. Choose a plan under **Plan & billing** in the studio. See [billing](docs/BILLING.md) for the Asaas integration, states and policies, and grant yourself the operator console at `/admin` with `pnpm admin grant you@example.com`.

## Project documentation

- [Production deployment TODO](docs/PRODUCTION-DEPLOYMENT-TODO.md) — prioritized launch checklist
- [Feature status](docs/FEATURE-STATUS.md) and [latest test report](docs/TEST-REPORT.md)
- [Domain-driven architecture](docs/DDD-ARCHITECTURE.md) — bounded contexts, layers and how to add features
- [Architecture and tenant boundaries](docs/ARCHITECTURE.md)
- [Visual implementation guide](docs/VISUAL-GUIDE.md)
- [Deployment and maintenance](docs/DEPLOYMENT.md)
- [Billing, plans and entitlements](docs/BILLING.md)
- [Implementation checkpoint and Phase 2 handoff](docs/CHECKPOINT.md)
- [Recovery and verified commands](docs/RECOVERY-STATUS.md)
- [Phase 2 audit](docs/PHASE2-AUDIT.md) and [full-page design comparisons](docs/DESIGN-COMPLETENESS-AUDIT.md)

## Creative pages and products (Phase 3)

Open **Studio → Create → Comics, Characters, Projects or Shop** (or **Pages**) to create a comic series, character, project or digital listing. Select which pages and chapters to include, then publish. The visual editor's **Pages** panel provides history and reusable sections. Under **Settings → Privacy & discovery**, artists can list a published portfolio with its category and tags.

Set `CREATIVE_TOOLS=on` to enable new specialist page and section authoring in production after applying migrations. External checkout uses the artist's own store. The Phase 3 guide covers chapter limits, private downloads, provider status and rollout. [Phase 3 guide](docs/PHASE3.md)
