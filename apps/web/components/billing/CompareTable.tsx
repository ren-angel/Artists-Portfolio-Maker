import { Check, Minus } from "lucide-react";
import type { Lang } from "../../lib/copy";
import { Eyebrow } from "../home/bits";
import { planName, size, type Catalog, type CatalogPlan } from "../studio/plan-text";

export function CompareTable({ l, catalog }: { l: Lang; catalog: Catalog }) {
  const tr = (en: string, pt: string) => l === "en" ? en : pt;
  const title = tr("Compare plans", "Compare os planos");
  const rows: [string, (plan: CatalogPlan) => string | number | boolean][] = [
    [tr("Portfolio websites", "Portfólios"), p => p.limits.sites],
    [tr("Artworks", "Obras"), p => p.limits.artworks.toLocaleString(l)],
    [tr("Custom pages", "Páginas personalizadas"), p => p.limits.pages],
    [tr("Storage", "Armazenamento"), p => size(p.limits.storage)],
    [tr("Maximum file size", "Tamanho máximo por arquivo"), p => size(p.limits.upload)],
    [tr("Templates", "Modelos"), () => tr("All four", "Os quatro")],
    [tr("Platform subdomain", "Subdomínio da plataforma"), () => true],
    [tr("Custom domain", "Domínio próprio"), p => p.features.customDomain],
    [tr("Commission sections", "Seções de encomendas"), p => p.features.commissions],
    [tr("Customization", "Personalização"), p => ({
      basic: tr("Basic", "Básica"), more: tr("Expanded", "Ampliada"), advanced: tr("Advanced", "Avançada"),
    })[p.features.appearance]],
    [tr("Analytics", "Estatísticas"), p => p.features.analytics === "advanced" ? tr("Advanced", "Avançadas") : tr("Basic", "Básicas")],
    [tr("Remove platform branding", "Remover marca da plataforma"), p => p.features.removeBranding],
  ];
  return (
    <div id="plan-comparison" role="region" aria-label={title} tabIndex={0}
      className="relative overflow-x-auto rounded-[1.5rem] border border-ink/12 bg-ivory focus-visible:outline-2 focus-visible:outline-ink">
      <table className="w-full min-w-[620px] border-collapse text-left text-[13px] text-ink/75">
        <caption className="sr-only">{title}</caption>
        <thead><tr className="border-b border-ink/12">
          <th scope="col" className="px-5 py-4"><Eyebrow>{title}</Eyebrow></th>
          {catalog.plans.map(p => <th key={p.id} scope="col" className={`px-4 py-4 text-center font-display text-[14px] font-semibold ${p.id === "artist" ? "bg-lilac/15 text-ink" : ""}`}>
            {planName(l, p.id)}
            {p.id === "artist" && <span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.16em]">{tr("Recommended", "Recomendado")}</span>}
          </th>)}
        </tr></thead>
        <tbody>{rows.map(([label, get]) => <tr key={label} className="border-b border-ink/[0.07] last:border-0">
          <th scope="row" className="px-5 py-3 font-normal">{label}</th>
          {catalog.plans.map(p => {
            const value = get(p);
            return <td key={p.id} className={`px-4 py-3 text-center ${p.id === "artist" ? "bg-lilac/[0.07]" : ""}`}>
              {typeof value === "boolean" ? <>
                {value ? <Check aria-hidden className="mx-auto h-4 w-4 text-coral" /> : <Minus aria-hidden className="mx-auto h-4 w-4 text-ink/40" />}
                <span className="sr-only">{value ? tr("Included", "Incluso") : tr("Not included", "Não incluso")}</span>
              </> : value}
            </td>;
          })}
        </tr>)}</tbody>
      </table>
    </div>
  );
}
