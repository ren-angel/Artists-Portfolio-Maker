import type { Common } from "../home/types";
import { translator } from "../home/types";
import SiteHeader from "../home/SiteHeader";
import SiteFooter from "../home/SiteFooter";
import FinalCta from "../home/FinalCta";
import PageIntro from "./PageIntro";
import TemplateExplorer from "./TemplateExplorer";
import DiscoverGallery from "./DiscoverGallery";
import FeatureShowcases from "./FeatureShowcases";

const pages = {
  templates: {
    eyebrow: "The collection", title: "Four starting points,", accent: "none of them generic.",
    subtitle: "Each template has its own layout, typography and gallery. Pick the closest one, then make it yours.",
    Content: TemplateExplorer,
  },
  features: {
    eyebrow: "Everything inside", title: "Powerful where it matters.", accent: "Quiet everywhere else.",
    subtitle: "See how the visual editor, galleries and themes bring your work together.",
    Content: FeatureShowcases,
  },
  explore: {
    eyebrow: "Discover", title: "The exhibition is", accent: "always open.",
    subtitle: "Wander through our demo portfolios and explore the artwork behind each template.",
    Content: DiscoverGallery,
  },
};
export function MarketingPage({ page, ...props }: Common & { page: keyof typeof pages }) {
  const { eyebrow, title, accent, subtitle, Content } = pages[page];
  const tr = translator(props);
  return <div className="artist-home">
    <SiteHeader {...props} active={"/" + page} />
    <main>
      <PageIntro eyebrow={tr(eyebrow)} title={<>{tr(title)}{page === "explore" ? " " : <br />}
        <span className="font-serif italic text-coral">{tr(accent)}</span></>} subtitle={tr(subtitle)} />
      <Content {...props} />
      {page !== "templates" && <FinalCta {...props} />}
    </main>
    <SiteFooter {...props} />
  </div>;
}
