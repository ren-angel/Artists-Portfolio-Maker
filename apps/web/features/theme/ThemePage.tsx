"use client";
import { Check, LayoutTemplate, Palette, Type } from "lucide-react";
import { templateNames, type Draft, type Features } from "@studio/shared";
import { t, type Lang } from "../../shared/lib/copy";
import type { Update } from "../studio/use-draft";
import { templatePreview } from "../../entities/portfolio/demo";
import { templateAccent } from "../../entities/portfolio/templates/kit";
import { designs, fonts, presets } from "../../entities/portfolio/Portfolio";
import { AppearanceOptions, PlanBadge } from "./AppearanceOptions";
import { FONT_LABELS } from "../editor/ThemePanel";
import { Sparkle } from "../../shared/ui/bits";
import { cn } from "../../shared/lib/cn";
import { Segmented } from "../editor/ThemePanel";
import { inkPill, PageHeader } from "../../shared/ui/studio-kit";
import { ScaledPortfolio } from "../studio/ScaledPortfolio";

/* Port of Design/src/routes/dashboard.theme.jsx. The reference's mock preview
   becomes the real draft; corner-radius and texture sliders are not part of
   the theme model, so title, description and navigation take their place. */

const section = "rounded-[1.1rem] border border-ink/10 bg-ivory p-4";
const heading = "flex items-center gap-2 font-display text-[13px] font-semibold tracking-tight";
const field = "w-full rounded-lg border border-ink/12 bg-paper px-2.5 py-1.5 text-[12px] focus:border-ink/40 focus:outline-none";
const small = "mb-1 block text-[9.5px] uppercase tracking-[0.14em] text-ink/35";
const PAIRS: Record<Draft["theme"]["template"], string> = {
  gallery: "Instrument Serif + DM Sans",
  creative: "Bricolage + DM Sans",
  showcase: "Archivo + DM Sans",
  story: "Cormorant + DM Sans",
};

export function ThemePage({
  d,
  update,
  l,
  site,
  brand,
  onSave,
  features,
  onUpgrade,
}: {
  d: Draft;
  update: Update;
  l: Lang;
  site: string;
  brand: string;
  onSave: () => void;
  features: Features;
  onUpgrade: () => void;
}) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const T = designs[d.theme.template];
  const set = <K extends keyof Draft["theme"]>(k: K, v: Draft["theme"][K]) => update((x) => void (x.theme[k] = v));
  const name = (v: string) => v[0].toUpperCase() + v.slice(1);
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={tr("Design", "Design")}
        title={tr("Theme & appearance", "Tema e aparência")}
        subtitle={tr(
          "The look of your whole portfolio lives here. Change a colour or a typeface once and every page updates with it.",
          "A aparência de todo o portfólio mora aqui. Mude uma cor ou uma fonte uma vez e todas as páginas acompanham.",
        )}
        actions={
          <button type="button" onClick={onSave} className={inkPill}>
            {tr("Save theme", "Salvar tema")}
          </button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <section className={section}>
            <h3 className={heading}>
              <Palette className="h-3.5 w-3.5 text-ink/35" /> {t(l, "palette")}
            </h3>
            <div className="mt-3 space-y-1.5" role="radiogroup">
              {(["original", "warm", "cool", "noir", "blush", "sage", "midnight"] as const).map((p) => {
                const c = p in presets ? presets[p as keyof typeof presets] : T.palettes[p as keyof typeof T.palettes];
                return (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={d.theme.palette === p}
                    onClick={() => set("palette", p)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
                      d.theme.palette === p ? "border-ink/45 bg-paper" : "border-transparent hover:bg-paper/60",
                    )}
                  >
                    <span className="flex -space-x-1.5">
                      {[c.bg, d.theme.accent, c.ink].map((v, i) => (
                        <span key={i} className="h-5 w-5 rounded-full border border-ink/10" style={{ backgroundColor: v }} />
                      ))}
                    </span>
                    <span className="flex-1 text-[12px]">
                      {p in presets ? { blush: tr("Blush", "Rosado"), sage: tr("Sage", "Sálvia"), midnight: tr("Midnight", "Meia-noite") }[p as keyof typeof presets] : t(l, p as "original")}
                      {p in presets && <PlanBadge l={l} need="more" features={features} />}
                    </span>
                    {d.theme.palette === p && <Check className="h-3.5 w-3.5 text-coral" />}
                  </button>
                );
              })}
            </div>
            <label className="mt-2.5 flex cursor-pointer items-center gap-2 text-[11px] text-ink/50 hover:text-ink">
              <span className="relative h-5 w-5 overflow-hidden rounded-full border border-ink/15" style={{ backgroundColor: d.theme.accent }}>
                <input
                  type="color"
                  value={d.theme.accent}
                  onChange={(e) => set("accent", e.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label={t(l, "accent")}
                />
              </span>
              <span className="underline decoration-ink/20 underline-offset-4">{t(l, "accent")}</span>
              <span className="font-mono text-[10px] text-ink/35">{d.theme.accent}</span>
              {d.theme.accent.toLowerCase() !== templateAccent[d.theme.template] && (
                <button type="button" onClick={() => set("accent", templateAccent[d.theme.template])} className="ml-auto text-[10.5px] text-ink/40 hover:text-ink">
                  {tr("Reset", "Restaurar")}
                </button>
              )}
            </label>
          </section>

          <section className={section}>
            <h3 className={heading}>
              <Type className="h-3.5 w-3.5 text-ink/35" /> {tr("Typography", "Tipografia")}
            </h3>
            <div className="mt-3 space-y-1.5" role="radiogroup">
              {(["template", "serif", "sans", "mono", "editorial", "grotesk", "storybook"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={d.theme.font === f}
                  onClick={() => set("font", f)}
                  className={cn(
                    "w-full rounded-lg border px-2.5 py-2 text-left transition-colors",
                    d.theme.font === f ? "border-ink/45 bg-paper" : "border-transparent hover:bg-paper/60",
                  )}
                >
                  <span className="block text-[14px]" style={{ fontFamily: f === "template" ? T.display : fonts[f] }}>
                    {f === "template" ? PAIRS[d.theme.template] : FONT_LABELS[f]}
                    {["editorial", "grotesk", "storybook"].includes(f) && <PlanBadge l={l} need="more" features={features} />}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-ink/40">
                    {tr("The quick brown fox jumps over the lazy dog.", "A rápida raposa marrom pula sobre o cão preguiçoso.")}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className={section}>
            <h3 className={heading}>{tr("Shape, effects & footer", "Forma, efeitos e rodapé")}</h3>
            <div className="mt-3">
              <AppearanceOptions d={d} l={l} features={features} edit={(fn) => update(fn)} />
            </div>
            {features.appearance !== "advanced" && (
              <button type="button" onClick={onUpgrade} className="mt-3 text-[11px] text-ink/50 underline decoration-ink/20 underline-offset-4 hover:text-ink">
                {tr("Compare plans", "Comparar planos")}
              </button>
            )}
          </section>

          <section className={section}>
            <h3 className={heading}>
              <LayoutTemplate className="h-3.5 w-3.5 text-ink/35" /> {tr("Site details", "Detalhes do site")}
            </h3>
            <div className="mt-3 space-y-3">
              <label className="block">
                <span className={small}>{t(l, "title")}</span>
                <input value={d.title} maxLength={120} onChange={(e) => update((x) => void (x.title = e.target.value))} className={field} />
              </label>
              <label className="block">
                <span className={small}>{t(l, "description")}</span>
                <textarea
                  rows={2}
                  value={d.description}
                  maxLength={320}
                  onChange={(e) => update((x) => void (x.description = e.target.value))}
                  className={cn(field, "resize-y leading-relaxed")}
                />
              </label>
              <div>
                <span className={small}>{t(l, "nav")}</span>
                <Segmented value={d.theme.nav} options={(["split", "center", "stack"] as const).map((v) => [v, t(l, v)])} onChange={(v) => set("nav", v)} />
              </div>
              <div>
                <span className={small}>{t(l, "publicLang")}</span>
                <Segmented
                  value={d.language}
                  options={[
                    ["pt-BR", "Português"],
                    ["en", "English"],
                  ]}
                  onChange={(v) => update((x) => void (x.language = v))}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-ink/35">
              <Sparkle size={9} /> {tr("Live preview", "Prévia ao vivo")}
            </p>
            <span className="text-[10.5px] text-ink/30">
              {name(d.theme.template)} {tr("template", "modelo")}
            </span>
          </div>
          <div className="overflow-hidden rounded-[1.2rem] border border-ink/12 bg-ivory p-2.5">
            <ScaledPortfolio branding={!features.removeBranding} draft={d} site={site} brand={brand} className="max-h-[620px] overflow-y-auto overflow-x-hidden rounded-[0.9rem]" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label={t(l, "template_")}>
            {templateNames.map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={d.theme.template === v}
                aria-label={v}
                onClick={() =>
                  update((x) => {
                    x.theme.template = v;
                    x.theme.accent = templateAccent[v];
                  })
                }
                className={cn("rounded-lg border p-1.5 text-left transition-all", d.theme.template === v ? "border-ink bg-paper" : "border-ink/10 hover:border-ink/35")}
              >
                <img src={templatePreview[v]} alt="" className="h-12 w-full rounded object-cover" />
                <span className="mt-1 block px-0.5 text-[10.5px] font-medium">{name(v)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
