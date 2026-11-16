# Phase 3 implementation checklist

- Extend typed portfolio pages, ordered chapter artwork and tenant-scoped relationships. Keep old drafts and publication URLs readable.
- Add comic authoring and a mobile chapter reader, followed by character and project profiles in Pages.
- Extend the shared section renderer and editor with responsive containers, saved sections and restorable revisions.
- Add artist blocks, profile integrations and digital listings with seller-hosted checkout. Evaluate marketplace prerequisites separately.
- Extend opt-in discovery, reporting and withdrawal. Check indexes, bounded queries, entitlement and asset lifetimes.
- Verify migration, publication, media authorization, editor interactions and regression suites. Record production dependencies.

The baseline used a fresh PostgreSQL 16 cluster. One billing date assertion failed (32 of 33 passed). The previous checkpoint also records outstanding Asaas, R2, mail, domain/TLS and legal review work.

## Artist workflow

In **Studio → Pages**, choose a page type and optionally a starter section set. The six starters cover comics, character design, illustration, photography, 3D and general portfolios. Each works with the four existing visual templates. Click the page-type badge to reopen its content fields. Use **Edit** to arrange the page's blocks.

Series, characters, creative projects and digital products have durable page IDs and editable slugs. A new specialist page and each new chapter start as drafts. Select **Include in next publication** on the page, include the desired chapters and publish the site. The separate navigation toggle controls menu placement. The home page must be publishable. Removing a published page from the draft takes effect publicly on the next publication.

Use a character's custom fields for biography, personality, credits, reference information or lore. Projects use the same fields for milestones and collaborators. Linked pages can include other characters, projects and comics. Cover images and ordered illustrations refer to existing artwork. Gallery and process blocks reuse existing gallery memberships. Cards put featured pages first.

Each chapter has an ordered selection from the library, optional cover and optional date. The date is display metadata. Readers select scrolling, single-page or manga navigation, and can use arrow keys when the reader has focus. The browser remembers the last artwork ID in each chapter. Reading works anonymously. A chapter link uses the series slug and stable chapter ID. Changing the series slug changes its chapter URLs after publication.

In the visual editor, add **Columns**, then add sections within it or move them in **Layers**. The Advanced panel can change the parent, tablet/desktop column count, typeface, gradient, pattern, image frame, mask or fade. Phone layouts stack. Select **Pages → History & saved sections** to save or insert a section or restore one of the last twelve saved versions of a page. Restoring creates a draft change that can be undone. The active publication only changes when the artist publishes. Deleted library items are omitted when restoring. Deleting the page clears its history. An artist may keep up to 24 named sections per site.

## Data, access and cost

Migration 0009 adds a tenant-scoped extension to pages, ordered artwork membership, page relationships, chapters and their ordered panels, digital listings, page history and saved sections. Existing version-one drafts and public snapshots parse with optional fields. Flexible attributes and block configurations use JSONB. Shared entities use composite foreign keys. Migration 0010 adds directory fields, a partial PostgreSQL search index, private product metadata, grant expiry and a deletion trigger. It backfills the published display name from the active snapshot. Existing sites start outside the new directory, including sites already opted into artwork discovery.

The API holds the site lock and checks the draft version for saves, history changes and publication. Existing page quotas also bound characters, series, projects and listings. Chapter capacity is the effective additional-page quota multiplied by CHAPTERS_PER_PLAN_PAGE (default 2). Over-limit sites can retain or reduce existing content. CREATIVE_TOOLS defaults on locally and off in production. It controls adding specialist pages and block types, saving reusable sections and uploading private files. Turning it off preserves existing publications. Preferences, directory opt-out and owner deletion remain available.

Publishing pins artwork from included chapters and pages. Private history and saved sections reference library IDs and carry no public media permissions. Public SSR requests chapter indexes or a selected chapter. Other chapters contribute only their cover to that response. The browser mounts at most eight images in vertical mode and shows one in page mode, prefetching an adjacent image when data saver permits. The API still reads the active site snapshot from PostgreSQL. Benchmark that step before raising large-catalog limits.

Directory search uses published portfolio names, explicit categories and public tags, with full-text ranking and pages of 24. Unpublication, opt-out, deletion and account restriction are checked on each request. Reports use the existing human review console. Report disposition, restrictions and their audit records commit atomically. The copyright page gives the appeal contact path. Uploaded art is never used to train models.

## Digital products and integrations

Each listing links directly to the artist's HTTPS storefront. Price and currency are supplied by the artist and formatted in the portfolio language. The destination handles the final amount, payment, refunds and ordinarily file delivery. Subscription credentials are used only for SaaS billing. Following a checkout link never creates a purchase record or download grant. One supported example of an external seller page is itch.io. [Seller payment documentation](https://itch.io/docs/creators/payments)

Artist and Studio plans can also deliver a private wallpaper. Upload a static PNG, JPEG or WebP in the product's private file panel. The API bounds size and decoded pixels, strips metadata and saves a full-size optimized WebP in a separate private object namespace. Uploaded product bytes count toward the storage allowance. Other file formats can be sold and delivered by the seller's external store. Artists can inspect and remove an existing private file after a downgrade.

After independently checking the order in their store, the artist can issue a five-minute bearer link for a published, available product. A new link invalidates the prior link. The database stores only its digest. Every download checks expiry, listing availability, the active publication and account restriction. Replacing or deleting the file invalidates the grant. Responses are attachments with private, no-store caching. Configure ingress access logs to redact /api/downloads/ tokens. Only share buyer links with the intended recipient.

YouTube watch, short and shared video URLs use a validated video ID. The privacy-enhanced iframe loads only when a visitor activates it, and the original watch link remains available. Other artist platforms support outbound profile links. No OAuth scopes, credentials or Data API quota are needed for these operations. No scraping, image importing or synchronization runs. Removing a block or URL and publishing withdraws it. Provider playback restrictions still apply. [Embedded player documentation](https://developers.google.com/youtube/player_parameters) · [Privacy-enhanced mode](https://support.google.com/youtube/answer/171780?hl=en) · [Developer policies](https://developers.google.com/youtube/terms/developer-policies)

A marketplace would require supported seller onboarding, an assessed merchant-of-record model, settlement, disputes, refund handling and reconciliation. No marketplace provider or connected-seller configuration has been verified for this deployment. There is no marketplace payment path. Validate a provider sandbox and obtain legal review before undertaking that module. [Stripe Connect marketplace documentation](https://docs.stripe.com/connect/marketplace)

## Rollout

Apply both migrations before deploying the API and web application. Run the README verification sequence against separate disposable API and browser databases. Exercise withdrawal and replacement against the intended private S3/R2 bucket, test an actual seller's checkout and playback settings, and have the operator review privacy, copyright, appeals and refund texts before enabling new authoring in production. Scheduled publication, reader-account sync and automatic external purchase verification remain future work.
