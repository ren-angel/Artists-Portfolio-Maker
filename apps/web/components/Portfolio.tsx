import type { CSSProperties, MouseEvent } from "react";
import type { Block, Draft, Template } from "@studio/shared";
import {
  context,
  matchRoute,
  spaceScale,
  type PortfolioProps,
  type TemplateDesign,
} from "./templates/kit";
import { gallery } from "./templates/Gallery";
import { creative } from "./templates/Creative";
import { showcase } from "./templates/Showcase";
import { story } from "./templates/Story";
import { commissionBlock, GridBlock } from "./templates/Commission";
import { cn } from "./home/types";

export const designs: Record<Template, TemplateDesign> = {
  gallery,
  creative,
  showcase,
  story,
};
export const fonts: Record<Exclude<Draft["theme"]["font"], "template">, string> = {
  serif: '"UI Fraunces", Georgia, serif',
  sans: '"UI Bricolage", ui-sans-serif, system-ui, sans-serif',
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
  editorial: '"UI Instrument", Georgia, serif',
  grotesk: '"UI Archivo", ui-sans-serif, sans-serif',
  storybook: '"UI Cormorant", Georgia, serif',
};
/** Palette presets available to every template (Artist and Studio plans). */
export const presets = {
  blush: { bg: "#FFF1F2", ink: "#3B2230", surface: "#FFFFFF" },
  sage: { bg: "#F1F5EE", ink: "#26352B", surface: "#FBFDF9" },
  midnight: { bg: "#11162A", ink: "#E8ECF8", surface: "#1A2140" },
};

/** Page, text and surface colors for a draft's template and palette. */
export function paletteOf(d: Draft) {
  return d.theme.palette in presets
    ? presets[d.theme.palette as keyof typeof presets]
    : designs[d.theme.template].palettes[d.theme.palette as keyof TemplateDesign["palettes"]];
}

export function matchPage(d: Draft, path: string[]) {
  const route = matchRoute(d, path);
  return route?.kind === "page"
    ? route.page
    : route?.kind === "gallery"
      ? route.gallery
      : route?.kind === "work"
        ? route.art
        : undefined;
}

type Props = PortfolioProps & {
  /** Editor-only label shown on hover and selection. */
  blockLabel?: (b: Block) => string;
  emptyLabel?: string;
};

/** Every template renders through here: public pages, private preview,
    demonstrations, the studio overview and the editor canvas. */
export function Portfolio(props: Props) {
  const { draft: d, path = [], selectBlock, selected, blockLabel } = props;
  const route = matchRoute(d, path);
  if (!route) return null;
  const T = designs[d.theme.template];
  const palette = paletteOf(d);
  const ctx = context(props, route);
  const editing = Boolean(selectBlock);
  const font = d.theme.font === "template" ? null : fonts[d.theme.font];
  const style = {
    "--pf-bg": palette.bg,
    "--pf-ink": palette.ink,
    "--pf-surface": palette.surface,
    "--accent": d.theme.accent,
    "--pf-display": font ?? T.display,
    "--pf-body": d.theme.font === "mono" ? fonts.mono : T.body,
    "--pf-overlay": palette.bg,
  } as CSSProperties;
  // Inside the editor, clicks select sections instead of following links.
  const stay = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) e.preventDefault();
  };
  return (
    <div
      lang={d.language}
      className={cn(
        "ui portfolio min-h-full",
        "pf-" + d.theme.template,
        "palette-" + d.theme.palette,
        T.root,
      )}
      style={style}
      data-radius={d.theme.radius}
      data-shadow={d.theme.shadow}
      data-hover={d.theme.hover}
      data-aspect={d.theme.aspect}
      onClickCapture={editing ? stay : undefined}
    >
      <T.Shell ctx={ctx}>
        {route.kind === "gallery" ? (
          <T.GalleryPage ctx={ctx} gallery={route.gallery} />
        ) : route.kind === "work" ? (
          <T.WorkPage ctx={ctx} art={route.art} />
        ) : (
          route.page.blocks
            .filter((b) => b.visible)
            .map((b, i) => {
              const grid = d.theme.grid !== "template" && (b.type === "featured" || b.type === "galleryGrid");
              const gallery = ctx.galleries.find((g) => g.id === b.galleryId);
              const content =
                commissionBlock(b, ctx) ??
                (grid ? (
                  <GridBlock
                    ctx={ctx}
                    b={b}
                    mode={d.theme.grid as "uniform" | "masonry"}
                    works={b.type === "featured" ? ctx.featured : gallery ? ctx.works(gallery) : []}
                  />
                ) : (
                  T.block(b, ctx, i)
                ));
              const backdrop = b.bgArtId ? ctx.arts.get(b.bgArtId) : undefined;
              if (!content && !editing) return null;
              const chosen = selected === b.id;
              return (
                <div
                  key={b.id}
                  data-block={b.id}
                  className={cn(
                    "pf-block relative",
                    backdrop && "isolate overflow-hidden",
                    b.background === "tint" && T.tint,
                    b.background === "paper" && T.paper,
                    editing && "group/block cursor-pointer",
                  )}
                  style={{ "--sy": spaceScale[b.spacing] } as CSSProperties}
                  onClick={
                    selectBlock
                      ? (e) => {
                          e.stopPropagation();
                          selectBlock(b.id);
                        }
                      : undefined
                  }
                >
                  {backdrop && (
                    <div aria-hidden="true" className="absolute inset-0 -z-10">
                      <img src={ctx.src(backdrop, "master")} alt="" className="h-full w-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-[color-mix(in_oklab,var(--pf-overlay)_82%,transparent)]" />
                    </div>
                  )}
                  {content ?? (
                    <div className="mx-auto my-6 max-w-[640px] rounded-[1.1rem] border border-dashed border-current/30 px-6 py-8 text-center text-[13px] opacity-60">
                      {props.emptyLabel}
                    </div>
                  )}
                  {editing && (
                    <>
                      <span
                        className={cn(
                          "pointer-events-none absolute inset-0 z-30 transition-all",
                          chosen
                            ? "ring-[3px] ring-coral ring-inset"
                            : "ring-transparent group-hover/block:ring-2 group-hover/block:ring-inset group-hover/block:ring-ink/25",
                        )}
                      />
                      <span
                        className={cn(
                          "pointer-events-none absolute left-4 top-1.5 z-30 rounded-full px-2.5 py-0.5 font-body text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-opacity",
                          chosen
                            ? "bg-coral"
                            : "bg-ink/60 opacity-0 group-hover/block:opacity-100",
                        )}
                      >
                        {blockLabel?.(b) ?? b.type}
                      </span>
                    </>
                  )}
                </div>
              );
            })
        )}
      </T.Shell>
    </div>
  );
}
