import type { Cycle, Features, Limits, PlanId, Price } from "@studio/shared";
import type { Lang } from "../../lib/copy";

/* Plan wording shared by server and client components. */

export type CatalogPlan = { id: PlanId; limits: Limits; features: Features; prices: Record<Cycle, Price> | null };
export type Catalog = { plans: CatalogPlan[]; live: boolean; provider: string };

const NAMES: Record<PlanId, [string, string]> = { free: ["Free", "Grátis"], artist: ["Artist", "Artista"], studio: ["Studio", "Estúdio"] };
export const TAGS: Record<PlanId, [string, string]> = {
  free: ["For your very first portfolio.", "Para o seu primeiro portfólio."],
  artist: ["For artists who share their work often.", "Para quem compartilha arte com frequência."],
  studio: ["For big archives and serious analytics.", "Para grandes acervos e estatísticas completas."],
};
export const planName = (l: Lang, p: PlanId) => NAMES[p][l === "en" ? 0 : 1];
export const size = (bytes: number) => (bytes >= 1024 ** 3 ? Math.round(bytes / 1024 ** 3) + " GB" : Math.round(bytes / 1024 ** 2) + " MB");

export function featureRows(l: Lang, p: CatalogPlan): [string, boolean][] {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const f = p.features;
  return [
    [tr(`${p.limits.pages} custom pages`, `${p.limits.pages} páginas personalizadas`), true],
    [tr(`Up to ${p.limits.artworks.toLocaleString(l)} artworks`, `Até ${p.limits.artworks.toLocaleString(l)} obras`), true],
    [tr(`${size(p.limits.storage)} storage`, `${size(p.limits.storage)} de armazenamento`), true],
    [tr("All four templates", "Os quatro modelos"), true],
    [tr("Platform subdomain", "Subdomínio da plataforma"), true],
    [tr("Custom domain", "Domínio próprio"), f.customDomain],
    [tr("No platform branding", "Sem a marca da plataforma"), f.removeBranding],
    [tr("Commission page sections", "Seções de encomendas"), f.commissions],
    [
      f.appearance === "advanced"
        ? tr("Advanced customization: grids and section backgrounds", "Personalização avançada: grades e fundos de seção")
        : f.appearance === "more"
          ? tr("More appearance controls", "Mais controles de aparência")
          : tr("Basic customization", "Personalização básica"),
      true,
    ],
    [f.analytics === "advanced" ? tr("Advanced analytics", "Estatísticas avançadas") : tr("Basic analytics", "Estatísticas básicas"), true],
  ];
}

