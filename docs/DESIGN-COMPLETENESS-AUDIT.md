# Base44 design completeness audit

This audit maps the route files in `Design/src/routes` to the production entry points in `apps/web`. The reference is the exported JSX, including its conditional branches and imported components. The route review includes Chromium full-page comparisons at 1440 × 900 and 390 × 844. The archives and scope of the presentation harness are documented below.

**A** identifies a presentational omission or restoration. **B** identifies a Phase 1 or 2 interaction backed by application data. **C** identifies a later feature whose design remains in the export. **D** identifies a prototype behavior adapted to the production contract. Multiple letters can apply to one route.

## Marketing

| Reference route | Reference sections in order | Production mapping and differences |
| --- | --- | --- |
| `/` | Sticky header, collage hero, discipline marquee, featured artists, four template previews, how it works, editor demo, gallery demo, commission demo, comics demo, testimonial cards, pricing cards, final CTA, footer | **A/B** All twelve sections remain in this order. The monthly/yearly cards now lead into a detailed comparison and then the pricing FAQ link. The header, template cards, showcases, editor CTA and footer link to actual destinations. Desktop overlapping prints, mobile hero cards, marquee, tape, stickers, grain, gradients, hover lifts and reduced-motion styles remain. **C/D** Comics and character management are marked planned. Artist counts, illustrations and quotations belong to labeled fictional demos. |
| `/templates` | Intro, four template selectors, browser-framed image, mood, description, disciplines, palette, example artist, use/demo buttons, four preview tiles, footer | **A/B** Restored at the same path. A selection changes the composition and details. Registration forwards the selected template into site creation. All four demos use the shared portfolio renderer. |
| `/features` | Intro, three alternating text and illustration rows, feature grid, editor invitation, final CTA, footer | **A/B** Restored the block palette, gallery mock and theme swatches. The editor invitation preserves the editor destination through sign-in. **C/D** Static illustrations remain illustrations, and copy identifies supported features and future comic/character tools. |
| `/explore` | Intro, search and count, category filters, masonry works with hover details, empty/reset state, featured artist cards, final CTA, footer | **A/B** Restored the demo exhibition, including the 3D tile, search, keyboard-focus overlays, categories and reset. An additional published exhibition uses opt-in, current public snapshots with search and pagination. Categories apply to the labeled demo collection. **D** Two reference artists have no demo site and point to the template collection, as in the export. |
| `/pricing` | Intro, monthly/yearly cards, four promises, comparison, FAQ with currency caption, footer | **A/B** Same order. The reusable comparison also appears below the homepage cards and in studio billing. FAQ is a single-open keyboard-operable disclosure group. Currency, prices and yearly savings follow the catalog. Guidance on cancellation, Pix and ownership replaces unsupported promises. **D** No unimplemented shop, comic management or character entitlement is sold. |

### Pricing source and placement

The export puts `CompareTable.jsx` in `routes/pricing.jsx`. Its homepage `PlansSection.jsx` links there beneath the cards. Production also embeds the table on the homepage as requested. Both public pages obtain the same `/billing/plans` response as studio billing, including deployment overrides. An unavailable catalog gets an explicit status message.

The table has a rounded ivory frame, thin row rules, small display headings, coral checks, a tinted Artist column and a recommended label. Its 620 px minimum width scrolls inside a focusable region. Column and row headers, caption and text equivalents for both inclusion states are present.

| Default entitlement | Free | Artist | Studio |
| --- | ---: | ---: | ---: |
| Sites | 1 | 1 | 1 |
| Additional pages beyond home | 5 | 15 | 30 |
| Artworks | 50 | 350 | 1,500 |
| Storage | 200 MiB | 2 GiB | 10 GiB |
| Maximum upload | 12 MiB | 12 MiB | 12 MiB |
| Templates and platform address | All four, included | All four, included | All four, included |
| Custom domain, commission sections | No | Yes | Yes |
| Appearance | Basic | Expanded | Advanced |
| Analytics | Basic | Basic | Advanced |

The previous draft and gallery schemas capped artwork at 1,000. They now accept the Studio artwork limit from the catalog. The regression test publishes a snapshot with one gallery containing all 1,500 works. The normal site and upload handlers continue to enforce each account's own limits.

## Accounts, onboarding and workspace

Studio destinations use `/studio?tab=…`. The gallery detail screen is a selection inside Galleries. Public demo paths, tenant paths and private preview paths are separate.

| Reference route | Reference composition and controls | Production mapping and differences |
| --- | --- | --- |
| `/login` | Split artwork shell, credentials, remember option, recovery and registration | **A/B** `/auth/login` uses the real session API. Remember controls persistence. The studio destination survives sign-in. **D** No demonstration identity or unconditional dashboard transition. |
| `/register` | Illustrated shell, name/email/password, password feedback, consent and sign-in | **B/D** `/auth/register` creates the actual account, records consent, preserves selected template/plan/cycle, and issues verification mail. Links open production terms and privacy pages. |
| `/forgot-password` | Email field, sent state, return to sign-in | **B** `/auth/forgot` uses the mail adapter and generic recovery confirmation. |
| `/reset-password` | New password, confirmation, completion state | **B** `/auth/reset` validates matching passwords and consumes the fragment token. |
| `/mfa` | Six digits, resend/recovery affordances, continue to dashboard | **D** The route accepts any six digits in the prototype. Production exposes email verification and password recovery. Authenticator enrollment, recovery codes and provider sign-in require a separate identity implementation. |
| `/onboarding` | Name, handle/suggestions, four templates, gallery categories, first upload, appearance, completion and live preview | **A/B** Studio setup retains all tasks. Name and address share the first form so the API creates them atomically. Template selection, gallery creation, actual upload, accent/type and publication persist to the draft. Setup can resume from Overview or the footer. **D** Availability is validated by the server on creation. |
| `/dashboard` (layout) | Artist identity, workspace/insights navigation, specialist tools, status, publish, collapsible sidebar and mobile drawer | **A/B** `DashLayout` uses account identity, real usage and plan, language switch and publication status. History-aware studio tabs support back/forward. **C** Specialist module labels are marked planned. |
| `/dashboard/` | Greeting, portfolio cover and actions, idea, stats, visitor chart, quick actions, checklist, activity | **A/B** Overview uses the draft cover, private/public preview, actual counts, 30-day views, contextual suggestions, checklist and account event feed. Adds quota warnings, plan/domain status and a live draft preview. **D** The chart counts views and the activity list shows recorded account events. |
| `/dashboard/library` | Search/filter, thumbnail wall, selected inspector, metadata, upload/empty states | **A/B** Library supports upload/drop, search, real gallery/featured filters, previous/next selection, replacement, gallery membership and deletion. Optional year, medium, dimensions, edition and availability feed Gallery detail pages. **D** Categories derive from the artist's own collections. |
| `/dashboard/galleries/` | Cover cards, counts, visible/hidden badges, sorting and new gallery | **B** Galleries supports real covers, ordered collections, creation and empty states. |
| `/dashboard/galleries/$galleryId` | Back, collection details, list of member works, selection, cover, ordering | **B** Gallery detail edits title/slug, description, visibility, membership, cover and sequence with drag and button controls. Uses real draft artwork and preview/public destinations. |
| `/dashboard/pages` | Page rows, visibility, editor action, menu, ordering, add, three navigation tips | **B** Pages edits names/slugs, navigation visibility, home page and order, with per-plan capacity feedback. A page omitted from navigation remains accessible by its published address, as the UI explains. |
| `/dashboard/theme` | Template/appearance controls, palette, typography, shape/space, sample composition | **A/B** Theme and the editor share appearance controls. Palette/type, shapes, spacing, texture, footer, grids and section backgrounds use the draft and publication entitlements. Preview uses the real renderer. |
| `/editor` | Address/page selector, save indicator, undo/redo, device buttons, preview, publish; pages, blocks, galleries, media, theme and layers; canvas selection; Simple/Advanced inspector; publish review/success | **A/B** The six rails are present. Art/gallery selectors, reorder, visibility, spacer, appearance, block settings and publish review act on the draft. Device frames render the same portfolio. Small screens have panel sheets, undo, redo, page-specific preview and publish. **D** Publication requires verification and a successful API response. |
| `/dashboard/commissions` | Status switch, note, turnaround/currency, illustrated type cards with edit and add, terms, preview | **A/B** Commissions restores image cards, price/range, availability, edit disclosures, add tile and private preview of the actual page. Artists can supply examples, visibility/order, terms, allow/deny lists and contact destinations. **C/D** The prototype's fictional slot counts and request queue have no records in Phase 2. Open/waitlist/closed describe the artist's chosen availability. |
| `/dashboard/analytics` | Date ranges, KPIs, traffic chart/tooltips, artwork opens, galleries and traffic sources | **A/B** Analytics shows real daily aggregates, chart inspection by pointer/keyboard, page/gallery/artwork rankings and plan-gated referral, region, contact-click and comparison data. **D** Unique visitors and bounce rate cannot be inferred from these cookie-free counters. Empty periods have an empty state. |
| `/dashboard/domains` | Platform address, copy, connect input, DNS instructions/status, domain redirects | **A/B** Domains provides the real free address, copy controls, ownership/routing records, verification/TLS status, primary selection and removal. **D** Primary-address information describes canonical behavior. The prototype's sample permanent redirect does not represent a configured redirect. |
| `/dashboard/subscription` | Highlighted current plan, benefits, usage meters, annual switch, invoices | **A/B** Billing shows the current plan and included benefits on the dark card, comparison shortcut, usage, monthly/yearly choices, checkout review, pending invoices, cancellation, history and the full comparison. **D** Hosted invoices handle payment. Gallery count has no catalog quota or monthly reset. The cycle choice leads to a reviewed billing operation. |
| `/dashboard/settings` | Profile, account, language/region, privacy, notification, security and account management panels | **A/B** Settings includes profile/avatar/bio, account and password, language, public exhibition opt-in, indexing, support, export, unpublish and deletion. **C** Followers, commission notifications and watermarks have no Phase 2 delivery pipeline. **D** Right-click blocking, fictional login locations, social login, timezone and product-news switches have no matching application setting. |
| `/dashboard/comics` | Series cover, chapter list, add/open controls | **C** Series authoring and chapter release management are deferred. Story already presents ordered gallery artwork in reading modes. |
| `/dashboard/characters` | Character cards, profile links and creation | **C** Dedicated character records, relationships and character sheets are deferred. |
| `/dashboard/projects` | Preview notice, case-study cards, draft state and project manager | **C** Dedicated brief, role, credits, process and project lifecycle are deferred. Showcase supports collections of real works. |
| `/dashboard/shop` | Shop preview, product cards and empty/add states | **C** Storefront management, checkout and digital fulfillment are deferred. |

## Portfolio routes

Production uses `Portfolio` for demonstrations, editor canvas, private preview and publications. Paths below are relative to the corresponding `/demo/{template}`, `/preview` or published site. Public compositions depend on visible blocks and published assets. Production doesn't insert fictional portfolio content into new accounts.

| Reference route | Reference sections and controls | Production mapping and differences |
| --- | --- | --- |
| `/portfolio/gallery/` | Editorial wordmark/nav, split artist statement and image, wide photograph, selected work wall, studio note, about and footer | **A/B** Gallery home composes the corresponding blocks, work captions and detail links. Demo uses Nina's referenced images. Uploaded images retain their actual proportions and alternate text. |
| `/portfolio/gallery/works/$workId` | Back/count, large print, title/note, year, medium, dimensions, edition, availability, next work | **A/B** `/works/{id}` renders the five optional artist-entered fields, collection links and navigation. Reference demo print specifications are present. Older snapshots without those fields still render. |
| `/portfolio/creative/` | Rounded navigation, sticker collage, hero buttons, moving discipline strip, favourites, gallery cards, commission band, illustrated bio and footer | **A/B** Creative home, hero and commission button resolve the artist's real commission page relative to the current portfolio. The editor also accepts an external destination. **C** Shop and character destinations remain future modules. |
| `/portfolio/creative/commissions` | Status/turnaround, illustrated prices, request affordances, process, terms, allowed work and contact | **A/B** The Creative demo includes a navigable commission page built from shared blocks. The studio can place these blocks on an artist's chosen page. Type cards use the artist's contact when open or waitlisted. Closed types show pricing without the request button. Demo contact is an explicitly illustrative address. **C** In-platform order intake, commission payments and slot accounting are deferred. |
| `/portfolio/creative/shop` | Catalog, product selection and download/purchase panel | **C** Preserved in the reference for the shop phase. No fictitious inventory or paid downloads in production. |
| `/portfolio/creative/characters/$charId` | Character profile, sheet, lore and related work | **C** Preserved in the reference for character authoring. Individual works and gallery memberships are supported now. |
| `/portfolio/showcase/` | Dark masthead, cinematic hero, project rows, about/credits, footer | **A/B** Showcase uses real featured works and galleries for project rows. The template retains its wide crops, amber accent and condensed display typography. |
| `/portfolio/showcase/projects/$projectId` | Full-bleed project cover, title/brief, facts, images, next project | **A/B** `/galleries/{slug}` and `/works/{id}` present cover, description, known facts, related artwork and next links. **C** Structured project credits, deliverables and production timelines need project records. |
| `/portfolio/story/` | Parchment masthead, book cover/intro, chapter index, illustrated interlude, characters, author and footer | **A/B** Story uses ordered galleries, illustrated panels, author block and navigation. **C** Dedicated character cards and profile destinations depend on the character module. |
| `/portfolio/story/chapters/$chapterId` | Sticky chapter header, scroll/single-page switch, page count, previous/next page and chapter navigation | **A/B** `/galleries/{slug}` supports both modes and shareable single pages via `?page=N`. Navigation stays within the chosen gallery even when one artwork belongs to multiple galleries. It stops at the first/last page. **C** Release scheduling and chapter management are deferred. |
| `/portfolio/story/characters/$charId` | Story-styled character profile and return navigation | **C** Retain `CharacterProfile.jsx` as the reference. No fabricated character destinations in artist portfolios. |

## Shells, utilities and production-only routes

| Surface | Disposition |
| --- | --- |
| `__root.jsx`, not-found and error boundaries | **D** Next layout, metadata, error and 404 pages own the production shell. Base44 instrumentation and authentication context are export infrastructure. |
| `/api/time` | **D** Demo server clock endpoint. No user-facing route depends on it. |
| `/admin` | Production-only operator overview, user restrictions, billing, domains, abuse reports, support and audit tabs. Requires server-side operator authorization. |
| `/billing/mock/[id]` | Production application's development-only simulated payment UI with approval/failure and return to billing. |
| `/auth/verify`, `/legal/[doc]`, `/report`, contact redirect, robots and sitemap | Production-only verified email, policies, takedown/reporting, counted external contact links, indexing preferences and discovery metadata. |

## Full-page review · 14 November 2026

The review covers 30 corresponding screens at two viewport sizes. The [desktop archive](recovery-review/desktop.zip) and [mobile archive](recovery-review/mobile.zip) each contain 30 pairs of full-page JPEGs plus initial onboarding and pending DNS states. Each filename identifies the exported route and either the reference or the application. The DNS proof value is masked. The capture checked document width, decoded images and browser errors, and scrolled below the fold before saving. All 120 paired renders returned HTTP 200, fit the viewport and had zero missing images or page exceptions.

The reference ran a local copy of the exported JSX with its Tailwind configuration, component hierarchy, bundled artwork equivalents and local fonts. A minimal router and native image adapter displayed the presentation. The application ran its normal Next.js and Fastify routes with PostgreSQL. The signed-in fixture had five uploads, a published Creative portfolio and a simulated Studio subscription. The reference contains a larger fictional collection. The pairings document visual and behavioral differences at the stated widths. Hosted Base44 rendering was outside this review.

| Screens | Observed differences |
| --- | --- |
| Home, pricing | The full plan comparison extends the homepage. Pricing retains its own table and disclosure group. On mobile the table scrolls inside its frame. Catalog limits and payment terms determine row text and card height. |
| Templates, features, explore | The template frame and feature mockups use the reference artwork. Explore adds an opt-in published collection and a demo label. Actual artwork proportions determine masonry height. |
| Sign-in, registration, recovery, reset | Split desktop artwork and compact mobile forms retained the reference composition. Consent, password feedback and token status change form height. Provider sign-in and prototype MFA are outside the configured identity methods. |
| Setup, overview | The first setup screen combines artist title and handle. The paired application capture resumes a completed setup. A separate capture shows a newly registered account. The dashboard adds quota information and a working draft preview. |
| Library, galleries, gallery detail, pages | The smaller library yields shorter grids and different counts. The selected-art inspector, collection cover, work ordering, page visibility and edit actions were present. Mobile stacks the inspector and management forms. |
| Theme, settings, editor | Theme is longer because it exposes plan-based controls and a working preview. Settings uses saved profile and privacy data. The mobile editor opens a phone-width canvas and uses panel sheets. The desktop device selector renders the artist's actual layout. |
| Analytics | Four measurable KPIs, traffic chart, grouped referrals, artwork thumbnails, gallery bars and advanced tables rendered. The sparse curve reflects the fixture's four visits. The KPIs wrap into two columns on mobile. |
| Commission management and public Creative commissions | Both show illustrated type cards, prices and availability. The manager adds associations and editing fields. The public demo uses its authored steps, terms and contact link. Copy length and supplied examples change card height. |
| Domains | Separate platform and already-owned address cards replace the sample redirect. Adding a hostname reveals ownership, DNS and HTTPS status and exact setup records. The additional screenshot shows the pending connection. |
| Subscription | The active plan card, storage meters, paid-period dates, checkout options, invoice history and the detailed plan table extend the screen beyond the compact reference panel. |
| Public portfolios and detail routes | Demo pages add a registration strip. Artwork, editorial type and template navigation survive on mobile. Gallery details depend on artwork metadata. Showcase uses collections for project presentations. Story renders the published gallery's ordered works. Character sheets, specialist project fields and shop authoring remain Phase 3. |

### Interaction and error checks

The five Playwright journeys cover mobile setup through publication, signed-out artwork delivery, two tenant hostnames, simulated billing and marketing at both widths. Additional checks exercised chart keyboard inspection, commission association saves, domain addition and removal, privacy settings, editor selection and advanced settings, publish review, Story reader modes and Portuguese pricing. All seven operator tabs and user search worked at both widths. Delayed and failed analytics/domain requests displayed loading and error states, then returned to real data after reload.

See the [recovery record](RECOVERY-STATUS.md) for the verification commands and the [Phase 2 audit](PHASE2-AUDIT.md) for staging requirements.
