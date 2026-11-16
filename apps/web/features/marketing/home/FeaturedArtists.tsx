import { type Common, translator } from "./types";
import { ArrowUpRight } from "lucide-react";

import { ARTISTS } from "./data";
import { Eyebrow, Sparkle, Sticker } from "../../../shared/ui/bits";
import { cn } from "./types";
import { placeholderArt } from "../../../shared/lib/placeholder";

const LAYOUT = [
  "lg:col-span-5 lg:mt-0",
  "lg:col-span-4 lg:mt-16",
  "lg:col-span-3 lg:mt-6",
  "lg:col-span-4 lg:col-start-7 lg:-mt-8",
];

export default function FeaturedArtists(props: Common) {
  const tr = translator(props);
  return (
    <section
      id="artists"
      className="relative mx-auto max-w-[1240px] px-5 py-20 lg:py-28"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-[560px]">
          <Eyebrow>{tr("Demo portfolios")}</Eyebrow>
          <h2 className="mt-4 font-display text-[34px] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[46px]">
            {tr("Four artists. Four completely")}
            <span className="font-serif italic text-coral">
              {tr(" different worlds.")}
            </span>
          </h2>
        </div>
        <p className="max-w-[300px] text-[14.5px] leading-relaxed text-ink/55">
          {tr(
            "Same builder, wildly different results. Every portfolio below is a real Muralia template you can start from today.",
          )}
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-12">
        {ARTISTS.map((artist, i) => (
          <a
            key={artist.id}
            href={`/demo/${artist.template}`}
            className={cn(
              "group relative block overflow-hidden rounded-[1.6rem] border border-ink/10 bg-ivory transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-40px_hsl(var(--ink)/0.65)]",
              LAYOUT[i],
            )}
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <img
                src={placeholderArt(props.lang)}
                alt={tr("Artwork by") + " " + artist.name}
                className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
              />
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />

              <div className="absolute inset-x-4 bottom-4 text-paper">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "grid h-6 w-6 place-items-center rounded-full text-[9px] font-bold text-paper",
                      artist.accent,
                      artist.id === "nina" && "bg-ink",
                    )}
                  >
                    {artist.initials}
                  </span>
                  <span className="rounded-full bg-paper/15 px-2 py-[3px] text-[9px] uppercase tracking-[0.16em] backdrop-blur">
                    {tr(artist.role)}
                  </span>
                </div>
                <h3 className="mt-2.5 font-display text-[24px] font-semibold leading-none tracking-tight">
                  {artist.name}
                </h3>
                <p className="mt-1.5 text-[12px] text-paper/70">
                  {tr(artist.specialties)}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-coral">
                  {tr("Visit portfolio")}
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>

              <Sticker
                tone="butter"
                className="absolute right-3 top-3 [transform:rotate(4deg)]"
              >
                {artist.works}
                {tr(" works")}
              </Sticker>
            </div>
          </a>
        ))}

        <div className="relative hidden rounded-[1.6rem] border border-dashed border-ink/25 p-7 lg:col-span-4 lg:block">
          <Sparkle size={20} className="text-lilac" />
          <p className="mt-4 font-serif text-[24px] italic leading-snug text-ink/80">
            {tr("“Make a little corner of the internet your own.”")}
          </p>
          <p className="mt-4 text-[13px] leading-relaxed text-ink/50">
            {tr(
              "Your portfolio doesn't have to look like anyone else's. Start from a template, then bend every colour, corner and caption until it feels like you.",
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
