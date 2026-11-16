"use client";
import { Lock } from "lucide-react";
import type { Draft, Features } from "@studio/shared";
import type { Lang } from "../../shared/lib/copy";
import { cn } from "../../shared/lib/cn";

/* Phase 2 appearance options. Every option can be tried in the draft; the
   badge says which plan publishes it, and the server applies only what the
   current plan includes, so nothing is lost when plans change. */

type Theme = Draft["theme"];
type Need = "more" | "advanced";
const rank = { basic: 0, more: 1, advanced: 2 };
export const allows = (f: Features, need: Need) => rank[f.appearance] >= rank[need];

export function PlanBadge({ l, need, features }: { l: Lang; need: Need; features: Features }) {
  if (allows(features, need)) return null;
  return (
    <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-lilac/40 px-1.5 py-[1px] align-middle text-[8.5px] font-semibold uppercase tracking-wider text-ink/70">
      <Lock className="h-2.5 w-2.5" /> {need === "more" ? (l === "en" ? "Artist" : "Artista") : l === "en" ? "Studio" : "Estúdio"}
    </span>
  );
}

function Seg<K extends keyof Theme>({
  l,
  k,
  label,
  need,
  options,
  d,
  set,
  features,
  compact,
}: {
  l: Lang;
  k: K;
  label: string;
  need: Need;
  options: [Theme[K], string][];
  d: Draft;
  set: (k: K, v: Theme[K]) => void;
  features: Features;
  compact?: boolean;
}) {
  return (
    <div>
      <p className={compact ? "text-[9px] uppercase tracking-[0.18em] text-ink/35" : "mb-1 text-[9.5px] uppercase tracking-[0.14em] text-ink/40"}>
        {label}
        <PlanBadge l={l} need={need} features={features} />
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1" role="radiogroup" aria-label={label}>
        {options.map(([v, text]) => (
          <button
            key={String(v)}
            type="button"
            role="radio"
            aria-checked={d.theme[k] === v}
            onClick={() => set(k, v)}
            className={cn(
              "rounded-full border px-2.5 py-1 font-medium transition-colors",
              compact ? "text-[10px]" : "text-[11.5px]",
              d.theme[k] === v ? "border-ink bg-ink text-paper" : "border-ink/12 text-ink/55 hover:border-ink/35 hover:text-ink",
            )}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AppearanceOptions({
  d,
  l,
  features,
  edit,
  compact = false,
}: {
  d: Draft;
  l: Lang;
  features: Features;
  edit: (change: (x: Draft) => void, key?: string) => void;
  compact?: boolean;
}) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const set = <K extends keyof Theme>(k: K, v: Theme[K]) => edit((x) => void (x.theme[k] = v));
  const common = { l, d, set, features, compact };
  const tpl = tr("Template", "Modelo");
  return (
    <div className={compact ? "space-y-4" : "space-y-4"}>
      <Seg {...common} k="radius" need="more" label={tr("Corners", "Cantos")} options={[["template", tpl], ["square", tr("Square", "Retos")], ["soft", tr("Soft", "Suaves")], ["round", tr("Round", "Redondos")]]} />
      <label className="block text-[11.5px]">
        <span className="flex justify-between gap-2">
          <span>{tr("Section spacing", "Espaçamento das seções")}<PlanBadge l={l} need="more" features={features} /></span>
          <span>{Math.round(d.theme.sectionScale * 100)}%</span>
        </span>
        <input type="range" min={65} max={150} step={5} value={Math.round(d.theme.sectionScale * 100)}
          aria-label={tr("Section spacing", "Espaçamento das seções")}
          onChange={e => set("sectionScale", Number(e.target.value)/100)} className="mt-2 w-full accent-coral" />
      </label>
      <label className="flex items-center gap-2 text-[11.5px]">
        <input type="checkbox" checked={d.theme.paperTexture} onChange={e => set("paperTexture", e.target.checked)} />
        {tr("Paper texture", "Textura de papel")}<PlanBadge l={l} need="more" features={features} />
      </label>
      <label className="flex items-center gap-2 text-[11.5px]">
        <input type="checkbox" checked={!features.removeBranding || d.theme.showBranding}
          disabled={!features.removeBranding} onChange={e => set("showBranding",e.target.checked)} />
        {tr("Show platform credit", "Exibir crédito da plataforma")}<PlanBadge l={l} need="more" features={features} />
      </label>
      <Seg {...common} k="shadow" need="more" label={tr("Shadows", "Sombras")} options={[["template", tpl], ["none", tr("None", "Nenhuma")], ["soft", tr("Soft", "Suave")], ["lifted", tr("Lifted", "Elevada")]]} />
      <Seg {...common} k="hover" need="more" label={tr("Hover effect", "Efeito ao passar")} options={[["template", tpl], ["none", tr("None", "Nenhum")], ["zoom", "Zoom"], ["lift", tr("Lift", "Elevar")]]} />
      <Seg
        {...common}
        k="aspect"
        need="more"
        label={tr("Artwork shape", "Formato das obras")}
        options={[["template", tpl], ["square", tr("Square", "Quadrado")], ["portrait", tr("Portrait", "Retrato")], ["landscape", tr("Landscape", "Paisagem")], ["original", tr("Original", "Original")]]}
      />
      <Seg {...common} k="grid" need="advanced" label={tr("Gallery grid", "Grade da galeria")} options={[["template", tpl], ["uniform", tr("Uniform", "Uniforme")], ["masonry", tr("Masonry", "Alvenaria")]]} />
      <div>
        <label className="block">
          <span className={compact ? "text-[9px] uppercase tracking-[0.18em] text-ink/35" : "mb-1 block text-[9.5px] uppercase tracking-[0.14em] text-ink/40"}>
            {tr("Footer note", "Texto do rodapé")}
            <PlanBadge l={l} need="more" features={features} />
          </span>
          <input
            value={d.theme.footerText}
            maxLength={200}
            placeholder={tr("e.g. All artwork © Luna Mori", "ex.: Todas as obras © Luna Mori")}
            onChange={(e) => edit((x) => void (x.theme.footerText = e.target.value), "footerText")}
            className="mt-1.5 w-full rounded-lg border border-ink/15 bg-paper px-2.5 py-1.5 text-[12px] focus:border-ink/50 focus:outline-none"
          />
        </label>
        <label className="mt-2 flex items-center gap-2 text-[11.5px] text-ink/60">
          <input type="checkbox" checked={d.theme.footerSocial} onChange={(e) => edit((x) => void (x.theme.footerSocial = e.target.checked))} className="h-3.5 w-3.5 accent-ink" />
          {tr("Show social links in the footer", "Mostrar redes sociais no rodapé")}
        </label>
      </div>
      {!allows(features, "more") && (
        <p className="rounded-lg bg-lilac/20 px-2.5 py-2 text-[10.5px] leading-relaxed text-ink/60">
          {tr("Try anything here in your draft. Options marked with a plan appear on your published site once you're on that plan.", "Experimente à vontade no rascunho. As opções marcadas com um plano aparecem no site publicado quando você estiver nele.")}
        </p>
      )}
    </div>
  );
}
