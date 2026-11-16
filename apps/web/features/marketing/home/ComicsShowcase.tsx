import { type Common, translator } from "./types";
import { ArrowRight, BookOpen } from "lucide-react";

import MButton from "./MButton";
import { Eyebrow, Sparkle, Sticker } from "../../../shared/ui/bits";
import { CHAPTERS, CHARACTERS } from "./data";
import { placeholderArt } from "../../../shared/lib/placeholder";

export default function ComicsShowcase(props: Common) {
  const tr = translator(props);
  return (
    <section className="u-grain relative overflow-hidden bg-ink text-paper">
      <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-lilac/25 blur-[80px]" />
      <div className="relative mx-auto max-w-[1240px] px-5 py-20 lg:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.05fr]">
          <div className="order-2 lg:order-1">
            <Eyebrow tone="paper">
              {tr("Comics & characters")}
            </Eyebrow>
            <h2 className="mt-4 font-display text-[34px] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[44px]">
              {tr("For stories that take")}
              <span className="font-serif italic text-coral">
                {tr(" more than one page.")}
              </span>
            </h2>
            <p className="mt-4 max-w-[400px] text-[15px] leading-relaxed text-paper/60">
              {tr(
                "Publish chapters with a proper reader, introduce your original characters with artbook profiles, and keep every project in one place.",
              )}
            </p>

            <div className="mt-8 space-y-2.5">
              {CHAPTERS.map((ch) => (
                <div
                  key={ch.id}
                  className="flex items-center gap-3 rounded-xl border border-paper/12 bg-paper/[0.05] px-3.5 py-2.5 transition-colors hover:bg-paper/[0.09]"
                >
                  <span className="font-mono text-[10px] text-coral">
                    {ch.number}
                  </span>
                  <span className="flex-1 truncate text-[13px] text-paper/80">
                    {tr(ch.title)}
                  </span>
                  <span className="text-[10px] text-paper/35">
                    {ch.pages}
                    {tr("p")}
                  </span>
                </div>
              ))}
            </div>

            <MButton href="/demo/story" variant="paper" className="mt-8">
              <BookOpen className="h-4 w-4" />
              {tr("Explore the Story template")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </MButton>
          </div>

          <div className="relative order-1 lg:order-2">
            <div className="flex gap-4">
              <div className="relative w-[62%] rotate-[-2deg] overflow-hidden rounded-xl border border-paper/15 shadow-[0_30px_60px_-30px_#000]">
                <img
                  src={placeholderArt(props.lang)}
                  alt="Comic page from Night Ferry"
                  className="w-full object-cover"
                />
              </div>
              <div className="flex w-[38%] flex-col gap-4 pt-8">
                <div className="overflow-hidden rounded-xl border border-paper/15 bg-paper/[0.06] p-2">
                  <img
                    src={placeholderArt(props.lang)}
                    alt="Character design sheet"
                    className="aspect-[3/4] w-full rounded-lg object-cover"
                  />
                  <p className="mt-2 text-center font-story text-[13px] italic text-paper/80">
                    {CHARACTERS[0].name}
                  </p>
                </div>
                <Sticker
                  tone="butter"
                  className="self-start [transform:rotate(-3deg)]"
                >
                  {tr("OC profiles")}
                </Sticker>
              </div>
            </div>
            <Sparkle
              size={18}
              className="absolute -left-4 bottom-2 text-lilac"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
