import { type Common, translator } from "./types";
import { ArrowRight } from "lucide-react";
import MButton from "./MButton";

import { Sparkle, Squiggle } from "./bits";
import { ART } from "./data";

const STRIP = [
  ART.lunaFanart,
  ART.theoIslands,
  ART.ninaStill,
  ART.mikaWatercolor,
  ART.poster,
  ART.mikaChar,
];

export default function FinalCta(props: Common) {
  const tr = translator(props);
  return (
    <section className="u-grain relative overflow-hidden bg-coral">
      <div className="pointer-events-none absolute -left-20 -top-16 h-72 w-72 rounded-full bg-butter/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-80 w-80 rounded-full bg-lilac/40 blur-3xl" />

      <div className="relative mx-auto max-w-[1000px] px-5 pb-16 pt-20 text-center lg:pt-24">
        <Sparkle size={22} className="mx-auto text-ink/40" />
        <h2 className="mx-auto mt-6 max-w-[760px] font-display text-[40px] font-semibold leading-[0.96] tracking-[-0.04em] text-ink sm:text-[62px] lg:text-[74px]">
          {tr("Your imagination deserves")}
          <br />
          <span className="relative inline-block font-serif italic">
            {tr("more than a template")}
            <Squiggle
              className="absolute -bottom-3 left-0 w-full text-ink/25"
              width={520}
            />
          </span>
          .
        </h2>
        <p className="mx-auto mt-8 max-w-[460px] text-[15px] leading-relaxed text-ink/70">
          {tr(
            "Start with one artwork and a name. In an afternoon you could have a place that finally feels like yours.",
          )}
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <MButton
            href="/auth/register"
            variant="ink"
            size="lg"
            className="w-full sm:w-auto"
          >
            {tr("Create your portfolio")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </MButton>
          <MButton
            href="/templates"
            variant="paper"
            size="lg"
            className="w-full sm:w-auto"
          >
            {tr("Browse templates")}
          </MButton>
        </div>
        <p className="mt-5 text-[11.5px] uppercase tracking-[0.2em] text-ink/45">
          {tr("Free plan · no card · takes minutes")}
        </p>
      </div>

      <div className="relative flex h-28 items-end gap-2 overflow-hidden px-4 sm:h-32">
        {STRIP.map((src, i) => (
          <div
            key={src + i}
            className="relative h-full flex-1 overflow-hidden rounded-t-xl border border-ink/15"
            style={{ transform: `translateY(${i % 2 === 0 ? 10 : 24}px)` }}
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </section>
  );
}
