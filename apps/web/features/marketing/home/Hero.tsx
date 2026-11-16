import { type Common, translator } from "./types";
import { ArrowRight, Sparkles } from "lucide-react";
import MButton from "./MButton";
import MiniSite from "./MiniSite";
import HeroCollage from "./HeroCollage";
import { Sparkle, Squiggle } from "../../../shared/ui/bits";

const PROOF = ["Free to start", "No code, ever", "Built for Brazilian artists"];

export default function Hero(props: Common) {
  const tr = translator(props);
  return (
    <section className="u-grain relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-[380px] w-[380px] rounded-full bg-lilac/20 blur-[100px]" />
        <div className="absolute -right-24 top-16 h-[420px] w-[420px] rounded-full bg-mint/20 blur-[110px]" />
        <div className="absolute bottom-0 left-1/4 h-[300px] w-[300px] rounded-full bg-butter/30 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-[1240px] px-5 pb-12 pt-10 lg:pb-16 lg:pt-14">
        <div className="grid items-center gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:gap-8">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-ivory/70 px-3.5 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.2em] text-ink/60 backdrop-blur">
              <Sparkles className="h-3 w-3 text-coral" />
              {tr("A portfolio builder for artists")}
            </span>

            <h1 className="mt-6 font-display text-[44px] font-semibold leading-[0.92] tracking-[-0.04em] text-ink sm:text-[60px] lg:text-[70px]">
              {tr("Your art deserves")}
              <br />
              {tr("its own")}{" "}
              <span className="relative inline-block font-serif italic tracking-[-0.015em] text-coral">
                {tr("little universe")}
                <Squiggle
                  className="absolute -bottom-1.5 left-0 w-full text-lilac"
                  width={250}
                />
              </span>
              <span className="text-coral">.</span>
            </h1>

            <p className="mt-7 max-w-[470px] text-[15px] leading-[1.75] text-ink/60 sm:text-[16.5px]">
              {tr(
                "Create a portfolio that's as unique as your imagination. No code, no complicated tools, just your art, your style, and your very own space on the internet.",
              )}
            </p>

            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <MButton
                href="/auth/register"
                size="lg"
                className="w-full sm:w-auto"
              >
                {tr("Create your portfolio")}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </MButton>
              <MButton
                href="/templates"
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto"
              >
                {tr("Explore templates")}
              </MButton>
            </div>

            <ul className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11.5px] text-ink/45">
              {PROOF.map((item, i) => (
                <li key={tr(item)} className="flex items-center gap-4">
                  {i > 0 && <span className="h-1 w-1 rounded-full bg-ink/20" />}
                  {tr(item)}
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden sm:block">
            <HeroCollage {...props} />
          </div>
        </div>

        {/* floating mini portfolios, mobile */}
        <div className="no-scrollbar mt-10 flex gap-3 overflow-x-auto pb-2 sm:hidden">
          <MiniSite
            {...props}
            theme="creative"
            className="w-[190px] shrink-0"
          />
          <MiniSite
            {...props}
            theme="showcase"
            className="w-[190px] shrink-0"
          />
          <MiniSite
            {...props}
            theme="gallery"
            className="w-[190px] shrink-0"
          />
          <MiniSite
            {...props}
            theme="story"
            className="w-[190px] shrink-0"
          />
        </div>

        <div className="mt-12 flex items-center justify-center gap-3 lg:mt-16">
          <Sparkle size={12} className="text-coral" />
          <p className="text-center text-[10.5px] uppercase tracking-[0.3em] text-ink/35">
            {tr("Four templates · endless ways to make them yours")}
          </p>
          <Sparkle size={12} className="text-lilac" />
        </div>
      </div>
    </section>
  );
}
