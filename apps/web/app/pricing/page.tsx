import SiteHeader from "../../features/marketing/home/SiteHeader";
import SiteFooter from "../../features/marketing/home/SiteFooter";
import { PricingPage } from "../../features/billing/PricingPage";
import "../../features/marketing/home/home.css";
import { brand, language } from "../../shared/lib/server";
import { catalog } from "../../features/billing/catalog";

export async function generateMetadata() {
  const l = await language();
  return {
    title: (l === "en" ? "Plans & pricing · " : "Planos e preços · ") + brand(),
    description:
      l === "en"
        ? "Affordable plans for artists: start free, upgrade for a custom domain, commission pages and analytics."
        : "Planos acessíveis para artistas: comece grátis e faça upgrade para domínio próprio, encomendas e estatísticas.",
  };
}
export default async function Pricing() {
  const [lang, plans] = await Promise.all([language(), catalog()]);
  const props = {
    lang,
    name: brand(),
    domain: process.env.PLATFORM_DOMAIN || "localhost",
  };
  return (
    <div className="artist-home">
      <SiteHeader {...props} active="/pricing" />
      <main>
        {plans ? <PricingPage l={lang} catalog={plans} brand={brand()} /> : <p role="status" className="p-8 text-center">{lang === "en" ? "Plan details are temporarily unavailable." : "Os detalhes dos planos estão temporariamente indisponíveis."}</p>}
      </main>
      <SiteFooter {...props} />
    </div>
  );
}
