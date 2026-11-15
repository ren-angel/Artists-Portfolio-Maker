"use client";
import { type Common, translator } from "../home/types";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, Eye } from "lucide-react";
import MButton from "../home/MButton";
import { Sparkle, Sticker } from "../home/bits";
import { TEMPLATES } from "../home/data";
import { cn } from "../home/types";

export default function TemplateExplorer(props: Common) {
  const tr = translator(props);
  const [active, setActive] = useState(TEMPLATES[0].id);
  const tpl = TEMPLATES.find((t) => t.id === active) ?? TEMPLATES[0];

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-14 lg:py-20">
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto pb-2">
        {TEMPLATES.map((t, i) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={active === t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "group flex shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-300",
              active === t.id
                ? "border-ink bg-ink text-paper"
                : "border-ink/12 bg-ivory text-ink hover:border-ink/35"
            )}
          >
            <span className={cn("font-mono text-[10px]", active === t.id ? "text-coral" : "text-ink/35")}>
              0{i + 1}
            </span>
            <span>
              <span className="block font-display text-[15px] font-semibold leading-none">{t.name}</span>
              <span
                className={cn(
                  "mt-1 block text-[10.5px]",
                  active === t.id ? "text-paper/55" : "text-ink/40"
                )}
              >
                {tr(t.mood)}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="overflow-hidden rounded-[1.5rem] border border-ink/12 bg-ivory p-2.5 shadow-[0_40px_80px_-60px_hsl(var(--ink)/0.8)]">
          <div className="flex items-center gap-2 px-2 pb-2 pt-1">
            <span className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-coral/70" />
              <span className="h-2 w-2 rounded-full bg-butter" />
              <span className="h-2 w-2 rounded-full bg-mint" />
            </span>
            <span className="ml-2 font-mono text-[10px] text-ink/35">{tpl.artistHandle}.{props.domain}</span>
            <span className="ml-auto rounded-full border border-ink/12 px-2 py-[2px] text-[9px] uppercase tracking-widest text-ink/40">
              {tr("Demo preview")}
            </span>
          </div>
          <div className="relative overflow-hidden rounded-[1.1rem]">
            <img src={tpl.preview} alt={tpl.name + " · " + tr("Demo preview")} className="aspect-[16/11] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/15" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-3">
              <span className="font-display text-[13px] font-semibold tracking-tight text-paper">
                {tpl.artist}
              </span>
              <span className="hidden gap-4 text-[10px] uppercase tracking-[0.18em] text-paper/80 sm:flex">
                <span>{tr("work")}</span>
                <span>{tr("about")}</span>
                <span>{tr("contact")}</span>
              </span>
            </div>
            <div className="absolute inset-x-5 bottom-5 text-paper">
              <p className="font-serif text-[22px] italic leading-none sm:text-[28px]">{tr(tpl.tagline)}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-paper/70">
                {tpl.name} {tr("template")} · {tpl.artist}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-[1.5rem] border border-ink/12 bg-[#FBF6EE] p-6">
          <div>
            <div className="flex items-start justify-between">
              <h2 className="font-display text-[28px] font-semibold leading-none tracking-tight">
                {tpl.name}
              </h2>
              <Sticker tone="butter" className="[transform:rotate(3deg)]">
                {tr(tpl.mood)}
              </Sticker>
            </div>
            <p className="mt-4 text-[14px] leading-relaxed text-ink/60">{tr(tpl.description)}</p>

            <div className="mt-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink/40">{tr("Made for")}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tpl.bestFor.map((tag) => (
                  <span key={tr(tag)} className="rounded-full border border-ink/15 bg-paper px-2.5 py-1 text-[11px] text-ink/60">
                    {tr(tag)}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink/40">{tr("Palette")}</p>
                <div className="mt-2 flex gap-1.5">
                  {tpl.palette.map((c) => (
                    <span
                      key={c}
                      className="h-7 w-7 rounded-full border border-ink/12"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink/40">{tr("Example artist")}</p>
                <p className="mt-2 font-serif text-[15px] italic text-ink/70">{tpl.artist}</p>
              </div>
            </div>
          </div>

          <div className="mt-7 space-y-2">
            <MButton href={`/auth/register?template=${tpl.id}`} className="w-full">
              {tr("Use this template")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </MButton>
            <a
              href={tpl.href}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-ink/20 text-[13px] font-medium transition-colors hover:border-ink/60"
            >
              <Eye className="h-4 w-4" /> {tr("Preview the whole site")}
            </a>
          </div>
        </div>
      </div>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TEMPLATES.map((t) => (
          <a
            key={t.id}
            href={t.href}
            className="group rounded-[1.2rem] border border-ink/10 bg-ivory p-2.5 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_40px_-32px_hsl(var(--ink)/0.6)]"
          >
            <div className="overflow-hidden rounded-[0.9rem]">
              <img
                src={t.preview}
                alt={t.name}
                className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="flex items-center justify-between px-1.5 pb-1 pt-3">
              <div>
                <p className="font-display text-[15px] font-semibold leading-none">{t.name}</p>
                <p className="mt-1.5 text-[11px] text-ink/45">{tr(t.bestFor[0])}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-ink/35 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </a>
        ))}
      </div>

      <div className="mt-12 flex items-center justify-center gap-3">
        <Sparkle size={11} className="text-coral" />
        <p className="text-center text-[11px] uppercase tracking-[0.22em] text-ink/35">
          {tr("Swap templates any time · your pages and artwork stay put")}
        </p>
      </div>
    </div>
  );
}
