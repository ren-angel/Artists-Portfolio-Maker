import SiteHeader from "../components/home/SiteHeader";
import Hero from "../components/home/Hero";
import DisciplineMarquee from "../components/home/DisciplineMarquee";
import FeaturedArtists from "../components/home/FeaturedArtists";
import TemplatesSection from "../components/home/TemplatesSection";
import HowItWorks from "../components/home/HowItWorks";
import EditorShowcase from "../components/home/EditorShowcase";
import GalleryShowcase from "../components/home/GalleryShowcase";
import CommissionShowcase from "../components/home/CommissionShowcase";
import ComicsShowcase from "../components/home/ComicsShowcase";
import Testimonials from "../components/home/Testimonials";
import PlansSection from "../components/home/PlansSection";
import FinalCta from "../components/home/FinalCta";
import SiteFooter from "../components/home/SiteFooter";
import "../components/home/home.css";
import { catalog } from "../lib/catalog";
import { brand, language } from "../lib/server";
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
