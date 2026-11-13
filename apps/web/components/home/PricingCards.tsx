"use client";
import { type Common, translator } from "./types";
import { useState } from "react";
import { Check } from "lucide-react";
import { PLANS } from "./data";
import { Sticker } from "./bits";
import { cn } from "./types";

export default function PricingCards({ lang, name, domain, limits }: Common) {
  const tr = translator({ lang, name, domain });
  const [yearly, setYearly] = useState(false);

  return (
    <div>
      <div className="mx-auto flex w-fit items-center gap-1 rounded-full border border-ink/12 bg-ivory p-1">
        <button
          type="button"
          aria-pressed={!yearly}
          onClick={() => setYearly(false)}
          className={cn(
            "rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors",
            !yearly ? "bg-ink text-paper" : "text-ink/55 hover:text-ink",
          )}
        >
          {tr("Monthly")}
        </button>
        <button
          type="button"
          aria-pressed={yearly}
          onClick={() => setYearly(true)}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors",
            yearly ? "bg-ink text-paper" : "text-ink/55 hover:text-ink",
          )}
        >
          {tr("Yearly")}
          <span className="rounded-full bg-mint px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-wider text-ink">
            {tr("2 months free")}
          </span>
        </button>
      </div>

      <div className="mt-10 grid items-stretch gap-5 md:grid-cols-3">
        {PLANS.map((plan) => {
          const featured = plan.recommended;
          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-[1.5rem] border p-6 transition-transform duration-500 hover:-translate-y-1",
                featured
                  ? "border-ink bg-ink text-paper shadow-[0_40px_70px_-45px_hsl(var(--ink)/0.9)] md:-mt-4 md:pb-8"
                  : "border-ink/12 bg-ivory",
              )}
            >
              {featured && (
                <Sticker
                  tone="coral"
                  className="absolute -top-3 left-6 [transform:rotate(-2deg)]"
                >
                  {tr("Planned")}
                </Sticker>
              )}

              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-[19px] font-semibold tracking-tight">
                  {tr(plan.name)}
                </h3>
                {plan.id === "free" && (
                  <span className="rounded-full border border-ink/20 px-2 py-[2px] text-[9px] uppercase tracking-widest text-ink/45">
                    {tr("Free tier")}
                  </span>
                )}
              </div>
              <p
                className={cn(
                  "mt-1.5 text-[12.5px]",
                  featured ? "text-paper/60" : "text-ink/50",
                )}
              >
                {tr(plan.tagline)}
              </p>

              <div className="mt-6 flex items-end gap-1.5">
                <span className="font-display text-[40px] font-semibold leading-none tracking-[-0.04em]">
                  {tr("R$")}
                  {plan.price === 0
                    ? "0"
                    : (yearly ? plan.yearly : plan.price)
                        .toFixed(2)
                        .replace(".", ",")}
                </span>
                <span
                  className={cn(
                    "mb-1 text-[12px]",
                    featured ? "text-paper/50" : "text-ink/45",
                  )}
                >
                  {tr(
                    plan.price === 0
                      ? "no card needed"
                      : yearly
                        ? "/ year"
                        : "/ month",
                  )}
                </span>
              </div>

              <ul className="mt-6 flex-1 space-y-2.5">
                {(plan.id === "free" ? limits : plan.features).map((f) => (
                  <li
                    key={tr(f)}
                    className="flex items-start gap-2.5 text-[13px]"
                  >
                    <Check
                      className={cn(
                        "mt-0.5 h-3.5 w-3.5 shrink-0",
                        featured ? "text-mint" : "text-coral",
                      )}
                    />
                    <span
                      className={featured ? "text-paper/80" : "text-ink/70"}
                    >
                      {tr(f)}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.id === "free" ? "/auth/register" : undefined}
                aria-disabled={plan.id !== "free"}
                className={cn(
                  "mt-7 flex h-11 items-center justify-center rounded-full text-[13.5px] font-medium transition-all duration-300 hover:-translate-y-0.5",
                  featured
                    ? "bg-coral text-ink"
                    : "border border-ink/25 text-ink hover:border-ink/70 hover:bg-ink/[0.04]",
                )}
              >
                {tr(plan.cta)}
              </a>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-[11.5px] text-ink/40">
        {tr(
          "Proposed prices in Brazilian reais · paid plans are in development",
        )}
      </p>
    </div>
  );
}
