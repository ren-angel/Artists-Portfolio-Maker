"use client";
import type { ReactNode } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Eye,
  EyeOff,
  Image as ImageIcon,
  LayoutGrid,
  Link2,
  Minus,
  Share2,
  Trash2,
  Type,
  X,
} from "lucide-react";
import type { Block, Draft } from "@studio/shared";
import { t } from "../../../lib/copy";
import { designs } from "../../Portfolio";
import { Sparkle } from "../../home/bits";
import { cn } from "../../home/types";
import { blockName, takesArt, takesGallery, takesLink } from "./blocks";
import { Segmented } from "./ThemePanel";
import type { EditorProps } from "./Editor";

export const fieldLabel = "mb-1 block text-[9.5px] uppercase tracking-[0.14em] text-ink/40";
export const inputClass =
  "w-full rounded-lg border border-ink/15 bg-paper px-2.5 py-2 text-[12px] leading-snug focus:border-ink/50 focus:outline-none";

export function Properties({
  d,
  l,
  site,
  block,
  page,
  mode,
  setMode,
  patch,
  update,
  onRemove,
  onPick,
  onClose,
  onExit,
}: EditorProps & {
  block: Block | null;
  page: Draft["pages"][number];
  mode: "simple" | "advanced";
  setMode: (m: "simple" | "advanced") => void;
  patch: (v: Partial<Block>, key?: string) => void;
  onRemove: (id: string) => void;
  onPick: () => void;
  onClose: () => void;
}) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const T = designs[d.theme.template];
  const palette = T.palettes[d.theme.palette];
  const thumb = (assetId: string) => "/api/media/" + site + "/" + assetId + "/thumb";
  const Icon = !block
    ? ImageIcon
    : takesArt(block.type)
      ? ImageIcon
      : takesGallery(block.type) || block.type === "featured"
        ? LayoutGrid
        : block.type === "divider"
          ? Minus
          : block.type === "social"
            ? Share2
            : block.type === "cta" || block.type === "contact"
              ? Link2
              : Type;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-ink/10 px-3 py-2.5">
        <div className="flex flex-1 items-center gap-1 rounded-full border border-ink/10 bg-ink/[0.04] p-1" role="radiogroup">
          {(["simple", "advanced"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 rounded-full py-1.5 text-[10.5px] font-medium transition-colors",
                mode === m ? "bg-ink text-paper shadow-[0_2px_8px_-3px_hsl(var(--ink)/0.6)]" : "text-ink/45 hover:text-ink",
              )}
            >
              {t(l, m)}
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} aria-label={t(l, "cancel")} className="grid h-7 w-7 place-items-center rounded-full text-ink/45 hover:text-ink xl:hidden">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {!block ? (
          <div className="relative mt-10 overflow-hidden rounded-[1.1rem] border border-dashed border-ink/20 bg-paper/60 px-4 py-9 text-center">
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(hsl(var(--ink)/0.07)_1px,transparent_1px)] [background-size:12px_12px]" />
            <span className="relative mx-auto grid h-10 w-10 -rotate-6 place-items-center rounded-xl border border-ink/20 bg-ivory">
              <Sparkle size={14} className="text-coral" />
            </span>
            <p className="relative mt-3 font-display text-[13px] font-semibold">{t(l, "nothingSelected")}</p>
            <p className="relative mt-1.5 text-[11px] leading-relaxed text-ink/45">{t(l, "selectHint")}</p>
          </div>
        ) : (
          <div className="space-y-4" key={block.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] uppercase tracking-[0.18em] text-ink/35">{t(l, "editing")}</p>
                <p className="mt-0.5 font-display text-[14px] font-semibold">{blockName(l, block.type)}</p>
              </div>
              <span className="grid h-7 w-7 place-items-center rounded-md bg-coral/15">
                <Icon className="h-3.5 w-3.5 text-coral" />
              </span>
            </div>

            {mode === "simple" ? (
              <>
                {block.type !== "divider" && (
                  <Field label={block.type === "hero" ? t(l, "headline") : block.type === "cta" ? tr("Statement", "Chamada") : t(l, "title")}>
                    <textarea
                      value={block.heading}
                      maxLength={160}
                      rows={block.type === "hero" ? 2 : 1}
                      onChange={(e) => patch({ heading: e.target.value }, "heading")}
                      className={cn(inputClass, "resize-none")}
                    />
                  </Field>
                )}

                {["hero", "richText", "about", "contact", "cta", "featured", "galleryGrid"].includes(block.type) && (
                  <Field label={block.type === "hero" ? t(l, "introText") : t(l, "body")}>
                    <textarea
                      value={block.text}
                      maxLength={10000}
                      rows={block.type === "richText" || block.type === "about" ? 6 : 3}
                      onChange={(e) => patch({ text: e.target.value }, "text")}
                      className={cn(inputClass, "resize-y text-[11.5px] leading-relaxed")}
                    />
                    <span className="mt-1 block text-[9.5px] text-ink/35">{t(l, "tip")}</span>
                  </Field>
                )}
                {["heading", "image"].includes(block.type) && (
                  <Field label={block.type === "image" ? tr("Caption", "Legenda") : tr("Small note", "Nota curta")}>
                    <input value={block.text} maxLength={300} onChange={(e) => patch({ text: e.target.value }, "text")} className={inputClass} />
                  </Field>
                )}

                {!["divider", "featured", "galleryGrid", "galleryPreview", "social"].includes(block.type) && (
                  <Field label={t(l, "layout")} group>
                    <div className="flex gap-1" role="radiogroup">
                      {([
                        ["left", AlignLeft],
                        ["center", AlignCenter],
                        ["right", AlignRight],
                      ] as const).map(([v, I]) => (
                        <button
                          key={v}
                          type="button"
                          role="radio"
                          aria-checked={block.layout === v}
                          aria-label={t(l, v)}
                          title={t(l, v)}
                          onClick={() => patch({ layout: v })}
                          className={cn(
                            "grid h-8 flex-1 place-items-center rounded-md border",
                            block.layout === v ? "border-ink/40 bg-paper" : "border-ink/12 text-ink/40 hover:text-ink",
                          )}
                        >
                          <I className="h-3.5 w-3.5" />
                        </button>
                      ))}
                    </div>
                  </Field>
                )}

                {takesArt(block.type) && (
                  <Field label={t(l, "art")} group>
                    {d.artworks.length ? (
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          ...(block.artId ? d.artworks.filter((a) => a.id === block.artId) : []),
                          ...d.artworks.filter((a) => a.id !== block.artId),
                        ]
                          .slice(0, 3)
                          .map((a) => (
                            <button
                              key={a.id}
                              type="button"
                              title={a.title}
                              aria-pressed={a.id === block.artId}
                              onClick={() => patch({ artId: a.id === block.artId ? null : a.id })}
                              className={cn(
                                "overflow-hidden rounded-md",
                                a.id === block.artId ? "ring-2 ring-coral ring-offset-1" : "opacity-70 hover:opacity-100",
                              )}
                            >
                              <img src={thumb(a.assetId)} alt={a.alt || a.title} className="aspect-square w-full object-cover" />
                            </button>
                          ))}
                      </div>
                    ) : (
                      <p className="rounded-md border border-dashed border-ink/20 px-2 py-3 text-center text-[10.5px] text-ink/40">{t(l, "noArtYet")}</p>
                    )}
                    <button
                      type="button"
                      onClick={onPick}
                      className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-md border border-ink/15 py-1.5 text-[10.5px] text-ink/55 hover:border-ink/40 hover:text-ink"
                    >
                      <Link2 className="h-3 w-3" /> {t(l, "fromLibrary")}
                    </button>
                  </Field>
                )}

                {takesGallery(block.type) && (
                  <Field label={t(l, "galleries")} group>
                    <div className="space-y-1">
                      {block.type === "galleryPreview" && (
                        <Choice active={!block.galleryId} onClick={() => patch({ galleryId: null })}>
                          {t(l, "chooseGallery")}
                        </Choice>
                      )}
                      {d.galleries.map((g) => (
                        <Choice key={g.id} active={block.galleryId === g.id} onClick={() => patch({ galleryId: g.id })}>
                          <span className="flex-1 truncate">{g.title}</span>
                          <span className="text-[9.5px] text-ink/35">{g.artIds.length}</span>
                        </Choice>
                      ))}
                      {d.galleries.length === 0 && (
                        <button type="button" onClick={() => onExit("galleries")} className="w-full rounded-md border border-dashed border-ink/20 px-2 py-3 text-[10.5px] text-ink/45 hover:text-ink">
                          {tr("Create a gallery first", "Crie uma galeria primeiro")} →
                        </button>
                      )}
                    </div>
                  </Field>
                )}

                {block.type === "featured" && (
                  <p className="rounded-lg bg-butter/40 px-2.5 py-2 text-[10.5px] leading-relaxed text-ink/60">
                    {d.artworks.filter((a) => a.featured).length} {t(l, "works")} ·{" "}
                    {tr("Mark works as featured in the ", "Marque obras como destaque na ")}
                    <button type="button" onClick={() => onExit("library")} className="underline underline-offset-2 hover:text-ink">
                      {t(l, "library").toLowerCase()}
                    </button>
                    .
                  </p>
                )}

                {block.type === "social" && (
                  <Field label={t(l, "social")}>
                    <textarea
                      rows={3}
                      value={d.social.join("\n")}
                      maxLength={5000}
                      placeholder="https://instagram.com/…"
                      onChange={(e) =>
                        update((x) => {
                          x.social = e.target.value ? e.target.value.split("\n") : [];
                        })
                      }
                      className={cn(inputClass, "resize-y font-mono text-[10.5px]")}
                    />
                  </Field>
                )}

                {takesLink(block.type) && (
                  <Field label={block.type === "hero" ? t(l, "buttonLink") : t(l, "link")}>
                    <input
                      type="url"
                      inputMode="url"
                      value={block.url}
                      maxLength={500}
                      placeholder="https://"
                      onChange={(e) => patch({ url: e.target.value }, "url")}
                      className={cn(inputClass, "font-mono text-[11px]")}
                    />
                  </Field>
                )}

                {block.type !== "divider" && (
                  <Field label={t(l, "background")} group>
                    <div className="flex gap-1.5" role="radiogroup">
                      {([
                        ["none", palette.bg],
                        ["tint", `color-mix(in oklab, ${d.theme.accent} 22%, ${palette.bg})`],
                        ["paper", palette.surface],
                      ] as const).map(([v, c]) => (
                        <button
                          key={v}
                          type="button"
                          role="radio"
                          aria-checked={block.background === v}
                          aria-label={t(l, v)}
                          title={t(l, v)}
                          onClick={() => patch({ background: v })}
                          className={cn(
                            "h-7 w-7 rounded-full border border-ink/10 transition-transform hover:scale-110",
                            block.background === v && "ring-2 ring-ink/60 ring-offset-2 ring-offset-ivory",
                          )}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  </Field>
                )}
              </>
            ) : (
              <div className="space-y-3 rounded-lg border border-ink/10 bg-paper/60 p-2.5">
                <button type="button" onClick={() => patch({ visible: !block.visible })} className="flex w-full items-center justify-between">
                  <span className="text-[10.5px] text-ink/60">{t(l, "visibleOnSite")}</span>
                  <span className={cn("flex items-center gap-1 text-[10px]", block.visible ? "text-[#3d9b78]" : "text-coral")}>
                    {block.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {block.visible ? tr("on", "sim") : tr("off", "não")}
                  </span>
                </button>
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[9.5px] uppercase tracking-[0.14em] text-ink/40">{t(l, "spacing")}</p>
                    <span className="font-mono text-[9px] text-ink/35">{t(l, block.spacing)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={1}
                    aria-label={t(l, "spacing")}
                    value={["compact", "normal", "roomy"].indexOf(block.spacing)}
                    onChange={(e) => patch({ spacing: (["compact", "normal", "roomy"] as const)[+e.target.value] })}
                    className="mt-2 w-full accent-ink"
                  />
                </div>
                <div>
                  <p className="mb-1 text-[9.5px] uppercase tracking-[0.14em] text-ink/40">{t(l, "background")}</p>
                  <Segmented
                    value={block.background}
                    options={(["none", "tint", "paper"] as const).map((v) => [v, t(l, v)])}
                    onChange={(v) => patch({ background: v })}
                  />
                </div>
                <p className="text-[9.5px] leading-relaxed text-ink/35">{t(l, "advancedHint")}</p>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-ink/10 pt-3 text-[10px] text-ink/35">
              <button type="button" onClick={() => onRemove(block.id)} className="inline-flex items-center gap-1 hover:text-coral">
                <Trash2 className="h-3 w-3" /> {t(l, "removeSection")}
              </button>
              <span>
                {page.blocks.indexOf(block) + 1} / {page.blocks.length}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children, group = false }: { label: string; children: ReactNode; group?: boolean }) {
  return group ? (
    <div role="group" aria-label={label}>
      <span className={fieldLabel}>{label}</span>
      {children}
    </div>
  ) : (
    <label className="block">
      <span className={fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-[11px]",
        active ? "border-coral bg-coral/10" : "border-ink/10 hover:border-ink/30",
      )}
    >
      {children}
    </button>
  );
}
