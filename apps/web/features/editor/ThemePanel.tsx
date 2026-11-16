"use client";
import { templateNames, type Draft, type Features } from "@studio/shared";
import { t, type Lang } from "../../shared/lib/copy";
import { placeholderArt } from "../../shared/lib/placeholder";
import { templateAccent } from "../../entities/portfolio/templates/kit";
import { designs, fonts, presets } from "../../entities/portfolio/Portfolio";
import { AppearanceOptions, PlanBadge } from "../theme/AppearanceOptions";
import { Sparkle } from "../../shared/ui/bits";
import { cn } from "../../shared/lib/cn";

const SWATCHES = ["#ff7868", "#b6a0f6", "#a6e5cb", "#ffe5a0", "#272438"];
const label = "text-[9px] uppercase tracking-[0.18em] text-ink/35";
export const FONT_LABELS: Record<Exclude<Draft["theme"]["font"], "template">, string> = {
  serif: "Fraunces",
  sans: "Bricolage Grotesque",
  mono: "Monospace",
  editorial: "Instrument Serif",
  grotesk: "Archivo",
  storybook: "Cormorant Garamond",
};
const FONT_NAMES: Record<Draft["theme"]["template"], string> = {
  gallery: "Instrument Serif",
  creative: "Bricolage + Fraunces",
  showcase: "Archivo",
  story: "Cormorant Garamond",
};

/** Compact theme controls from the editor rail (EditorLeftRail.jsx). */
export function ThemePanel({
  d,
  l,
  edit,
  features,
}: {
  d: Draft;
  l: Lang;
  edit: (change: (x: Draft) => void, key?: string) => void;
  features: Features;
}) {
  const T = designs[d.theme.template];
  const swatches = [...new Set([templateAccent[d.theme.template], ...SWATCHES])];
  const set = <K extends keyof Draft["theme"]>(k: K, v: Draft["theme"][K]) =>
    edit((x) => {
      x.theme[k] = v;
    });
  return (
    <div>
      <p className={label}>{t(l, "template_")}</p>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        {templateNames.map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={d.theme.template === v}
            onClick={() =>
              edit((x) => {
                x.theme.template = v;
                x.theme.accent = templateAccent[v];
              })
            }
            className={cn(
              "overflow-hidden rounded-lg border text-left transition-all",
              d.theme.template === v ? "border-ink/50 ring-2 ring-coral/60" : "border-ink/10 hover:border-ink/35",
            )}
          >
            <img src={placeholderArt(l)} alt="" className="aspect-[4/3] w-full object-cover" />
            <span className="block px-1.5 py-1 text-[10px] font-medium capitalize">{v}</span>
          </button>
        ))}
      </div>

      <p className={cn(label, "mt-4")}>{t(l, "palette")}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {swatches.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={t(l, "accent") + " " + c}
            aria-pressed={d.theme.accent.toLowerCase() === c}
            onClick={() => set("accent", c)}
            className={cn(
              "h-6 w-6 rounded-full border border-ink/10 transition-transform hover:scale-110",
              d.theme.accent.toLowerCase() === c && "ring-2 ring-ink/60 ring-offset-2 ring-offset-ivory",
            )}
            style={{ backgroundColor: c }}
          />
        ))}
        <label
          title={t(l, "accent")}
          className="relative grid h-6 w-6 cursor-pointer place-items-center overflow-hidden rounded-full border border-dashed border-ink/30 text-[11px] text-ink/45 hover:border-ink/60"
          style={swatches.includes(d.theme.accent.toLowerCase()) ? undefined : { backgroundColor: d.theme.accent, borderStyle: "solid" }}
        >
          {swatches.includes(d.theme.accent.toLowerCase()) && "+"}
          <input
            type="color"
            value={d.theme.accent}
            aria-label={t(l, "accent")}
            onChange={(e) => edit((x) => void (x.theme.accent = e.target.value), "accent")}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>

      <p className={cn(label, "mt-4")}>{t(l, "surface")}</p>
      <div className="mt-1.5 grid grid-cols-4 gap-1">
        {(["original", "warm", "cool", "noir", "blush", "sage", "midnight"] as const).map((v) => {
          const c = v in presets ? presets[v as keyof typeof presets] : T.palettes[v as keyof typeof T.palettes];
          return (
          <button
            key={v}
            type="button"
            title={t(l, v)}
            aria-label={t(l, v)}
            aria-pressed={d.theme.palette === v}
            onClick={() => set("palette", v)}
            className={cn(
              "flex h-8 items-center justify-center gap-0.5 rounded-md border",
              d.theme.palette === v ? "border-ink/50 ring-1 ring-ink/30" : "border-ink/10 hover:border-ink/35",
            )}
            style={{ backgroundColor: c.bg }}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.ink }} />
            <span className="h-2.5 w-2.5 rounded-full border border-black/5" style={{ backgroundColor: c.surface }} />
          </button>
          );
        })}
      </div>
      <p className="mt-1 text-[9.5px] text-ink/35">
        {l === "en" ? "Blush, sage and midnight" : "Rosado, sálvia e meia-noite"}
        <PlanBadge l={l} need="more" features={features} />
      </p>

      <p className={cn(label, "mt-4")}>{t(l, "font")}</p>
      <div className="mt-1.5 space-y-1">
        {(["template", "serif", "sans", "mono", "editorial", "grotesk", "storybook"] as const).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={d.theme.font === f}
            onClick={() => set("font", f)}
            className={cn(
              "flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-left text-[10.5px]",
              d.theme.font === f ? "border-ink/40 bg-paper" : "border-ink/10 hover:border-ink/30",
            )}
          >
            <span style={{ fontFamily: f === "template" ? T.display : fonts[f] }}>
              {f === "template" ? FONT_NAMES[d.theme.template] : FONT_LABELS[f]}
              {["editorial", "grotesk", "storybook"].includes(f) && <PlanBadge l={l} need="more" features={features} />}
            </span>
            {d.theme.font === f && <Sparkle size={9} className="text-coral" />}
          </button>
        ))}
      </div>

      <p className={cn(label, "mt-4")}>{t(l, "nav")}</p>
      <Segmented
        value={d.theme.nav}
        options={(["split", "center", "stack"] as const).map((v) => [v, t(l, v)])}
        onChange={(v) => set("nav", v)}
      />

      <div className="mt-5 border-t border-ink/10 pt-4">
        <AppearanceOptions d={d} l={l} features={features} edit={edit} compact />
      </div>

      <p className={cn(label, "mt-4")}>{t(l, "publicLang")}</p>
      <Segmented
        value={d.language}
        options={[
          ["pt-BR", "Português"],
          ["en", "English"],
        ]}
        onChange={(v) => edit((x) => void (x.language = v))}
      />
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: (readonly [T, string])[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="mt-1.5 flex gap-1 rounded-full border border-ink/10 bg-ink/[0.04] p-1" role="radiogroup">
      {options.map(([k, v]) => (
        <button
          key={k}
          type="button"
          role="radio"
          aria-checked={value === k}
          onClick={() => onChange(k)}
          className={cn(
            "flex-1 truncate rounded-full px-1 py-1 text-[10px] font-medium transition-colors",
            value === k ? "bg-ink text-paper shadow-[0_2px_8px_-3px_hsl(var(--ink)/0.6)]" : "text-ink/45 hover:text-ink",
          )}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
