import { type Common, translator } from "./types";
import { ArrowRight, Check } from "lucide-react";

import MButton from "./MButton";
import { Eyebrow, Sparkle, Tape } from "../../../shared/ui/bits";
import { COMMISSION_TYPES } from "./data";
import { placeholderArt } from "../../../shared/lib/placeholder";

export default function CommissionShowcase(props: Common) {
  const tr = translator(props);
  return (
    <section className="relative overflow-hidden bg-butter/50">
      <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-coral/25 blur-3xl" />
      <div className="mx-auto max-w-[1240px] px-5 py-20 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>{tr("Commissions · Artist and Studio")}</Eyebrow>
            <h2 className="mt-4 font-display text-[34px] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[44px]">
              {tr("Say yes to work")}
              <span className="font-serif italic text-ink/55">
                {tr(" without the inbox chaos.")}
              </span>
            </h2>
            <p className="mt-4 max-w-[400px] text-[15px] leading-relaxed text-ink/60">
              {tr(
                "Open a commission page with your types, prices, turnaround and terms. Clients see exactly what you offer, and you stop repeating yourself in DMs.",
              )}
            </p>

            <ul className="mt-7 space-y-2.5">
              {[
                "Open, closed or waitlist status in one click",
                "Prices in reais, dollars or anything you like",
                "Your terms of service, written once",
              ].map((line) => (
                <li
                  key={tr(line)}
                  className="flex items-start gap-2.5 text-[14px] text-ink/65"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink/45" />
                  {tr(line)}
                </li>
              ))}
            </ul>

            <MButton href="/demo/creative/commissions" variant="ink" className="mt-8">
              {tr("Explore commission pages")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </MButton>
          </div>

          <div className="relative">
            <Tape className="absolute -top-3 left-8 z-10 [transform:rotate(-4deg)]">
              {tr("commissions")}
            </Tape>
            <div className="u-paper relative rounded-[1.6rem] p-5 sm:p-6">
              <div className="flex items-center justify-between border-b border-ink/10 pb-4">
                <div>
                  <p className="font-display text-[17px] font-semibold tracking-tight">
                    {tr("Winter round")}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-ink/45">
                    {tr("3 slots · opens 1 December")}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
                  <span className="h-1.5 w-1.5 rounded-full bg-ink/60" />
                  {tr("Open")}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {COMMISSION_TYPES.map((type) => (
                  <div
                    key={type.id}
                    className="group overflow-hidden rounded-xl border border-ink/10 bg-paper"
                  >
                    <div className="relative h-[86px] overflow-hidden">
                      <img
                        src={placeholderArt(props.lang)}
                        alt={tr(type.name)}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex items-baseline justify-between px-2.5 py-2">
                      <span className="text-[11.5px] font-medium">
                        {tr(type.name)}
                      </span>
                      <span className="font-serif text-[12px] italic text-ink/60">
                        {type.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl bg-lilac/25 px-3 py-2.5">
                <Sparkle size={12} className="shrink-0 text-ink/60" />
                <p className="text-[11px] leading-snug text-ink/60">
                  {tr(
                    "Reference sheets from R$720, includes a full colour palette.",
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
