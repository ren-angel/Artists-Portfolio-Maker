import { type Common, translator } from "./types";
import MiniSite from "./MiniSite";
import { ART } from "./data";
import { Sparkle, Sticker, Tape } from "./bits";

/** Layered stack of miniature artist sites, the hero's visual anchor. */
export default function HeroCollage(props: Common) {
  const tr = translator(props);
  return (
    <div className="relative mx-auto h-[540px] w-full max-w-[520px]">
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-ink/12"
      />
      <div
        aria-hidden
        className="absolute left-[6%] top-[12%] h-1.5 w-1.5 rounded-full bg-coral"
      />
      <div
        aria-hidden
        className="absolute right-[8%] bottom-[26%] h-2 w-2 rounded-full bg-lilac"
      />
      <Sparkle
        aria-hidden
        size={14}
        className="absolute left-[26%] bottom-[10%] text-mint"
      />

      {/* main card */}
      <div className="pointer-events-none absolute right-0 top-0 w-[62%]">
        <div className="animate-float-slow [transform:rotate(-3.5deg)]">
          <MiniSite {...props} theme="creative" art={ART.lunaFanart} />
        </div>
        <Tape className="absolute -left-6 -top-3 [transform:rotate(-5deg)]">
          {tr("luna's universe")}
        </Tape>
      </div>

      {/* secondary cards */}
      <div className="pointer-events-none absolute bottom-[7%] left-0 w-[47%]">
        <div className="animate-float [transform:rotate(4deg)]">
          <MiniSite {...props} theme="showcase" art={ART.theoGate} />
        </div>
        <Sticker tone="mint" className="mt-3 [transform:rotate(-3deg)]">
          {tr("84 artworks ✦")}
        </Sticker>
      </div>

      <div className="pointer-events-none absolute bottom-[20%] right-[1%] w-[31%]">
        <div className="animate-float-slow [transform:rotate(-7deg)]">
          <MiniSite {...props} theme="story" art={ART.mikaComic} />
        </div>
      </div>
    </div>
  );
}
