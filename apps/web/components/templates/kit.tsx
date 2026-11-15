import type { ReactNode } from "react";
import {
  contactHref,
  safeLink,
  type Art,
  type Block,
  type Draft,
  type Template,
} from "@studio/shared";
import { t, type Lang } from "../../lib/copy";

export type Gallery = Draft["galleries"][number];
export type Page = Draft["pages"][number];
export type Route =
  | { kind: "page"; page: Page }
  | { kind: "gallery"; gallery: Gallery }
  | { kind: "work"; art: Art };

export type PortfolioProps = {
  draft: Draft;
  site: string;
  base: string;
  path?: string[];
  /** Demonstration pages map asset IDs to bundled images. */
  demoImages?: Record<string, string>;
  brand?: string;
  /** Platform credit in footers; removed on paid plans. */
  branding?: boolean;
  /** Public pages route contact links through a counting redirect. */
  track?: boolean;
  selectBlock?: (id: string) => void;
  selected?: string;
};

/** Everything a template needs to render real content, without any I/O. */
export type Ctx = {
  d: Draft;
  l: Lang;
  route: Route;
  editing: boolean;
  brand: string;
  branding: boolean;
  year: number;
  arts: Map<string, Art>;
  galleries: Gallery[];
  featured: Art[];
  social: string[];
  footerSocial: string[];
  /** Outbound URL for commission contact i (tracked on public pages). */
  contactUrl: (i: number) => string;
  nav: { id: string; title: string; href: string; current: boolean }[];
  src: (a: Art, size?: "thumb" | "master") => string;
  href: (suffix: string) => string;
  galleryHref: (g: Gallery) => string;
  workHref: (a: Art) => string;
  homeHref: string;
  link: (url: string) => string | null;
  cover: (g: Gallery) => Art | undefined;
  works: (g: Gallery) => Art[];
  tr: (en: string, pt: string) => string;
};

export function matchRoute(d: Draft, path: string[]): Route | undefined {
  if (path.length === 2 && path[0] === "galleries") {
    const gallery = d.galleries.find((g) => g.slug === path[1] && g.visible);
    return gallery && { kind: "gallery", gallery };
  }
  if (path.length === 2 && path[0] === "works") {
    const art = d.artworks.find((a) => a.id === path[1]);
    return art && { kind: "work", art };
  }
  if (path.length > 1) return undefined;
  const page = d.pages.find((p) =>
    path.length ? p.slug === path[0] : p.id === d.home,
  );
  return page && { kind: "page", page };
}

export function context(
  {
    draft: d,
    site,
    base,
    demoImages,
    brand = "Muralia",
    branding = true,
    track = false,
    selectBlock,
  }: PortfolioProps,
  route: Route,
): Ctx {
  const l = d.language;
  const arts = new Map(d.artworks.map((a) => [a.id, a]));
  const href = (suffix: string) => (base + suffix || "/").replace(/^$/, "/");
  const homeHref = href("");
  const current = route.kind === "page" ? route.page.id : "";
  const galleries = d.galleries.filter((g) => g.visible);
  const social = d.social.filter((url) => safeLink.safeParse(url).success);
  return {
    d,
    l,
    route,
    editing: Boolean(selectBlock),
    brand,
    branding,
    year: new Date().getFullYear(),
    arts,
    galleries,
    featured: d.artworks.filter((a) => a.featured),
    social,
    footerSocial: d.theme.footerSocial ? social : [],
    contactUrl: (i) => {
      const c = d.commissions.contacts[i];
      return track ? href("/go/contact/" + i) : c ? contactHref(c) : "#";
    },
    nav: d.pages
      .filter((p) => p.inNav)
      .map((p) => ({
        id: p.id,
        title: p.title,
        href: href(p.id === d.home ? "" : "/" + p.slug),
        current: p.id === current,
      })),
    src: (a, size = "thumb") =>
      demoImages?.[a.assetId] ??
      "/api/media/" + site + "/" + a.assetId + "/" + size,
    href,
    homeHref,
    galleryHref: (g) => href("/galleries/" + g.slug),
    workHref: (a) => href("/works/" + a.id),
    link: (url) => (safeLink.safeParse(url).success ? url : null),
    cover: (g) => arts.get(g.cover ?? g.artIds[0] ?? ""),
    works: (g) => g.artIds.flatMap((id) => arts.get(id) ?? []),
    tr: (en, pt) => (l === "en" ? en : pt),
  };
}

/** Inline emphasis grammar shared by every template: **strong** and *em*. */
export function Inline({
  text,
  em = "",
  strong = "",
}: {
  text: string;
  em?: string;
  strong?: string;
}) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\n)/g).map((s, j) =>
        s === "\n" ? (
          <br key={j} />
        ) : s.startsWith("**") && s.endsWith("**") && s.length > 4 ? (
          <strong key={j} className={strong || undefined}>
            {s.slice(2, -2)}
          </strong>
        ) : s.startsWith("*") && s.endsWith("*") && s.length > 2 ? (
          <em key={j} className={em || undefined}>
            {s.slice(1, -1)}
          </em>
        ) : (
          s
        ),
      )}
    </>
  );
}

/** Paragraphs separated by blank lines, each with inline emphasis. */
export function Rich({
  text,
  className,
  em,
}: {
  text: string;
  className?: string;
  em?: string;
}) {
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .filter((p) => p.trim())
        .map((p, i) => (
          <p key={i} className={className}>
            <Inline text={p} em={em} />
          </p>
        ))}
    </>
  );
}

/** Plain text with the emphasis markers removed, for alt text and labels. */
export const plain = (text: string) => text.replace(/\*\*?([^*]+)\*\*?/g, "$1");

export const firstParagraph = (text: string) =>
  text.split(/\n\s*\n/)[0]?.trim() ?? "";
export const restParagraphs = (text: string) =>
  text.split(/\n\s*\n/).slice(1).join("\n\n");

export function Img({
  ctx,
  art,
  className,
  large = false,
}: {
  ctx: Ctx;
  art: Art;
  className?: string;
  large?: boolean;
}) {
  return (
    <img
      src={ctx.src(art, large ? "master" : "thumb")}
      alt={art.alt || art.title}
      loading={large ? "eager" : "lazy"}
      decoding="async"
      className={className}
    />
  );
}

export const pad = (n: number) => String(n).padStart(2, "0");

export const host = (url: string) => new URL(url).hostname.replace(/^www\./, "");

/** Section spacing scale chosen in the editor; templates multiply by it. */
export const spaceScale: Record<Block["spacing"], string> = {
  compact: "0.6",
  normal: "1",
  roomy: "1.45",
};

export type BlockRenderer = (b: Block, ctx: Ctx, index: number) => ReactNode;

export type TemplateDesign = {
  /** Original palette plus three alternates: page, text and raised surface. */
  palettes: Record<
    "original" | "warm" | "cool" | "noir",
    { bg: string; ink: string; surface: string }
  >;
  display: string;
  body: string;
  root: string;
  Shell: (p: { ctx: Ctx; children: ReactNode }) => ReactNode;
  block: BlockRenderer;
  GalleryPage: (p: { ctx: Ctx; gallery: Gallery }) => ReactNode;
  WorkPage: (p: { ctx: Ctx; art: Art }) => ReactNode;
  /** Background classes for the editor's tint and paper section options. */
  tint: string;
  paper: string;
};

export const templateAccent: Record<Template, string> = {
  gallery: "#b87358",
  creative: "#ff7868",
  showcase: "#e0a45c",
  story: "#c9a87c",
};

export const label = (l: Lang, key: Parameters<typeof t>[1]) => t(l, key);

/** Next and previous neighbours, wrapping around. */
export function neighbours<T>(list: T[], item: T) {
  const i = Math.max(0, list.indexOf(item));
  return {
    index: i,
    next: list[(i + 1) % list.length],
    prev: list[(i - 1 + list.length) % list.length],
  };
}
