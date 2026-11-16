# Feature status · 15 November 2026

"Working" means implemented end to end and exercised by automated tests against local PostgreSQL, local file storage, file mail and the mock billing provider. Nothing here has run against production providers. Test files are in `tests/` (API/unit) and `tests/browser/` (Playwright).

| Status | Meaning |
| --- | --- |
| Working | UI, API and database wired; automated tests pass locally |
| Working, externally unverified | Same, but the real provider/infrastructure path has never been exercised |
| Disabled by flag | Implemented; an operator setting must enable it in production |
| Partial | Usable, with a documented gap |
| Missing | Not implemented |

## Phase 1 — portfolio builder

| Feature | Status | Notes | Tests |
| --- | --- | --- | --- |
| Registration, login, logout, sessions | Working | scrypt hashes, opaque SHA-256-stored sessions, `__Host-` cookie in production | `api.test.ts`, `security.test.ts`, `artist.spec.ts` |
| Email verification and password reset | Working, externally unverified | Local file mail only; Resend driver never sent a real message | `api.test.ts`, `artist.spec.ts` |
| Portfolio creation and onboarding | Working | One site per account (`MAX_SITES=1`) | `artist.spec.ts` |
| Four templates (Gallery, Creative, Showcase, Story) | Working | Same renderer for editor, preview, public and demos | `render.test.ts`, `visual.spec.ts` |
| Block editor (add, reorder, properties, autosave, undo/redo, conflict detection) | Working | | `creative.spec.ts`, `api.test.ts` |
| Pages and navigation order | Working | | `artist.spec.ts`, `studio-sections.spec.ts` |
| Galleries and memberships | Working | | `api.test.ts`, `platform.test.ts` |
| Artwork uploads (JPEG/PNG/WebP), replacement, featured work | Working, externally unverified | Local storage tested; S3/R2 presigned PUT and CORS never tested | `api.test.ts`, `model.test.ts`, `artist.spec.ts` |
| Draft, preview, publish, unpublish | Working | Immutable snapshot, image pins, withdrawal | `api.test.ts`, `artist.spec.ts` |
| Public subdomains (`handle.PLATFORM_DOMAIN`) | Working, externally unverified | Host routing tested; wildcard DNS/TLS needs the production edge | `artist.spec.ts` (host routing) |

## Phase 2 — commercial

| Feature | Status | Notes | Tests |
| --- | --- | --- | --- |
| Plans and entitlements (Free, Artist, Studio) | Working | Enforced on the server; downgrades keep content | `plans.test.ts`, `billing.test.ts` |
| Subscription checkout, renewal, grace, cancellation, plan changes | Working (mock), externally unverified (Asaas) | Asaas sandbox never exercised; webhook token check unit-tested | `billing.test.ts`, `asaas.test.ts`, `billing.spec.ts` |
| Commissions (status, prices, examples, terms, contacts) | Working | Contact clicks counted through a non-open redirect (route verified manually in the Phase 2 audit, no automated test) | `platform.test.ts`, `render.test.ts` |
| Custom domains (artist-owned) | Working, externally unverified | TXT proof, CNAME/A check, TLS probe, `tls-ask` gate; needs an on-demand-TLS edge (e.g. Caddy) | `platform.test.ts`, `domain.test.ts` |
| Analytics (cookie-free aggregates, advanced reports) | Working | | `platform.test.ts`, `domain.test.ts` |
| Advanced customization (palettes, type, corners, grids, backgrounds) | Working | Individual options are not covered by automated tests; templates with default themes are | `render.test.ts`, `visual.spec.ts` |
| Administration console and audit log | Working | Grant with `pnpm admin grant email` | `platform.test.ts` |
| Legal pages, consents, data export, support, takedown form | Partial | Texts are drafts marked for legal review; `LEGAL_ENTITY_NAME`/`SUPPORT_EMAIL` placeholders | `platform.test.ts` |

## Phase 3 — creative tools

| Feature | Status | Notes | Tests |
| --- | --- | --- | --- |
| Studio sections Comics, Characters, Projects, Shop | Working (**activated in this pass**) | Previously listed as "Coming soon" in the sidebar; now real sections filtering Pages by kind | `studio-sections.spec.ts` |
| Comics/webtoons: series, chapters, ordered panels, mobile reader (scroll, page, manga) | Working; **disabled by flag in production** | `CREATIVE_TOOLS` defaults off when `NODE_ENV=production`; existing content stays editable | `creative.spec.ts`, `platform.test.ts`, `domain.test.ts` |
| Original character profiles and creative projects | Working; disabled by flag in production | Custom fields, related pages, illustration sequences | `platform.test.ts` |
| Advanced editor: columns, layers, saved sections, page history/restore | Working; new authoring disabled by flag in production | | `creative.spec.ts`, `platform.test.ts` |
| Artist integrations: YouTube privacy-enhanced embed, profile links | Working | No OAuth, no import/sync | `render.test.ts` |
| Digital products: listings with artist-hosted checkout | Working; disabled by flag in production | Payment happens on the artist's store; no purchase records | `platform.test.ts` |
| Digital products: private wallpaper delivery with 5-minute grants | Working, externally unverified | Paid plans; grants issued manually by the artist | `platform.test.ts` |
| Integrated marketplace payments | Missing (by design) | No seller onboarding, settlement or refunds; needs provider and legal work | — |
| Public artist directory and artwork discovery | Working | Opt-in; excludes unpublished, opted-out and restricted accounts; 24 per page | `platform.test.ts`, `marketing.spec.ts` |
| Additional blocks (comparison, carousel, process, timeline, cards) | Working | Columns, character cards and video are tested; comparison, carousel, process and timeline rendering is not individually tested | `render.test.ts`, `platform.test.ts` |

## Not implemented

| Feature | Notes |
| --- | --- |
| Multi-factor authentication | Present in the Base44 prototype (`mfa` route) only |
| Google sign-in, "keep me signed in" toggle on the form | Omitted from the restoration; the API supports `remember` |
| Multiple portfolios per account | Data model allows it; studio assumes one site |
| Scheduled publication, reader accounts, automatic external purchase verification | Listed as future work in `PHASE3.md` |
| Email notifications beyond verification/reset (receipts, renewal reminders, report outcomes) | Asaas sends its own payment emails |

## Known product gaps

- **Color contrast**: an axe-core WCAG 2.1 AA scan flagged low-contrast secondary text on every audited page (the design's `text-ink/35`–`/45` tones). Changing it alters the approved visual design; see `PRODUCTION-DEPLOYMENT-TODO.md` H-3.
- At viewport heights below ~900px the studio sidebar scrolls to reach Plan & billing and Settings (Settings is also in the footer and Plan & billing opens from the plan badge).
- Public SSR reads and image requests are not cached at an edge; see the performance section of the deployment TODO.
