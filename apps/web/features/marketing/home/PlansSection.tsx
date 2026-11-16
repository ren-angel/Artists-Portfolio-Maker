import { type Common, translator } from "./types";
import { ArrowRight } from "lucide-react";
import { CompareTable } from "../../billing/CompareTable";
import { PlanCards } from "../../billing/PlanCards";
import type { Catalog } from "../../billing/plan-text";
import { Eyebrow, Sparkle } from "../../../shared/ui/bits";

export default function PlansSection(props: Common & { catalog: Catalog | null }) {
  const tr = translator(props);
  return (
    <section id="plans" className="border-t border-ink/10 bg-[#FBF6EE]">
      <div className="mx-auto max-w-[1100px] px-5 py-20 lg:py-28">
        <div className="mx-auto max-w-[560px] text-center">
          <div className="flex justify-center">
            <Eyebrow>{tr("Simple plans")}</Eyebrow>
          </div>
          <h2 className="mt-4 font-display text-[34px] font-semibold leading-[1.03] tracking-[-0.03em] sm:text-[44px]">
            {tr("Affordable enough to")}
            <span className="font-serif italic text-coral">
              {tr(" say yes today.")}
            </span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink/55">
            {tr(
              "Start free. Choose Artist for your own domain and commissions, or Studio for larger collections and advanced analytics.",
            )}
          </p>
        </div>

        <div id="plan-cards" className="mt-12">
          {props.catalog ? <>
            <PlanCards l={props.lang} catalog={props.catalog} href="/auth/register" />
            <div className="mt-12"><CompareTable l={props.lang} catalog={props.catalog} /></div>
          </> : <p role="status" className="text-center">{tr("Plan details are temporarily unavailable.")}</p>}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <a
            href="/pricing"
            className="group inline-flex items-center gap-2 text-[13px] font-medium text-ink/70 underline decoration-ink/25 underline-offset-4 transition-colors hover:text-ink"
          >
            {tr("Pricing and questions")}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </a>
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink/30">
            <Sparkle size={10} />
            {tr(" No ads · no selling your data · no lock-in")}
          </p>
        </div>
      </div>
    </section>
  );
}
