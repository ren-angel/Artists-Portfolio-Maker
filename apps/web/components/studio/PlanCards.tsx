"use client";
import { useState } from "react";
import { Check, Minus, Sparkles } from "lucide-react";
import { formatMoney, type Cycle, type PlanId } from "@studio/shared";
import { featureRows, planName, TAGS, type Catalog, type CatalogPlan } from "./plan-text";
export { featureRows, planName, size, type Catalog, type CatalogPlan } from "./plan-text";
import type { Lang } from "../../lib/copy";
import { cn } from "../home/types";

/* Plan comparison shared by the studio billing screen and the public pricing
   page. Everything shown comes from the API catalog (entitlements and
   configured prices); this component only chooses words for them. */

export function PlanCards({
  l,
  catalog,
  current,
  onChoose,
  href,
}: {
  l: Lang;
  catalog: Catalog;
  current?: PlanId;
  onChoose?: (plan: PlanId, cycle: Cycle) => void;
  href?: string;
}) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const saving = (p: CatalogPlan) => (p.prices ? Math.round((1 - p.prices.yearly.amount / (p.prices.monthly.amount * 12)) * 100) : 0);
  const best = Math.max(...catalog.plans.map(saving));
  return (
    <div>
      <div className="flex justify-center">
        <div className="inline-flex gap-1 rounded-full border border-ink/12 bg-ivory p-1" role="radiogroup" aria-label={tr("Billing cycle", "Ciclo de cobrança")}>
          {(["monthly", "yearly"] as const).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={cycle === c}
              onClick={() => setCycle(c)}
              className={cn("rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors", cycle === c ? "bg-ink text-paper" : "text-ink/55 hover:text-ink")}
            >
              {c === "monthly" ? tr("Monthly", "Mensal") : tr("Yearly", "Anual")}
              {c === "yearly" && best > 0 && <span className="ml-1.5 rounded-full bg-mint px-1.5 py-[1px] text-[9.5px] font-semibold text-ink">−{best}%</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {catalog.plans.map((p) => {
          const featured = p.id === "artist";
          const price = p.prices?.[cycle];
          const isCurrent = current === p.id;
          return (
            <article
              key={p.id}
              className={cn(
                "relative flex flex-col rounded-[1.4rem] border p-6",
                featured ? "border-ink bg-ink text-paper shadow-[0_30px_60px_-36px_hsl(var(--ink)/0.8)]" : "border-ink/12 bg-ivory",
              )}
            >
              {featured && (
                <span className="u-sticker absolute -top-3 right-5 rotate-3 rounded-full bg-coral px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink">
                  {tr("Most chosen", "Mais escolhido")}
                </span>
              )}
              <h3 className="font-display text-[22px] font-semibold tracking-tight">{planName(l, p.id)}</h3>
              <p className={cn("mt-1 text-[13px]", featured ? "text-paper/60" : "text-ink/55")}>{TAGS[p.id][l === "en" ? 0 : 1]}</p>
              <p className="mt-5 flex items-baseline gap-1.5">
                <span className="font-display text-[34px] font-semibold tracking-[-0.03em]">
                  {price ? formatMoney(price, l) : formatMoney({ amount: 0, currency: "BRL" }, l)}
                </span>
                <span className={cn("text-[12px]", featured ? "text-paper/50" : "text-ink/45")}>
                  {price ? (cycle === "monthly" ? tr("/ month", "/ mês") : tr("/ year", "/ ano")) : tr("forever", "para sempre")}
                </span>
              </p>
              {price && cycle === "yearly" && p.prices && (
                <p className={cn("mt-1 text-[11.5px]", featured ? "text-paper/55" : "text-ink/45")}>
                  ≈ {formatMoney({ amount: Math.round(p.prices.yearly.amount / 12), currency: p.prices.yearly.currency }, l)} {tr("per month", "por mês")}
                </p>
              )}
              <ul className="mt-5 flex-1 space-y-2">
                {featureRows(l, p).map(([text, on]) => (
                  <li key={text} className={cn("flex items-start gap-2 text-[13px]", !on && (featured ? "text-paper/35" : "text-ink/35"))}>
                    {on ? <Check className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", featured ? "text-coral" : "text-[#2f8a68]")} /> : <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                    {text}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <span className={cn("mt-6 inline-flex h-11 items-center justify-center rounded-full border text-[13px] font-medium", featured ? "border-paper/30" : "border-ink/20")}>
                  {tr("Your current plan", "Seu plano atual")}
                </span>
              ) : onChoose && p.id !== "free" ? (
                <button
                  type="button"
                  onClick={() => onChoose(p.id, cycle)}
                  className={cn(
                    "mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full text-[13px] font-medium transition-transform hover:-translate-y-0.5",
                    featured ? "bg-coral text-ink" : "bg-ink text-paper",
                  )}
                >
                  <Sparkles className="h-4 w-4" /> {tr("Choose", "Escolher")} {planName(l, p.id)}
                </button>
              ) : href ? (
                <a
                  href={href}
                  className={cn(
                    "mt-6 inline-flex h-11 items-center justify-center rounded-full text-[13px] font-medium transition-transform hover:-translate-y-0.5",
                    featured ? "bg-coral text-ink" : p.id === "free" ? "border border-ink/20" : "bg-ink text-paper",
                  )}
                >
                  {p.id === "free" ? tr("Start for free", "Comece grátis") : tr("Choose", "Escolher") + " " + planName(l, p.id)}
                </a>
              ) : null}
            </article>
          );
        })}
      </div>
      <p className="mt-5 text-center text-[11.5px] leading-relaxed text-ink/45">
        {tr(
          "Card payments renew automatically. Pix creates an invoice each cycle that you pay yourself; it never renews on its own. Cancel any time — paid access lasts until the end of the period you paid for.",
          "Cartão renova automaticamente. Pix gera uma fatura a cada ciclo que você mesmo paga; não renova sozinho. Cancele quando quiser — o acesso pago vale até o fim do período pago.",
        )}
      </p>
    </div>
  );
}
