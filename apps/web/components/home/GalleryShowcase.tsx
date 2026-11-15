import { type Common, translator } from "./types";
import { ArrowUpRight, Star } from "lucide-react";

import { Eyebrow, Sparkle, Sticker } from "./bits";
import { ART } from "./data";

const TILES = [
  {
    image: ART.lunaFanart,
    title: "Lantern Hour",
    meta: "Illustration · 2026",
    span: "sm:col-span-2 sm:row-span-2",
    tall: true,
  },
  {
    image: ART.theoGate,
    title: "The Gate at Dawn",
    meta: "Concept art · 2026",
    span: "",
    tall: false,
  },
  {
    image: ART.ninaArch,
    title: "Concrete Curve",
    meta: "Photography · 2025",
    span: "",
    tall: false,
  },
  {
    image: ART.mikaComic,
    title: "Night Ferry",
    meta: "Comic · Chapter 3",
    span: "sm:col-span-2",
    tall: false,
  },
];

export default function GalleryShowcase(props: Common) {
  const tr = translator(props);
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-20 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
        <div>
          <Eyebrow>{tr("Galleries & featured work")}</Eyebrow>
          <h2 className="mt-4 font-display text-[34px] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[44px]">
            {tr("Your best work,")}
            <span className="font-serif italic text-coral">
              {tr(" always up front.")}
            </span>
          </h2>
          <p className="mt-4 max-w-[360px] text-[15px] leading-relaxed text-ink/60">
            {tr(
              "Organise pieces into galleries, Fanart, Original Art, Sketchbook, whatever you call them. Then choose what greets visitors on your homepage.",
            )}
          </p>

          <div className="mt-7 space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-ink/10 bg-ivory px-4 py-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-butter">
                <Star className="h-3.5 w-3.5 fill-ink/70 text-ink/70" />
              </span>
              <p className="text-[13px] text-ink/65">
                <span className="font-medium text-ink">
                  {tr("Mark as featured")}
                </span>
                {tr(", one tap, front of the site.")}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-ink/10 bg-ivory px-4 py-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-mint">
                <Sparkle size={12} className="text-ink/70" />
              </span>
              <p className="text-[13px] text-ink/65">
                <span className="font-medium text-ink">
                  {tr("Custom galleries")}
                </span>
                {tr(", choose where each work belongs.")}
              </p>
            </div>
          </div>

          <a
            href="/explore"
            className="group mt-8 inline-flex items-center gap-2 text-[13.5px] font-medium text-ink underline decoration-coral decoration-2 underline-offset-4"
          >
            {tr("See it in real portfolios")}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>

        <div className="relative">
          <Sticker
            tone="lilac"
            className="absolute -top-3 right-4 z-10 [transform:rotate(3deg)]"
          >
            {tr("featured ✦")}
          </Sticker>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:auto-rows-[130px]">
            {TILES.map((tile) => (
              <figure
                key={tile.title}
                className={`group relative overflow-hidden rounded-xl border border-ink/10 bg-ivory ${tile.span}`}
              >
                <img
                  src={tile.image}
                  alt={tile.title}
                  className="h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <figcaption className="absolute inset-x-0 bottom-0 translate-y-2 p-3 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="font-display text-[13px] font-semibold text-paper">
                    {tile.title}
                  </p>
                  <p className="text-[10px] text-paper/70">{tr(tile.meta)}</p>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-3 text-right font-serif text-[13px] italic text-ink/40">
            {tr("every grid, arranged by you, never squeezed")}
          </p>
        </div>
      </div>
    </section>
  );
}
