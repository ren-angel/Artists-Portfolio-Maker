import SiteHeader from "../../components/home/SiteHeader";
import SiteFooter from "../../components/home/SiteFooter";
import { PricingPage } from "../../components/billing/PricingPage";
import "../../components/home/home.css";
import "../../components/ui/ui.css";
import { brand, language } from "../../lib/server";
import type { Catalog } from "../../components/studio/plan-text";

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
  const lang = await language();
  const r = await fetch(
    (process.env.API_INTERNAL_ORIGIN || "http://127.0.0.1:4000") + "/billing/plans",
    { cache: "no-store" },
  );
  if (!r.ok) throw Error("Plans unavailable");
  const catalog = (await r.json()) as Catalog;
  const props = {
    lang,
    name: brand(),
    domain: process.env.PLATFORM_DOMAIN || "localhost",
    limits: [],
  };
  return (
    <div className="artist-home">
      <SiteHeader {...props} />
      <main className="ui">
        <PricingPage l={lang} catalog={catalog} brand={brand()} />
      </main>
      <SiteFooter {...props} />
    </div>
  );
}
