# Architecture

One Next.js application serves marketing, the authenticated studio, private preview and public portfolios. A single Fastify API owns mutations. PostgreSQL stores structured content, object metadata, authorization state and publications. The asset adapter stores image bytes. No Base44 SDKs, media URLs, infrastructure or routing are used at runtime.

| Module | Responsibility |
| --- | --- |
| apps/web/proxy.ts | Validate the actual Host against the configured platform domain, strip the incoming tenant marker and rewrite a single allowed artist subdomain. Keep private routes on the application host. |
| apps/web/app/site and components/Portfolio.tsx | SSR pages, gallery detail, canonical and social metadata. The same portfolio component powers the editor, private previews and demo templates. The public route imports no studio client component. |
| apps/web/components and lib/use-draft.ts | Onboarding, studio management and editor. The save loop serializes writes, coalesces edits and reports conflicts. |
| packages/shared | Version-one content contract, allowlisted block styles, safe links, templates, quotas, host parsing and publication filtering. |
| apps/api/src/auth.ts | Account lifecycle, password recovery, email confirmation, session revocation and profile. |
| apps/api/src/sites.ts and drafts.ts | Ownership, normalized content, atomic save and publish, reporting. |
| apps/api/src/uploads.ts, images.ts, storage.ts, cleanup.ts | Reserve capacity, accept bounded bytes, verify stored content, generate versions, authorize delivery and collect objects. |
| packages/db | Drizzle table mappings, parameterized queries, versioned SQL and a transaction-locked checksum migration runner. |

## Data lifecycle

A user can own several site rows. A user-row lock serializes site creation against the configured account limit. A site-row lock serializes draft saves, upload reservations, finalization and publication. The editor sends a complete validated draft with the expected revision number. The API verifies media identities, writes relational page/art/gallery/membership rows in a transaction and advances the version. Composite keys prevent inter-site object associations. Durable page and gallery IDs allow changing slugs without breaking internal block references. Old public paths return 404 after republishing.

Publishing filters hidden blocks, hidden galleries and unreferenced artwork metadata, inserts a versioned snapshot, pins its image assets, then swaps the public pointer. The public read uses a single joined query. Draft edits and asset replacement preserve the previous snapshot and its images until the next publication. Phase 1 retains only the active publication. Unpublishing releases its pins. Public HTML fetches the active snapshot on every request. Images have stable per-version keys and conditional ETag delivery after checking current public or owner access. This favors immediate withdrawal over a long shared cache lifetime.

## Upload and deletion

An authenticated client reserves an upload under a random site-scoped ID, PUTs the file and requests finalization. S3-compatible storage issues a five-minute signed PUT for the staging key, byte length and content type. The browser supplies Content-Length for the File body. The local adapter accepts a bounded API PUT. Finalization independently reads at most the reservation size plus one byte from object storage. Reservations count toward quotas. Sharp decodes a single-frame JPEG, PNG or WebP within the configured byte limit and 32-megapixel ceiling. It auto-orients and re-encodes a full-resolution WebP master and an 800px preview. Neither output inherits camera metadata. The database records original dimensions and byte count plus master dimensions and combined output size. Finalization checks actual storage usage while holding the site lock.

Database triggers enqueue removal of staging files and unused masters/previews. Finalization records cleanup intent before writing external derivatives, so a crash can be recovered. Maintenance retries failed object removal, expires reservations and clears expired sessions and email tokens. Deleting an account rechecks the password, removes owned records and enqueues object deletion. Audit events and abuse reports can outlive the account with a null foreign key. A storage operator must define backup retention, staff access and report handling before launch. Artwork processing is limited to display and optimization.

## Security boundaries

Sessions are random opaque tokens, stored as SHA-256 digests with a 14-day expiration. Production cookies are host-only, HttpOnly, Secure and SameSite=Lax with a __Host- prefix. Passwords use asynchronous, salted scrypt with N=131072, r=8 and p=1. Verification and reset tokens expire after 30 minutes and are consumed transactionally. Password reset revokes existing sessions. Email links put tokens in the URL fragment, and the user explicitly submits them. No token goes in an API query string.

Mutations require the configured application Origin and a custom request header. Browser clients use the same-origin API proxy. Fastify does not trust forwarded headers. Application errors emit stable codes. Structured failure logs exclude bodies, cookies, email tokens and SQL values. Public rendering uses React-escaped text and a small emphasis grammar. Block fields cannot inject markup, scripts or style declarations. A fresh nonce protects Next scripts. The public abuse form records reports with a rate limit.

## Creative content

Specialist content extends ordinary pages. The editor, private preview and public templates all use Portfolio and the same block schema. Normalized chapter panels, artwork memberships and page relations refer to tenant-scoped IDs. Flexible profile fields live on creative_pages. Digital product files use a private namespace, separate authorization and expiring grants. The active publication continues to own its image pins. Page history and reusable sections store private editorial state. The public artist directory uses an independent opt-in and the current published portfolio name. [Phase 3 data and access details](PHASE3.md)
