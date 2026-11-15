"use client";
import PublishedWorks from "./PublishedWorks";
import { type Common, translator } from "../home/types";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { TEMPLATES, ARTISTS, CATEGORIES, WORKS } from "../home/data";
import { Sparkle, Sticker } from "../home/bits";
import { cn } from "../home/types";

const ROUTE_BY_ARTIST: Record<string,string> = {
  luna: "/demo/creative",
  theo: "/demo/showcase",
  mika: "/demo/story",
  nina: "/demo/gallery",
  june: "/templates",
  ito: "/templates",
};

export default function DiscoverGallery(props: Common) {
  const tr = translator(props);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const works = useMemo(() => {
    const q = query.trim().toLowerCase();
    return WORKS.filter((w) => {
      const matchesCategory = category === "All" || w.category === category;
      const matchesQuery =
        !q || w.title.toLowerCase().includes(q) || w.artist.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-12 lg:py-16">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-[380px]">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <input
            maxLength={120}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={tr("Search artworks or artists…")}
            placeholder={tr("Search artworks or artists…")}
            className="h-12 w-full rounded-full border border-ink/15 bg-ivory pl-11 pr-4 text-[14px] text-ink placeholder:text-ink/35 focus:border-ink/40 focus:outline-none"
          />
        </div>
        <p aria-live="polite" className="text-[11px] uppercase tracking-[0.18em] text-ink/55">
          {works.length} {tr("demo works")}
        </p>
      </div>

      <PublishedWorks key={query.trim()} query={query.trim()} lang={props.lang} />
      <h2 className="mt-12 font-display text-[24px] font-semibold">{tr("Demo portfolios")}</h2>
      <div className="no-scrollbar -mx-1 mt-6 flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-2 text-[12px] font-medium transition-all duration-300",
              category === c
                ? "border-ink bg-ink text-paper"
                : "border-ink/15 bg-ivory text-ink/60 hover:border-ink/40 hover:text-ink"
            )}
          >
            {tr(c)}
          </button>
        ))}
      </div>

      {works.length === 0 ? (
        <div className="mt-16 rounded-[1.5rem] border border-dashed border-ink/25 py-20 text-center">
          <Sparkle size={20} className="mx-auto text-lilac" />
          <p className="mt-4 font-display text-[20px] font-semibold">{tr("Nothing here yet")}</p>
          <p className="mt-1.5 text-[13.5px] text-ink/50">
            {tr("Try another category or a different spelling.")}
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("All");
            }}
            className="mt-5 rounded-full border border-ink/25 px-4 py-2 text-[12.5px] font-medium hover:border-ink/60"
          >
            {tr("Clear filters")}
          </button>
        </div>
      ) : (
        <div className="mt-6 columns-2 gap-4 lg:columns-3">
          {works.map((w) => (
            <a
              key={w.id}
              aria-label={w.title + " · " + w.artist}
              href={ROUTE_BY_ARTIST[w.artistId] || "/templates"}
              className="group mb-4 block break-inside-avoid overflow-hidden rounded-[1.2rem] border border-ink/10 bg-ivory"
            >
              <div className="relative overflow-hidden">
                <img
                  src={w.image}
                  alt={w.title}
                  className={cn(
                    "w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.04]",
                    w.tall ? "aspect-[3/4]" : "aspect-[4/3]"
                  )}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 translate-y-2 p-3.5 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <p className="font-display text-[15px] font-semibold text-paper">{w.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-paper/70">
                    {w.artist}
                    <ArrowUpRight className="h-3 w-3" />
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="truncate text-[11.5px] text-ink/55">{w.artist}</span>
                <span className="shrink-0 rounded-full border border-ink/12 px-2 py-[2px] text-[9px] uppercase tracking-wider text-ink/40">
                  {tr(w.category)}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}

      <div className="mt-16 border-t border-ink/10 pt-12">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[24px] font-semibold tracking-tight">{tr("Featured artists")}</h2>
          <Sticker tone="butter" className="hidden sm:inline-flex [transform:rotate(2deg)]">
            {tr("Demo portfolios")}
          </Sticker>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ARTISTS.map((a) => (
            <a
              key={a.id}
              href={`/demo/${a.template}`}
              className="group rounded-[1.3rem] border border-ink/10 bg-ivory p-4 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_40px_-32px_hsl(var(--ink)/0.6)]"
            >
              <div className="flex items-center gap-3">
                <span className={cn("grid h-9 w-9 place-items-center rounded-full text-[11px] font-semibold text-paper", a.accent, a.id === "nina" && "bg-ink")}>
                  {a.initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-[15px] font-semibold leading-none">{a.name}</p>
                  <p className="mt-1 text-[10.5px] uppercase tracking-[0.12em] text-ink/40">{tr(a.role)}</p>
                </div>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-ink/55">{tr(a.bio)}</p>
              <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
                <span className="text-[10.5px] text-ink/40">{TEMPLATES.find(t => t.id === a.template)?.name}</span>
                <span className="text-[11px] font-medium text-ink/60 group-hover:text-coral">{tr("Visit →")}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
