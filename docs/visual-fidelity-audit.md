# Visual fidelity audit

> Historical audit (13–14 November 2026). File paths refer to the layout before the DDD refactor; see the move table in [DDD-ARCHITECTURE.md](DDD-ARCHITECTURE.md).

Reference: `Design/` (read-only). Comparisons used a local Vite harness that renders the original Design routes with stubbed router/image modules, and the production dev servers, both captured with Playwright + system Chrome at 1440×900 and 390×844 (tablet checked in the editor). Status key: Implemented · Visually verified (screenshot compared) · Functionally verified (scripted against the real API).

| Screen | Design source | Production | Status | Remaining discrepancies |
| --- | --- | --- | --- | --- |
| Marketing homepage | routes/index.jsx | app/page.tsx | Unchanged; pixel diff vs baseline = 0 (desktop and mobile) after `style.css` changes | — |
| Visual editor | components/editor/* | components/studio/editor/* | Implemented, visually + functionally verified (edit, autosave, undo/redo, add section, publish) | Canvas shows the real template scaled (reference drew a mock); Design-only blocks (commissions, comics, characters, spacer) omitted |
| Gallery template | portfolio.gallery.index, works.$workId | components/templates/Gallery.tsx | Implemented, visually verified | No year/medium fields in schema, so captions use gallery names |
| Creative template | portfolio.creative.index | templates/Creative.tsx | Implemented, visually verified | Character/shop/commission subpages not in schema |
| Showcase template | portfolio.showcase.index, projects.$projectId | templates/Showcase.tsx | Implemented, visually verified | Project fact rows use available data only |
| Story template | portfolio.story.index, chapters.$chapterId | templates/Story.tsx | Implemented, visually verified | Character cards section and page-by-page reader mode not implemented |
| Dashboard overview | dashboard.index + dashboard/* | studio/Overview.tsx, DashLayout.tsx | Implemented, visually verified | Visitor chart and activity feed replaced by live preview and recent artworks (no analytics/activity data) |
| Artwork library | ArtworkLibrary.jsx | studio/Library.tsx | Implemented, visual + functional | Gallery filters replace category filters; no image dimensions shown |
| Galleries list/detail | GalleriesManager.jsx, galleries.$galleryId | studio/Galleries.tsx | Implemented, visual + functional | "Layout" tile replaced by cover tile |
| Pages | PagesManager.jsx | studio/Pages.tsx | Implemented, visual + functional | Status shows navigation visibility |
| Theme & appearance | dashboard.theme.jsx | studio/ThemePage.tsx | Implemented, visual + functional | Radius/texture/badge controls omitted (not in theme model) |
| Settings | dashboard.settings.jsx | studio/Settings.tsx | Implemented, functional | Privacy, notifications, security sections omitted (no backend) |
| Onboarding | onboarding/* | studio/Onboarding.tsx | Implemented, visual + functional (repo e2e passes) | Name and address share step one; sample-artwork picker omitted |
| Sign in / register / forgot / reset / verify | login, register, forgot-password, reset-password, auth-art/* | components/Auth.tsx | Implemented, visually verified; e2e passes | Google sign-in and "keep me signed in" omitted |
| Demo templates | portfolio.* | app/demo/[template]/[[...path]] | Implemented, visually verified | Demo block text is English in both languages |
| Templates, Features, Pricing, Explore pages | templates.jsx, features.jsx, pricing.jsx, explore.jsx | — | Not started (no production routes exist) | Next step if these pages are wanted |
| Commissions, analytics, domains, subscription, comics, characters, projects, shop | dashboard.* | — | Intentionally not exposed (Phase 2/3, see CHECKPOINT) | — |
| Not-found, error, report pages | NotFound.jsx, DefaultCatchBoundary.jsx (unstyled starter screens) | components/ui/Status.tsx, components/Report.tsx | Implemented, visually verified | Restyled with the platform shell, since the references are unbranded template defaults |

## Notes
- New surfaces render inside `.ui` (`components/ui/ui.css`); legacy element rules in `app/style.css` are guarded with `:where(:not(.ui *))` so the homepage is unaffected. Legacy studio/auth/portfolio class rules were pruned (1078 → 329 lines); the homepage pixel diff stayed at zero.
- Templates use container-query variants (`csm`, `cmd`, `clg`) so editor device frames match public rendering.
- Dev-server quirk: Turbopack caches `ui.css` by content; after adding files in new folders, change `ui.css` (e.g. an `@source` line) to rescan. Production builds are unaffected.

## Checks run
- `tsc` (root and web), `eslint apps packages tests`.
- `pnpm test` against a fresh `studio_test` database: 11 pass, including the real API integration test. `pnpm test:sql` passes.
- Repo Playwright e2e (`tests/browser`): 2 pass, run with the system Chrome.
- Scripted editor and studio flows against the dev API: pass, no page errors.
- `pnpm build` passes with `NODE_ENV=production`. With the local `.env` value `NODE_ENV=development`, `next build` fails prerendering `/_global-error` (React `useContext` null). This is caused by the non-standard `NODE_ENV` at build time, not the restored screens. Build with `NODE_ENV=production` or remove `NODE_ENV` from `.env` for builds.

## Resume here
1. Marketing subpages (Design `templates.jsx`, `features.jsx`, `pricing.jsx`, `explore.jsx`) have no production routes. Pricing is gated by CHECKPOINT (Phase 2) and Explore needs a discovery backend; a Templates page could be built from the existing demos if wanted.
2. Story character cards and page-by-page reader mode; Portuguese demo block text.
