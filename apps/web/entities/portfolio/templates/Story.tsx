import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Rows, Square } from "lucide-react";
import type { Art, Block } from "@doodallery/shared";
import {
  Img,
  Inline,
  Rich,
  firstParagraph,
  host,
  neighbours,
  pad,
  plain,
  restParagraphs,
  type Ctx,
  type Gallery,
  type TemplateDesign,
} from "./kit";
import { cn } from "../../../shared/lib/cn";

/* Port of Design/src/routes/portfolio.story.index.jsx and
   portfolio.story.chapters.$chapterId.jsx: parchment, sepia ink, Cormorant
   Garamond, a book-cover opening and chapter-like rows. */

const W = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("mx-auto max-w-[1000px] px-5", className)}>{children}</div>
);
const sy = (rem: number) => ({ paddingBlock: `calc(${rem}rem * var(--sy, 1))` });
const caps = "text-[9.5px] uppercase tracking-[0.3em] text-pf-ink/45";
const panel = "border border-pf-ink/20 bg-pf-surface p-1.5";

function Header({ ctx }: { ctx: Ctx }) {
  const { route, d } = ctx;
  if (route.kind !== "page") {
    const g = route.kind === "gallery" ? route.gallery : ctx.galleries.find((v) => v.artIds.includes(route.art.id));
    const title = route.kind === "gallery" ? route.gallery.title : route.art.title;
    const index = g ? ctx.galleries.indexOf(g) : -1;
    return (
      <header className="sticky top-0 z-30 border-b border-pf-ink/15 bg-pf-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-[900px] items-center gap-3 px-4 py-3">
          <a
            href={route.kind === "work" && g ? ctx.galleryHref(g) : ctx.homeHref}
            className="inline-flex shrink-0 items-center gap-1.5 text-[9.5px] uppercase tracking-[0.18em] text-pf-ink/50 hover:text-pf-ink"
          >
            <ArrowLeft className="h-3 w-3" /> {route.kind === "work" && g ? g.title : d.title}
          </a>
          <div className="mx-auto min-w-0 text-center">
            <h1 className="truncate font-pf-display text-[16px] italic leading-none">
              {index >= 0 && route.kind === "gallery" ? pad(index + 1) + " · " : ""}
              {title}
            </h1>
            <p className="mt-1 text-[8px] uppercase tracking-[0.24em] text-pf-ink/35">
              {route.kind === "gallery"
                ? route.gallery.artIds.length + " " + ctx.tr("pages", "páginas")
                : d.title}
            </p>
          </div>
          {route.kind === "gallery" && route.gallery.artIds.length > 0 && (
            <nav aria-label={ctx.tr("Reading mode", "Modo de leitura")} className="flex shrink-0 rounded-full border border-pf-ink/20 p-0.5">
              {([
                [Rows, ctx.tr("Scroll", "Rolagem"), "", ctx.readerPage === undefined],
                [Square, ctx.tr("Single page", "Página individual"), "?page=1", ctx.readerPage !== undefined],
              ] as const).map(([Icon, label, suffix, active]) => (
                <a key={label} href={ctx.galleryHref(route.gallery) + suffix} title={label} aria-label={label}
                  aria-current={active ? "true" : undefined}
                  className={cn("grid h-7 w-8 place-items-center rounded-full", active && "bg-pf-ink text-pf-bg")}>
                  <Icon aria-hidden className="h-3.5 w-3.5" />
                </a>
              ))}
            </nav>
          )}
        </div>
      </header>
    );
  }
  const nav = d.theme.nav;
  return (
    <header className="border-b border-pf-ink/15">
      <div
        className={cn(
          "mx-auto flex max-w-[1000px] px-5 py-5",
          nav === "split" ? "items-center justify-between" : "flex-col gap-3",
          nav === "center" && "items-center",
        )}
      >
        <a href={ctx.homeHref} className="font-pf-display text-[24px] italic">
          {d.title}
        </a>
        <nav className="hidden flex-wrap items-center gap-7 text-[9.5px] uppercase tracking-[0.26em] text-pf-ink/60 csm:flex">
          {ctx.nav.map((p) => (
            <a key={p.id} href={p.href} aria-current={p.current ? "page" : undefined} className={cn("hover:text-pf-ink", p.current && "text-pf-ink")}>
              {p.title}
            </a>
          ))}
        </nav>
        {nav === "split" && <span className="text-[9px] uppercase tracking-[0.2em] text-pf-ink/35">{ctx.tr("Est.", "Desde")} {ctx.year}</span>}
      </div>
      {ctx.nav.length > 0 && (
        <div className="flex gap-5 overflow-x-auto border-t border-pf-ink/15 px-5 py-2.5 text-[8.5px] uppercase tracking-[0.2em] text-pf-ink/55 csm:hidden">
          {ctx.nav.map((p) => (
            <a key={p.id} href={p.href} className="shrink-0 hover:text-pf-ink">
              {p.title}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

function Footer({ ctx }: { ctx: Ctx }) {
  return (
    <footer className="border-t border-pf-ink/15">
      <W className="flex flex-wrap items-center justify-between gap-2 py-6 text-[9px] uppercase tracking-[0.2em] text-pf-ink/35">
        <span>
          © {ctx.year} {ctx.d.title}
        </span>
        <div className="flex flex-wrap gap-5">
          {ctx.footerSocial.map((url) => (
            <a key={url} href={url} rel="me noreferrer" className="hover:text-pf-ink/70">
              {host(url)}
            </a>
          ))}
          {ctx.d.theme.footerText && <span>{ctx.d.theme.footerText}</span>}
          <span>
            {ctx.tr("Made with", "Feito com")} {ctx.brand}
          </span>
        </div>
      </W>
    </footer>
  );
}

/** Numbered chapter list: each gallery reads like a chapter. */
function Chapters({ ctx, list }: { ctx: Ctx; list: Gallery[] }) {
  return (
    <div className="mt-5 divide-y divide-pf-ink/15 border-y border-pf-ink/15">
      {list.map((g) => (
        <a key={g.id} href={ctx.galleryHref(g)} className="group flex items-center gap-4 py-4 transition-colors hover:bg-pf-ink/[0.03]">
          <span className="w-8 font-pf-display text-[18px] text-pf-ink/45">{pad(ctx.galleries.indexOf(g) + 1)}</span>
          <div className="min-w-0 flex-1">
            <p className="font-pf-display text-[19px] leading-snug">{g.title}</p>
            <p className="mt-0.5 truncate text-[9.5px] uppercase tracking-[0.18em] text-pf-ink/35">
              {g.artIds.length} {ctx.tr("pages", "páginas")}
              {g.description ? " · " + g.description : ""}
            </p>
          </div>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-pf-ink/30 transition-transform group-hover:translate-x-1 group-hover:text-pf-ink/70" />
        </a>
      ))}
    </div>
  );
}

function Panels({ ctx, works, cols = 3 }: { ctx: Ctx; works: Art[]; cols?: number }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", cols === 3 ? "csm:grid-cols-3" : "csm:grid-cols-4")}>
      {works.map((w) => (
        <a key={w.id} href={ctx.workHref(w)} className={cn(panel, "group block transition-colors hover:border-pf-ink/45")}>
          <Img ctx={ctx} art={w} className="aspect-[3/4] w-full object-cover" />
          <p className="truncate px-1 pt-1.5 text-center font-pf-display text-[13px] italic text-pf-ink/55">{w.title}</p>
        </a>
      ))}
    </div>
  );
}

function Band({ children, paper, id }: { children: ReactNode; paper?: boolean; id?: string }) {
  return (
    <section id={id} className={cn("scroll-mt-8", paper && "border-y border-pf-ink/15 bg-pf-surface/50")}>
      {children}
    </section>
  );
}

function block(b: Block, ctx: Ctx): ReactNode {
  const a = b.artId ? ctx.arts.get(b.artId) : undefined;
  const g = ctx.galleries.find((v) => v.id === b.galleryId);
  const link = ctx.link(b.url);
  const flip = b.layout === "right";
  switch (b.type) {
    case "hero": {
      const first = ctx.galleries[0];
      const begin = link ?? (first ? ctx.galleryHref(first) : null);
      return (
        <W>
          <section style={sy(3.5)} className={cn("grid items-center gap-10 csm:gap-14", a && (flip ? "csm:grid-cols-[1fr_1.05fr]" : "csm:grid-cols-[1.05fr_1fr]"))}>
            <div className={cn(flip && "csm:order-2", b.layout === "center" && !a && "mx-auto max-w-[620px] text-center")}>
              {ctx.d.description && <p className={cn(caps, "line-clamp-2")}>{ctx.d.description}</p>}
              <h1 className="mt-4 whitespace-pre-line font-pf-display text-[54px] leading-[0.92] [overflow-wrap:anywhere] csm:text-[78px]">
                <Inline text={b.heading || ctx.d.title} em="italic" />
              </h1>
              {b.text && (
                <p className={cn("mt-4 max-w-[400px] font-pf-display text-[20px] italic leading-[1.5] text-pf-ink/75", b.layout === "center" && !a && "mx-auto")}>
                  <Inline text={firstParagraph(b.text)} />
                </p>
              )}
              {restParagraphs(b.text) && (
                <div className={cn("mt-5 max-w-[400px] space-y-3", b.layout === "center" && !a && "mx-auto")}>
                  <Rich text={restParagraphs(b.text)} className="text-[12.5px] leading-[1.9] text-pf-ink/65" />
                </div>
              )}
              <div className={cn("mt-7 flex flex-wrap items-center gap-3", b.layout === "center" && !a && "justify-center")}>
                {begin && (
                  <a href={begin} className="inline-flex items-center gap-2 rounded-full bg-pf-ink px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-pf-bg transition-transform hover:-translate-y-0.5">
                    <BookOpen className="h-3.5 w-3.5" /> {ctx.tr("Start reading", "Começar a ler")}
                  </a>
                )}
                {ctx.galleries.length > 0 && (
                  <a href="#chapters" className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-pf-ink/55 hover:text-pf-ink">
                    {ctx.tr("All chapters", "Todos os capítulos")} <ArrowRight className="h-3 w-3" />
                  </a>
                )}
              </div>
              <p className="mt-6 text-[9px] uppercase tracking-[0.22em] text-pf-ink/35">
                {ctx.galleries.length} {ctx.tr("chapters", "capítulos")} · {ctx.d.artworks.length} {ctx.tr("pages", "páginas")}
              </p>
            </div>
            {a && (
              <div className={cn("relative", flip && "csm:order-1")}>
                <div className="relative rotate-[1.5deg] border border-pf-ink/25 bg-pf-surface p-2.5 shadow-[0_24px_50px_-30px_rgba(107,84,66,0.6)]">
                  <Img ctx={ctx} art={a} large className="aspect-[3/4] w-full object-cover" />
                  <div className="mt-2 flex items-baseline justify-between gap-3 px-1">
                    <span className="truncate font-pf-display text-[13px] italic text-pf-ink/70">{a.title}</span>
                    <span className="shrink-0 text-[8px] uppercase tracking-[0.2em] text-pf-ink/35">
                      {ctx.d.title.split(" ").at(-1)} · {ctx.year}
                    </span>
                  </div>
                </div>
                <span className="absolute -left-4 -top-3 rotate-[-6deg] border border-pf-ink/20 bg-pf-accent/40 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] backdrop-blur-[1px]">
                  {ctx.galleries.find((v) => v.artIds.includes(a.id))?.title ?? ctx.tr("cover", "capa")}
                </span>
              </div>
            )}
          </section>
        </W>
      );
    }
    case "galleryPreview": {
      const list = b.galleryId ? ctx.galleries.filter((v) => v.id === b.galleryId) : ctx.galleries;
      if (!list.length) return null;
      return (
        <Band paper id="chapters">
          <W>
            <div style={sy(3)}>
              <div className="flex items-baseline justify-between">
                <h2 className="font-pf-display text-[28px]">
                  <Inline text={b.heading || ctx.tr("Chapters", "Capítulos")} em="italic" />
                </h2>
                <span className="text-[9px] uppercase tracking-[0.22em] text-pf-ink/35">
                  {pad(list.length)} {ctx.tr("published", "publicados")}
                </span>
              </div>
              <Chapters ctx={ctx} list={list} />
            </div>
          </W>
        </Band>
      );
    }
    case "featured": {
      if (!ctx.featured.length) return null;
      const three = ctx.featured.length <= 3;
      return (
        <W>
          <section style={sy(3)}>
            {b.heading && (
              <h2 className="mb-5 font-pf-display text-[28px]">
                <Inline text={b.heading} em="italic" />
              </h2>
            )}
            {three ? (
              <div className="flex gap-3">
                {ctx.featured.map((w) => (
                  <a key={w.id} href={ctx.workHref(w)} className={cn(panel, "flex-1 transition-colors hover:border-pf-ink/45")}>
                    <Img ctx={ctx} art={w} className="aspect-[3/4] w-full object-cover" />
                  </a>
                ))}
              </div>
            ) : (
              <Panels ctx={ctx} works={ctx.featured} cols={ctx.featured.length >= 8 ? 4 : 3} />
            )}
            <p className="mt-3 text-center font-pf-display text-[14px] italic text-pf-ink/50">
              {b.text ? <Inline text={plain(firstParagraph(b.text))} /> : "“" + ctx.featured.map((w) => w.title).slice(0, 3).join(", ") + "”"}
            </p>
          </section>
        </W>
      );
    }
    case "galleryGrid": {
      if (!g) return null;
      const works = ctx.works(g);
      return (
        <Band paper>
          <W>
            <div style={sy(3)}>
              <div className="mb-5 flex items-baseline justify-between">
                <h2 className="font-pf-display text-[28px]">
                  <Inline text={b.heading || g.title} em="italic" />
                </h2>
                <a href={ctx.galleryHref(g)} className="text-[9px] uppercase tracking-[0.22em] text-pf-ink/45 hover:text-pf-ink">
                  {ctx.tr("Read", "Ler")} →
                </a>
              </div>
              <Panels ctx={ctx} works={works} />
            </div>
          </W>
        </Band>
      );
    }
    case "about":
      return (
        <W>
          <section id="about" className="scroll-mt-8" style={sy(3.5)}>
            <div className={cn("grid gap-8 csm:gap-14", a && (flip ? "csm:grid-cols-[0.7fr_1fr]" : "csm:grid-cols-[1fr_0.7fr]"))}>
              <div className={cn(flip && "csm:order-2")}>
                <p className="text-[9px] uppercase tracking-[0.3em] text-pf-ink/40">{ctx.tr("About the author", "Sobre quem cria")}</p>
                {b.heading && (
                  <h2 className="mt-3 font-pf-display text-[30px] leading-[1.15]">
                    <Inline text={b.heading} em="italic" />
                  </h2>
                )}
                <div className="mt-4 max-w-[460px] space-y-3">
                  <Rich text={b.text} className="text-[12.5px] leading-[1.95] text-pf-ink/70" />
                </div>
                <p className="mt-6 font-pf-display text-[22px] italic text-pf-ink/60">- {ctx.d.title.split(" ")[0]}</p>
              </div>
              {a && (
                <div className={cn(panel, "self-start", flip && "csm:order-1")}>
                  <Img ctx={ctx} art={a} className="aspect-[4/5] w-full object-cover" />
                </div>
              )}
            </div>
          </section>
        </W>
      );
    case "image":
      return (
        a && (
          <W>
            <figure style={sy(3)} className={cn(b.layout === "center" && "mx-auto max-w-[680px]")}>
              <div className={panel}>
                <Img ctx={ctx} art={a} large className="w-full object-cover" />
              </div>
              <figcaption className="mt-3 text-center font-pf-display text-[14px] italic text-pf-ink/50">
                {b.text ? <Inline text={plain(b.text)} /> : a.title}
              </figcaption>
            </figure>
          </W>
        )
      );
    case "heading":
      return (
        <W>
          <div style={sy(2)} className="flex items-baseline justify-between gap-4">
            <h2 className="font-pf-display text-[28px]">
              <Inline text={b.heading} em="italic" />
            </h2>
            {b.text && <span className="text-[9px] uppercase tracking-[0.22em] text-pf-ink/35">{plain(b.text)}</span>}
          </div>
        </W>
      );
    case "richText":
      return (
        <W>
          <section style={sy(2.5)} className={cn(b.layout === "center" && "text-center", b.layout === "right" && "flex justify-end")}>
            <div className={cn("max-w-[560px]", b.layout === "center" && "mx-auto")}>
              {b.heading && (
                <h2 className="mb-4 font-pf-display text-[30px] leading-[1.15]">
                  <Inline text={b.heading} em="italic" />
                </h2>
              )}
              <div className="space-y-4">
                <Rich text={b.text} className={b.layout === "center" ? "font-pf-display text-[20px] italic leading-[1.5] text-pf-ink/75" : "text-[12.5px] leading-[1.95] text-pf-ink/70"} />
              </div>
            </div>
          </section>
        </W>
      );
    case "cta":
    case "contact": {
      if (b.type === "cta" && !link) return null;
      return (
        <Band paper={b.background === "none"}>
          <W className="text-center">
            <div style={sy(3.5)}>
              <p className="text-[9px] uppercase tracking-[0.3em] text-pf-ink/40">{b.type === "contact" ? ctx.tr("Write to me", "Escreva para mim") : ctx.tr("Read on", "Continue lendo")}</p>
              <h2 className="mx-auto mt-3 max-w-[640px] font-pf-display text-[30px] leading-[1.15] csm:text-[38px]">
                <Inline text={b.heading || ctx.d.title} em="italic" />
              </h2>
              {b.text && (
                <div className="mx-auto mt-3 max-w-[460px] space-y-3">
                  <Rich text={b.text} className="text-[12.5px] leading-[1.9] text-pf-ink/65" />
                </div>
              )}
              {link && (
                <a href={link} rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full bg-pf-ink px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-pf-bg transition-transform hover:-translate-y-0.5">
                  {b.type === "contact" ? ctx.linkLabel(b.url) : ctx.tr("Continue", "Continuar")} <ArrowRight className="h-3 w-3" />
                </a>
              )}
            </div>
          </W>
        </Band>
      );
    }
    case "social":
      if (!ctx.social.length) return null;
      return (
        <W>
          <section style={sy(2)} className="flex flex-wrap items-baseline justify-center gap-x-7 gap-y-2 text-center">
            {b.heading && <h2 className="w-full font-pf-display text-[22px] italic">{plain(b.heading)}</h2>}
            {ctx.social.map((url) => (
              <a key={url} href={url} rel="me noreferrer" className="text-[9.5px] uppercase tracking-[0.26em] text-pf-ink/55 hover:text-pf-ink">
                {host(url)}
              </a>
            ))}
          </section>
        </W>
      );
    case "divider":
      return (
        <W>
          <div style={sy(1.5)} className="flex items-center gap-4 text-pf-ink/35">
            <span className="h-px flex-1 bg-pf-ink/15" />
            <span className="font-pf-display text-[18px] italic">❦</span>
            <span className="h-px flex-1 bg-pf-ink/15" />
          </div>
        </W>
      );
  }
}

function ChapterNav({ ctx, gallery }: { ctx: Ctx; gallery: Gallery }) {
  const i = ctx.galleries.indexOf(gallery);
  const prev = ctx.galleries[i - 1];
  const next = ctx.galleries[i + 1];
  const dim = "text-[10px] uppercase tracking-[0.18em] text-pf-ink/25";
  const link = "group flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-pf-ink/50 hover:text-pf-ink";
  return (
    <div className="flex flex-col gap-2 border-t border-pf-ink/15 pt-5 csm:flex-row csm:items-center csm:justify-between">
      {prev ? (
        <a href={ctx.galleryHref(prev)} className={link}>
          <ArrowLeft className="h-3 w-3" /> {pad(i)} · {prev.title}
        </a>
      ) : (
        <span className={dim}>{ctx.tr("First chapter", "Primeiro capítulo")}</span>
      )}
      {next ? (
        <a href={ctx.galleryHref(next)} className={cn(link, "text-right csm:justify-end")}>
          {pad(i + 2)} · {next.title} <ArrowRight className="h-3 w-3" />
        </a>
      ) : (
        <span className={dim}>{ctx.tr("More soon", "Em breve")}</span>
      )}
    </div>
  );
}

function GalleryPage({ ctx, gallery }: { ctx: Ctx; gallery: Gallery }) {
  const works = ctx.works(gallery);
  const page = ctx.readerPage && works.length ? Math.min(ctx.readerPage, works.length) : null;
  const visible = page ? works.slice(page - 1, page) : works;
  const pageButton = "rounded-full border border-pf-ink/25 px-3 py-2 text-[10px] uppercase tracking-wider";
  return (
    <div className="bg-pf-ink/[0.025]">
      <div className="mx-auto max-w-[720px] px-3 py-6 csm:px-5">
        {gallery.description && (
          <p className="mb-6 text-center font-pf-display text-[18px] italic leading-relaxed text-pf-ink/65">{gallery.description}</p>
        )}
        <div className="space-y-3">
          {visible.map((w, i) => (
            <figure key={w.id} className="border border-pf-ink/15 bg-pf-surface p-1.5">
              <a href={ctx.workHref(w)}>
                <Img ctx={ctx} art={w} large={i === 0} className="w-full object-cover" />
              </a>
              <figcaption className="py-1 text-center font-pf-display text-[11px] text-pf-ink/35">
                {page ?? i + 1} · {w.title}
              </figcaption>
            </figure>
          ))}
          {page !== null && <nav className="flex items-center justify-between" aria-label={ctx.tr("Chapter pages", "Páginas do capítulo")}>
            {page > 1 ? <a className={pageButton} href={ctx.galleryHref(gallery) + "?page=" + (page - 1)}>{ctx.tr("Previous", "Anterior")}</a>
              : <span aria-disabled="true" className={cn(pageButton, "opacity-35")}>{ctx.tr("Previous", "Anterior")}</span>}
            <span className="font-pf-display italic">{page} / {works.length}</span>
            {page < works.length ? <a className={pageButton} href={ctx.galleryHref(gallery) + "?page=" + (page + 1)}>{ctx.tr("Next", "Próxima")}</a>
              : <span aria-disabled="true" className={cn(pageButton, "opacity-35")}>{ctx.tr("Next", "Próxima")}</span>}
          </nav>}
          {works.length === 0 && (
            <p className="py-10 text-center font-pf-display text-[16px] italic text-pf-ink/50">
              {ctx.tr("No pages in this chapter yet.", "Este capítulo ainda não tem páginas.")}
            </p>
          )}
        </div>
      </div>
      <nav className="mx-auto max-w-[720px] px-4 pb-14 pt-6">
        <ChapterNav ctx={ctx} gallery={gallery} />
        <p className="mt-8 text-center font-pf-display text-[12px] italic text-pf-ink/35">{ctx.tr("thank you for reading", "obrigado pela leitura")}</p>
      </nav>
    </div>
  );
}

function WorkPage({ ctx, art }: { ctx: Ctx; art: Art }) {
  const g = ctx.galleries.find((v) => v.artIds.includes(art.id));
  const list = g ? ctx.works(g) : ctx.d.artworks;
  const { next, prev, index } = neighbours(list, art);
  const button = "flex items-center gap-1.5 rounded-full border border-pf-ink/25 px-3 py-2 text-[10px] uppercase tracking-[0.16em] hover:border-pf-ink/50";
  return (
    <div className="bg-pf-ink/[0.025]">
      <div className="mx-auto flex max-w-[820px] flex-col px-3 py-6 csm:px-5">
        <div className="border border-pf-ink/15 bg-pf-surface p-1.5">
          <Img ctx={ctx} art={art} large className="w-full object-contain" />
        </div>
        {list.length > 1 && (
          <div className="mt-3 flex items-center justify-between">
            <a href={ctx.workHref(prev)} className={button}>
              <ArrowLeft className="h-3 w-3" /> {ctx.tr("Previous", "Anterior")}
            </a>
            <span className="font-pf-display text-[13px] italic">
              {index + 1} / {list.length}
            </span>
            <a href={ctx.workHref(next)} className={button}>
              {ctx.tr("Next", "Próxima")} <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        )}
        <div className="mx-auto mt-10 max-w-[560px] text-center">
          <p className="font-pf-display text-[34px] leading-[1.1]">{art.title}</p>
          {art.description && (
            <div className="mt-3 space-y-3">
              <Rich text={art.description} className="text-[12.5px] leading-[1.95] text-pf-ink/70" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const story: TemplateDesign = {
  palettes: {
    original: { bg: "#F8F0E3", ink: "#6B5442", surface: "#FFFBF3" },
    warm: { bg: "#F6E8D4", ink: "#5E4532", surface: "#FCF3E6" },
    cool: { bg: "#EEF0EA", ink: "#3F4A45", surface: "#F8F9F5" },
    noir: { bg: "#231C17", ink: "#EADCC7", surface: "#2E2620" },
  },
  display: '"UI Cormorant", Georgia, serif',
  body: '"UI DM Sans", system-ui, sans-serif',
  root: "bg-pf-bg text-pf-ink",
  tint: "bg-pf-accent/15",
  paper: "bg-pf-surface/60",
  Shell: ({ ctx, children }) => (
    <>
      <Header ctx={ctx} />
      <main>{children}</main>
      <Footer ctx={ctx} />
    </>
  ),
  block,
  GalleryPage,
  WorkPage,
};
