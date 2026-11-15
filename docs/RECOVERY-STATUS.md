# Recovery record · 14 November 2026

## Entry checkpoint

Base commit `2a340ce` on main matched origin/main. Two previous commits cover the homepage and MVP. The index already contained the commercial implementation and migration 0005. Further working-tree edits added marketing routes, commission and analytics panels, account/editor changes and migrations 0006–0007. The working copy differed from HEAD in 107 tracked files, plus untracked files. Neither the staged commercial patch nor the later visual pass had a dedicated commit. A private recovery copy initially created at `/tmp/artist-recovery-pnkG4J` held the base SHA, separate binary staged/unstaged patches, all nonignored untracked files and prior test results. The checkout and index were preserved.

| Work | Status at entry | Evidence |
| --- | --- | --- |
| Source recovery | Complete | Reconciled HEAD, index, working files, both visual audits and the November 13 checkpoint. |
| API diagnosis | In progress | Last retained browser run had two missing-browser failures and one sandbox EPERM connecting to localhost. It received no HTTP response. Config points to local PostgreSQL, without a test database URL. |
| Phase 2 verification | In progress | Subscription, commission, analytics, domain, appearance and operator code exists. Checkpoint claims predate the final uncommitted changes. |
| Design | In progress | Comparison table is wired into homepage, pricing and billing. Latest design audit lacks fresh rendered comparisons. |
| External staging | Externally blocked | No confirmed payment sandbox, ingress, public test domain, bucket or mail sender in the local configuration. |

Immediate order of work is database and HTTP diagnosis, integration and browser verification, then interface repairs and provider handoff.

## API and database recovery

The project Compose container was stopped with its named volume intact. A different native PostgreSQL instance owned 127.0.0.1:5432. With socket access enabled, those credentials failed against it (SQLSTATE 28P01). Fastify registered successfully; the DB-independent plan catalog returned 200 while database health returned 503. Neither server was initially listening. Recreated the project container using the same volume on 127.0.0.1:5433, updated the ignored local URLs and made the Compose port configurable. The correct database authenticated but its migration ledger ended at 0005. Applied 0006 and 0007 to the recovered database. The app now has its required visibility and artwork-detail columns.

Created separate integration and browser databases. All seven migrations applied on a fresh database and a second run made no changes. SQL constraints passed. The initial full suite passed 30 tests, including the real Fastify/Drizzle/PostgreSQL integration, session reset, publication and billing. The browser pair returned 200 from /api/health through Next. A mobile artist completed upload, verification and publication. The host routing browser test also passed. No credentials were printed. The original staged and working snapshots are retained as local Git commits f9879d0 and 396b089 on codex/pre-recovery-20261114.

## Final recovery checklist

| Milestone | Status | Evidence |
| --- | --- | --- |
| Interrupted changes | Complete | Local branch `codex/pre-recovery-20261114` contains the inherited index and full working tree in separate commits. Source work and verification records are preserved on `codex/recovery-20261114`. The pre-existing main index is retained. |
| Local availability | Tested | Compose binds PostgreSQL to a configurable loopback port, preserves the named volume and restarts it with Docker. The original native database keeps its own port. The local app uses 5433. Readiness exercises the required portfolio, artwork and billing columns. A test with an incompatible schema returns 503. |
| Browser and API | Tested | Next proxies /api to the private Fastify listener. Session cookies, origin checks, authorized writes, stale-version rejection, two-tenant isolation, uploads, draft saves, publish and unpublish passed. The client surfaces invalid success bodies. Server logs retain diagnostic codes without dumping queries or secrets. The runtime pool is bounded at ten connections with a five-second acquisition timeout. |
| Local image storage | Tested, one temporary work awaits replacement | The former temporary local storage directory disappeared after a reboot. Reconstructed 20 test images (40 WebP files). Each source matched recorded size and dimensions, and the optimized files matched the stored byte total. One unpublished artist image is missing, originally 1414 × 2000 and 1,580,804 bytes. Metadata and the draft remain. The owner confirmed the images are temporary and will replace them through the library. A missing object now gives a recoverable, uncached 503. |
| File mail and local billing history | Partially recovered | PostgreSQL preserved account and subscription rows. The old file-mail messages and mock payment-provider file disappeared with the temporary directory. Two historical simulated subscriptions were canceling. New verification mail can be requested. Fresh mock checkouts passed. |
| Phase 2 and design | Tested locally | Full details, differences and release gates are in the linked audits. Phase 3 specialist modules remain deferred. |
| Production | Externally blocked | Asaas sandbox, transactional mail, private cloud storage, public-domain TLS, monitoring and production restore rehearsal require a staging deployment. |

The current project's local object directory is persistent under the ignored `.local/data` directory. The original temporary patch archive is gone. Git retains the two source checkpoints independently. Private PostgreSQL dumps of the development and browser databases and an archive of the recovered development objects are in `.local/recovery-review/backups` on this machine. These files contain account data and remain outside Git. The browser database also contains a second unpublished draft outside the synthetic test accounts, with the same recorded input dimensions and byte counts. Both databases were retained separately. Start ordinary development with the repository's own environment. Use a separate application origin, API port, storage directory and database for subsequent browser reviews so the artist always reaches the development database.

## Verification commands

| Command | Result |
| --- | --- |
| `pnpm migrate`, `pnpm db:test:migrate` | Eight migrations including 0008 applied on development and test databases. Rerunning the migration runner was clean. |
| `pnpm test:sql` | PostgreSQL constraint checks passed within a rolled-back transaction. |
| `pnpm test:unit`, `pnpm test` | Passed. The full run executed 33 tests, with zero skipped. |
| `pnpm lint`, `pnpm typecheck`, `pnpm build` | Passed, including the production Next.js build. |
| `pnpm exec playwright install chromium`, `pnpm e2e` | Chromium was available. All five browser journeys passed against the isolated application database. |

The operator, loading/error and visual checks used the isolated browser database. The local environment uses file mail, file storage and simulated billing. Staging gates and the per-screen differences are recorded in [the Phase 2 audit](PHASE2-AUDIT.md) and [the design audit](DESIGN-COMPLETENESS-AUDIT.md).

Final smoke checks used the development database through port 3000. Readiness, the billing catalog, studio shell, a previously published test portfolio and its recovered WebP thumbnail returned 200. The anonymous session endpoint returned 401. The browser review's temporary operator grant was revoked.
