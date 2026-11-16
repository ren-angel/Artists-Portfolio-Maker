import SiteHeader from "../features/marketing/home/SiteHeader";
import Hero from "../features/marketing/home/Hero";
import DisciplineMarquee from "../features/marketing/home/DisciplineMarquee";
import FeaturedArtists from "../features/marketing/home/FeaturedArtists";
import TemplatesSection from "../features/marketing/home/TemplatesSection";
import HowItWorks from "../features/marketing/home/HowItWorks";
import EditorShowcase from "../features/marketing/home/EditorShowcase";
import GalleryShowcase from "../features/marketing/home/GalleryShowcase";
import CommissionShowcase from "../features/marketing/home/CommissionShowcase";
import ComicsShowcase from "../features/marketing/home/ComicsShowcase";
import Testimonials from "../features/marketing/home/Testimonials";
import PlansSection from "../features/marketing/home/PlansSection";
import FinalCta from "../features/marketing/home/FinalCta";
import SiteFooter from "../features/marketing/home/SiteFooter";
import "../features/marketing/home/home.css";
import { catalog } from "../features/billing/catalog";
import { brand, language } from "../shared/lib/server";
export default async function Home() {
  const [lang, plans] = await Promise.all([language(), catalog()]);
  const props = { lang, name: brand(), domain: process.env.PLATFORM_DOMAIN || "localhost" };
  return (
    <div className="artist-home">
      <SiteHeader {...props} />
      <main>
        <Hero {...props} />
        <DisciplineMarquee {...props} />
        <FeaturedArtists {...props} />
        <TemplatesSection {...props} />
        <HowItWorks {...props} />
        <EditorShowcase {...props} />
        <GalleryShowcase {...props} />
        <CommissionShowcase {...props} />
        <ComicsShowcase {...props} />
        <Testimonials {...props} />
        <PlansSection {...props} catalog={plans} />
        <FinalCta {...props} />
      </main>
      <SiteFooter {...props} />
    </div>
  );
}
