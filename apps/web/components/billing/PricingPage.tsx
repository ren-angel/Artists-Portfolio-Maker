import { Check, Minus } from "lucide-react";
import type { Lang } from "../../lib/copy";
import { Eyebrow, Sparkle, Squiggle } from "../home/bits";
import { PlanCards } from "../studio/PlanCards";
import { featureRows, planName, type Catalog } from "../studio/plan-text";

/** Public plan comparison. Prices and limits come from the API catalog. */
export function PricingPage({ l, catalog, brand }: { l: Lang; catalog: Catalog; brand: string }) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const rows = catalog.plans.map((p) => featureRows(l, p));
  const faqs: [string, string][] = [
    [
      tr("Do card payments renew automatically?", "O cartão renova automaticamente?"),
      tr(
        "Yes. Card subscriptions renew each month or year until you cancel. Pix works differently: we send an invoice every cycle and your plan continues when it's paid.",
        "Sim. Assinaturas no cartão renovam todo mês ou ano até você cancelar. O Pix funciona diferente: enviamos uma fatura a cada ciclo e o plano continua quando ela é paga.",
      ),
    ],
    [
      tr("What happens if I cancel or downgrade?", "E se eu cancelar ou mudar para um plano menor?"),
      tr(
        "You keep paid features until the end of the period you paid for. Nothing is deleted: if you're above the new limits you can keep editing, and you'll need to remove some content before adding more.",
        "Você mantém os recursos pagos até o fim do período pago. Nada é apagado: se passar dos novos limites, você continua editando e precisará remover algum conteúdo antes de adicionar mais.",
      ),
    ],
    [
      tr("Who owns my artwork?", "De quem são as minhas obras?"),
      tr(`You do. ${brand} never claims ownership of the work you upload.`, `Suas. ${brand} nunca reivindica a propriedade das obras que você envia.`),
    ],
    [
      tr("Can I use my own domain?", "Posso usar meu próprio domínio?"),
      tr(
        "Yes, on Artist and Studio. Your free address always keeps working, even if a plan ends.",
        "Sim, nos planos Artista e Estúdio. Seu endereço gratuito continua funcionando, mesmo se o plano terminar.",
      ),
    ],
  ];
  return (
    <div className="mx-auto max-w-[1180px] px-5 pb-24 pt-14 sm:px-8">
      <div className="mx-auto max-w-[720px] text-center">
        <Eyebrow className="justify-center">{tr("Plans & pricing", "Planos e preços")}</Eyebrow>
        <h1 className="mt-4 font-display text-[44px] font-semibold leading-[1] tracking-[-0.04em] sm:text-[64px]">
          {tr("Grow at your", "Cresça no seu")} <span className="font-serif font-normal italic text-coral">{tr("own pace.", "próprio ritmo.")}</span>
        </h1>
        <Squiggle className="mx-auto mt-4 text-coral" width={140} />
        <p className="mx-auto mt-5 max-w-[520px] text-[15px] leading-relaxed text-ink/60">
          {tr(
            "Start free with all four templates. Upgrade when you want your own domain, commission pages and more room for your work.",
            "Comece grátis com os quatro modelos. Faça upgrade quando quiser domínio próprio, páginas de encomenda e mais espaço para suas obras.",
          )}
        </p>
      </div>
      <div className="mt-12">
        <PlanCards l={l} catalog={catalog} href="/auth/register" />
      </div>
      <section className="mt-16 overflow-x-auto rounded-[1.4rem] border border-ink/10 bg-ivory">
        <table className="w-full min-w-[640px] text-left text-[13px]">
          <caption className="sr-only">{tr("Plan comparison", "Comparação de planos")}</caption>
          <thead>
            <tr className="border-b border-ink/10">
              <th className="px-5 py-4 font-display text-[15px] font-semibold">{tr("Compare", "Compare")}</th>
              {catalog.plans.map((p) => (
                <th key={p.id} className="px-5 py-4 font-display text-[15px] font-semibold">
                  {planName(l, p.id)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows[0].map((_, i) => (
              <tr key={i} className="border-b border-ink/[0.06] last:border-0">
                <th scope="row" className="px-5 py-3 font-normal text-ink/60">
                  {[
                    tr("Pages", "Páginas"),
                    tr("Artworks", "Obras"),
                    tr("Storage", "Armazenamento"),
                    tr("Templates", "Modelos"),
                    tr("Subdomain", "Subdomínio"),
                    tr("Custom domain", "Domínio próprio"),
                    tr("No platform branding", "Sem marca da plataforma"),
                    tr("Commission sections", "Seções de encomenda"),
                    tr("Customization", "Personalização"),
                    tr("Analytics", "Estatísticas"),
                  ][i]}
                </th>
                {rows.map((r, j) => (
                  <td key={j} className="px-5 py-3">
                    {i >= 5 && i <= 7 ? (
                      r[i][1] ? <Check className="h-4 w-4 text-[#2f8a68]" aria-label={tr("Included", "Incluso")} /> : <Minus className="h-4 w-4 text-ink/30" aria-label={tr("Not included", "Não incluso")} />
                    ) : (
                      r[i][0]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="mx-auto mt-16 max-w-[760px]">
        <h2 className="flex items-center gap-2 font-display text-[28px] font-semibold tracking-[-0.03em]">
          <Sparkle size={16} className="text-coral" /> {tr("Questions", "Perguntas")}
        </h2>
        <div className="mt-5 divide-y divide-ink/10 rounded-[1.2rem] border border-ink/10 bg-ivory">
          {faqs.map(([q, a]) => (
            <details key={q} className="group px-5 py-4">
              <summary className="cursor-pointer list-none font-medium marker:hidden">{q}</summary>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink/60">{a}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-center text-[12px] text-ink/45">
          {tr("Prices in Brazilian reais. See the", "Preços em reais. Veja a")}{" "}
          <a href="/legal/refunds" className="underline underline-offset-2">
            {tr("refund and cancellation policy", "política de reembolso e cancelamento")}
          </a>
          .
        </p>
      </section>
    </div>
  );
}
