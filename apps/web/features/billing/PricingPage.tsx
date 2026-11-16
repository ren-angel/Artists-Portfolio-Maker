import { Check, ChevronDown } from "lucide-react";
import type { Lang } from "../../shared/lib/copy";
import { Eyebrow, Sparkle } from "../../shared/ui/bits";
import { PlanCards } from "./PlanCards";
import PageIntro from "../marketing/PageIntro";
import { CompareTable } from "./CompareTable";
import type { Catalog } from "./plan-text";

/** Public plan comparison. Prices and limits come from the API catalog. */
export function PricingPage({ l, catalog, brand }: { l: Lang; catalog: Catalog; brand: string }) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const currencies = [...new Set(catalog.plans.flatMap(p =>
    p.prices ? [p.prices.monthly.currency, p.prices.yearly.currency] : []))].join(" / ");
  const faqs: [string, string][] = [
    [tr("Do I need to know how to code?", "Preciso saber programar?"), tr("Choose a template, add your images and arrange sections in the visual editor.", "Escolha um modelo, envie suas imagens e organize as seções no editor visual.")],
    [tr("Can I change templates later?", "Posso trocar de modelo depois?"), tr("Yes. Your pages, galleries and artwork carry over when you switch templates.", "Sim. Suas páginas, galerias e obras acompanham você quando troca de modelo.")],
    [tr("How does pricing work in Brazil?", "Como funcionam os preços no Brasil?"),
      tr(`Choose monthly or yearly billing. Prices are shown in ${currencies} and the annual amount covers the full year.`,
        `Escolha a cobrança mensal ou anual. Os preços aparecem em ${currencies} e o valor anual cobre o ano inteiro.`)],
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
    <>
      <PageIntro eyebrow={tr("Plans", "Planos")} title={<>{tr("Priced for artists,", "Planos para artistas,")}<br />
        <span className="font-serif italic text-coral">{tr("from your first portfolio.", "desde o primeiro portfólio.")}</span></>}
        subtitle={tr("Start free with all four templates. Upgrade for a custom domain, commission pages and more room for your work.",
          "Comece grátis com os quatro modelos. Amplie seu plano para ter domínio próprio, páginas de encomendas e mais espaço para suas obras.")} />
      <div className="mx-auto max-w-[1100px] px-5 py-14 lg:py-20">
        <PlanCards l={l} catalog={catalog} href="/auth/register" />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[tr("Start without a card", "Comece sem cartão"), tr("Your artwork stays yours", "As obras são suas"),
            tr("Cancel in the studio", "Cancele pelo ateliê"), tr("Keep your work on downgrade", "Mantenha suas obras ao reduzir o plano")].map(item =>
            <p key={item} className="flex items-center gap-2.5 rounded-xl border border-ink/10 bg-ivory px-4 py-3 text-[12.5px]">
              <Check aria-hidden className="h-3.5 w-3.5 text-coral" />{item}</p>)}
        </div>
        <div className="mt-16"><CompareTable l={l} catalog={catalog} /></div>
        <section className="mt-16 grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <div><Eyebrow>{tr("Questions", "Perguntas")}</Eyebrow>
            <h2 className="mt-4 font-display text-[30px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[38px]">
              {tr("The things artists", "O que os artistas")} <span className="font-serif italic text-ink/55">{tr("actually ask.", "querem saber.")}</span>
            </h2>
            <p className="mt-4 max-w-[300px] text-[14px] text-ink/65">{tr("Start free and explore the editor at your pace.", "Comece grátis e explore o editor no seu ritmo.")}</p>
            <p className="mt-6 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink/55"><Sparkle size={10} />
              {tr("Billed in", "Cobrança em")} {currencies}
            </p>
            <a href="/legal/refunds" className="mt-5 inline-block text-[12px] underline">{tr("Refund and cancellation policy", "Política de reembolso e cancelamento")}</a>
          </div>
          <div className="rounded-[1.5rem] border border-ink/12 bg-ivory px-6 py-2">
            {faqs.map(([q,a]) => <details name="pricing-faq" key={q} className="group border-b border-ink/12 last:border-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-5 font-display text-[16.5px] font-medium">
                {q}<ChevronDown aria-hidden className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-5 pr-8 text-[14px] leading-relaxed text-ink/65">{a}</p>
            </details>)}
          </div>
        </section>
      </div>
    </>
  );
}
