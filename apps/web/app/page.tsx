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
import { defaults } from "@studio/shared";
import { brand, language } from "../lib/server";
export default async function Home() {
  const lang = await language();
  const pt = lang === "pt-BR";
  const count = (key: string, fallback: number) =>
    Number(process.env[key] || fallback);
  const sites = count("MAX_SITES", defaults.sites);
  const pages = count("MAX_PAGES", defaults.pages);
  const works = count("MAX_ARTWORKS", defaults.artworks);
  const storage = Math.floor(
    count("MAX_STORAGE_BYTES", defaults.storage) / 1024 ** 2,
  );
  const props = {
    lang,
    name: brand(),
    domain: process.env.PLATFORM_DOMAIN || "localhost",
    limits: [
      pt ? `${sites} portfólio` : `${sites} portfolio website`,
      pt ? `Até ${works} obras` : `Up to ${works} artworks`,
      pt ? `${pages} páginas personalizadas` : `${pages} custom pages`,
      pt ? `${storage} MB de armazenamento` : `${storage} MB storage`,
      "Muralia subdomain",
      "All four templates",
    ],
  };
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
        <PlansSection {...props} />
        <FinalCta {...props} />
      </main>
      <SiteFooter {...props} />
    </div>
  );
}
