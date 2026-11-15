import { type Common, translator } from "./types";
import Logo from "./Logo";
import { Sparkle, Squiggle } from "./bits";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Templates", to: "/templates" },
      { label: "Features", to: "/features" },
      { label: "Pricing", to: "/pricing" },
      { label: "Website editor", to: "/studio?tab=editor" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Discover artists", to: "/explore" },
      { label: "Nina Flores", to: "/demo/gallery" },
      { label: "Luna Mori", to: "/demo/creative" },
      { label: "Theo Vale", to: "/demo/showcase" },
      { label: "Mika Sora", to: "/demo/story" },
    ],
  },
  {
    title: "The studio",
    links: [
      { label: "Sign in", to: "/auth/login" },
      { label: "Create account", to: "/auth/register" },
      { label: "Onboarding", to: "/studio?setup=1" },
      { label: "Dashboard", to: "/studio" },
    ],
  },
];

export default function SiteFooter({ lang, name }: Common) {
  const tr = translator({ lang, name });
  return (
    <footer className="u-grain relative overflow-hidden bg-ink text-paper">
      <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-lilac/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-coral/20 blur-3xl" />

      <div className="relative mx-auto max-w-[1240px] px-5 pb-10 pt-16">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Logo name={name} tone="paper" />
            <p className="mt-5 max-w-[280px] text-[15px] leading-relaxed text-paper/60">
              {tr(
                "Your art deserves its own little universe. A portfolio builder made by artists, for artists.",
              )}
            </p>
            <div className="mt-6 flex items-center gap-2 text-coral">
              <Sparkle size={14} />
              <Squiggle width={90} className="text-lilac/70" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={tr(col.title)}>
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-paper/40">
                  {tr(col.title)}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={tr(link.label)}>
                      <a
                        href={link.to}
                        className="text-[14px] text-paper/70 transition-colors hover:text-coral"
                      >
                        {tr(link.label)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-paper/15 pt-6 text-[12px] text-paper/45 sm:flex-row sm:items-center sm:justify-between">
          <p>{tr("© 2026 Muralia · Made for artists everywhere")}</p>
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-mint" />
            {tr("Artwork and artists shown here are fictional demonstrations")}
          </p>
        </div>
      </div>
    </footer>
  );
}
