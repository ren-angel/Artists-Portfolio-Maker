# Visual implementation guide

Reference folder on Linux: `Design/`. This export contains JSX and design tokens. Its artwork catalogue points to external Base44 media. Production ships independent original print studies for template demonstrations only.

| Surface | Reference | Implementation direction |
| --- | --- | --- |
| Marketing | home/Hero, HeroCollage, MiniSite, TemplatesSection | Warm paper, oversized tightly tracked display text with coral serif italic emphasis, three overlapping mini portfolios with tape, stickers and soft shadows. Row of cards on small screens. |
| Studio | dashboard/DashLayout, PortfolioPreviewCard, ArtworkLibrary, PagesManager, GalleriesManager | Ivory sidebar, dark active item with coral detail, small artist identity card, spacious preview and practical grids. Show counts from the draft. |
| Authentication | auth-art/AuthShell, Field | Airy split screen, narrow labeled form and full-height artwork on desktop. |
| Setup | onboarding/OnboardingWizard, OnboardingPreview | Progress indicator, choices on one side, live portfolio on the other. Save progress between visits. |
| Editor | editor/EditorApp, EditorLeftRail, EditorProperties, EditorCanvas | Slim toolbar, ordered sections at left, framed page in the middle, compact inspector on right. Stack on mobile and preserve keyboard ordering. |
| Gallery | routes/portfolio.gallery.index | Ivory #FFFDF8, charcoal, Instrument Serif, generous margins, asymmetric title and vertical photograph, exhibition wall with quiet captions. |
| Creative | routes/portfolio.creative.index | Peach #FFF4EF and ink #272438, lilac, coral and mint accents. Overlapping tilted print, sparkles, rounded navigation, staggered card wall. |
| Showcase | routes/portfolio.showcase.index | Near-black field, amber accent, uppercase Archivo type, edge-to-edge cinematic artwork with overlaid title, wide project rows. |
| Story | routes/portfolio.story.index | Parchment #F8F0E3, sepia #6B5442, Cormorant Garamond. Book-cover composition, italic introduction and chapter-like illustrated rows. |

Platform tokens from src/index.css and tailwind.config.js: paper hsl(36 100% 97%), ivory hsl(40 100% 99%), deep ink hsl(249 19% 18%), coral #FF7868, lilac #B6A0F6, mint #A6E5CB, butter #FFE5A0. Bricolage Grotesque headings and DM Sans body. Use 1.1rem card corners, fine ink borders, pill buttons and small tracked labels. Honor reduced motion for lift/float effects. Leave billing, commerce, commissions management, comics management and analytics out of the studio navigation.
