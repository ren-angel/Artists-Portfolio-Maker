import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { detailLabel } from "../artwork-details";
import { artworkDetailKeys, type Art, type Block } from "@studio/shared";
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

/* Port of Design/src/routes/portfolio.gallery.index.jsx and
   portfolio.gallery.works.$workId.jsx: ivory exhibition wall, Instrument
   Serif, generous margins and quiet uppercase captions. */

const W = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("mx-auto max-w-[1180px] px-6", className)}>{children}</div>
);
const caps = "text-[9.5px] uppercase tracking-[0.22em] text-pf-ink/40";
const sy = (rem: number) => ({ paddingBlock: `calc(${rem}rem * var(--sy, 1))` });

function Header({ ctx }: { ctx: Ctx }) {
  const { d, route } = ctx;
  const nav = d.theme.nav;
  if (route.kind === "work") {
    const list = workList(ctx, route.art);
    const { index } = neighbours(list, route.art);
    return (
      <header className="border-b border-pf-ink/10">
        <W className="flex items-center justify-between py-5">
          <a
            href={ctx.homeHref}
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-pf-ink/50 hover:text-pf-ink"
          >
            <ArrowLeft className="h-3 w-3" /> {ctx.tr("All work", "Todas as obras")}
          </a>
          <span className="hidden font-pf-display text-[15px] uppercase tracking-[0.2em] csm:block">
            {d.title}
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-pf-ink/30">
            {pad(index + 1)} / {pad(list.length)}
          </span>
        </W>
      </header>
    );
  }
  return (
    <header className="sticky top-0 z-40 border-b border-pf-ink/10 bg-pf-bg/92 backdrop-blur">
      <W
        className={cn(
          "flex py-5",
          nav === "split" && "items-center justify-between",
          nav === "center" && "flex-col items-center gap-3",
          nav === "stack" && "flex-col items-start gap-3",
        )}
      >
        <a href={ctx.homeHref} className="font-pf-display text-[16px] uppercase tracking-[0.2em]">
          {d.title}
        </a>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[9.5px] uppercase tracking-[0.24em] text-pf-ink/55 csm:gap-x-9 csm:text-[10px]">
          {ctx.nav.map((p) => (
            <a
              key={p.id}
              href={p.href}
              aria-current={p.current ? "page" : undefined}
              className={cn("transition-colors hover:text-pf-ink", p.current && "text-pf-ink")}
            >
              {p.title}
            </a>
          ))}
        </nav>
        {nav === "split" && (
          <span className="hidden text-[10px] uppercase tracking-[0.2em] text-pf-ink/35 csm:block">
            {d.language === "en" ? "EN" : "BR"} · {ctx.year}
          </span>
        )}
      </W>
    </header>
  );
}

function Footer({ ctx }: { ctx: Ctx }) {
  return (
    <footer className="border-t border-pf-ink/12">
      <W className="py-14">
        <div className="grid gap-8 csm:grid-cols-[1.2fr_1fr] csm:items-end">
          <div>
            <p className="text-[9.5px] uppercase tracking-[0.28em] text-pf-ink/35">
              {ctx.tr("Portfolio", "Portfólio")}
            </p>
            <a
              href={ctx.homeHref}
              className="mt-3 inline-block font-pf-display text-[28px] leading-none tracking-tight underline decoration-pf-ink/25 decoration-1 underline-offset-[6px] transition-colors hover:decoration-pf-ink csm:text-[38px]"
            >
              {ctx.d.title}
            </a>
          </div>
          {ctx.footerSocial.length > 0 && (
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-[10px] uppercase tracking-[0.2em] text-pf-ink/45 csm:justify-end">
              {ctx.footerSocial.map((url) => (
                <a key={url} href={url} rel="me noreferrer" className="hover:text-pf-ink">
                  {host(url)}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-pf-ink/10 pt-6 text-[9.5px] uppercase tracking-[0.2em] text-pf-ink/30">
          <span>
            © {ctx.year} {ctx.d.title}
          </span>
          {ctx.d.theme.footerText && <span>{ctx.d.theme.footerText}</span>}
          {ctx.branding && (
            <span>
              {ctx.tr("Made with", "Feito com")} {ctx.brand}
            </span>
          )}
        </div>
      </W>
    </footer>
  );
}

function galleriesOf(ctx: Ctx, a: Art) {
  return ctx.galleries.filter((g) => g.artIds.includes(a.id));
}
function workList(ctx: Ctx, a: Art) {
  const g = galleriesOf(ctx, a)[0];
  return g ? ctx.works(g) : ctx.d.artworks;
}

/** Two-column wall with alternating offsets and varied crops. */
function Wall({ ctx, works }: { ctx: Ctx; works: Art[] }) {
  return (
    <div className="mt-10 grid gap-x-10 gap-y-14 csm:grid-cols-2 csm:gap-x-16 csm:gap-y-24">
      {works.map((w, i) => (
        <a key={w.id} href={ctx.workHref(w)} className={cn("group block", i % 2 === 1 && "csm:mt-20")}>
          <div className="relative overflow-hidden bg-pf-surface">
            <Img
              ctx={ctx}
              art={w}
              className={cn(
                "w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]",
                i % 3 === 0 ? "aspect-[4/5]" : i % 3 === 1 ? "aspect-[3/4]" : "aspect-square",
              )}
            />
            <div className="pointer-events-none absolute inset-0 flex items-end justify-between bg-gradient-to-t from-pf-ink/45 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <span className="text-[9.5px] uppercase tracking-[0.24em] text-pf-bg">
                {ctx.tr("View work", "Ver obra")}
              </span>
              <span className="text-[13px] leading-none text-pf-bg/80">↗</span>
            </div>
          </div>
          <div className="mt-4 flex items-start justify-between gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-pf-ink/35">{pad(i + 1)}</p>
              <p className="mt-1.5 font-pf-display text-[19px] leading-snug">{w.title}</p>
            </div>
            <p className="pt-4 text-right text-[9.5px] uppercase tracking-[0.18em] text-pf-ink/40">
              {galleriesOf(ctx, w)[0]?.title}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}

function SectionHead({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-pf-ink/12 pb-4">
      <h2 className="font-pf-display text-[24px] tracking-[0.02em]">
        <Inline text={title} />
      </h2>
      {meta && <span className="shrink-0 text-[9.5px] uppercase tracking-[0.2em] text-pf-ink/35">{meta}</span>}
    </div>
  );
}

const pieces = (ctx: Ctx, n: number) => pad(n) + " " + ctx.tr(n === 1 ? "piece" : "pieces", n === 1 ? "obra" : "obras");

function block(b: Block, ctx: Ctx): ReactNode {
  const a = b.artId ? ctx.arts.get(b.artId) : undefined;
  const g = ctx.galleries.find((v) => v.id === b.galleryId);
  const flip = b.layout === "right";
  switch (b.type) {
    case "hero": {
      const name = b.heading || ctx.d.title;
      const words = name.split(" ");
      const split = !name.includes("*") && !name.includes("\n") && words.length > 1;
      const link = ctx.link(b.url);
      return (
        <W>
          <section style={sy(b.spacing === "compact" ? 2 : 3.5)} className="!pb-0">
            <div
              className={cn(
                "grid gap-10 border-b border-pf-ink/12 pb-12 clg:items-end clg:gap-16 clg:pb-20",
                a && (flip ? "clg:grid-cols-[0.92fr_1.08fr]" : "clg:grid-cols-[1.08fr_0.92fr]"),
              )}
            >
              <div className={cn(flip && "clg:order-2", b.layout === "center" && !a && "text-center")}>
                {ctx.d.description && (
                  <p className="line-clamp-2 text-[9.5px] uppercase tracking-[0.32em] text-pf-ink/45">
                    {ctx.d.description}
                  </p>
                )}
                <h1 className="mt-5 font-pf-display text-[62px] leading-[0.84] tracking-[-0.015em] [overflow-wrap:anywhere] csm:text-[96px] clg:text-[114px]">
                  {split ? (
                    <>
                      {words.slice(0, -1).join(" ")}
                      <br />
                      <span className="italic text-pf-ink/80">{words.at(-1)}</span>
                    </>
                  ) : (
                    <Inline text={name} em="italic text-pf-ink/80" />
                  )}
                </h1>
                {b.text && (
                  <p className={cn("mt-7 max-w-[400px] font-pf-display text-[19px] italic leading-relaxed text-pf-ink/65", b.layout === "center" && !a && "mx-auto")}>
                    <Inline text={firstParagraph(b.text)} />
                  </p>
                )}
                {restParagraphs(b.text) && (
                  <Rich text={restParagraphs(b.text)} className="mt-4 max-w-[420px] text-[13.5px] leading-[1.9] text-pf-ink/60" />
                )}
                <div className="mt-8 flex items-center gap-4 text-[9.5px] uppercase tracking-[0.22em] text-pf-ink/35">
                  {link ? (
                    <a href={link} className="text-pf-ink/60 underline decoration-pf-ink/25 underline-offset-4 hover:text-pf-ink">
                      {ctx.tr("Selected work", "Obras selecionadas")} ↗
                    </a>
                  ) : (
                    <span>
                      {ctx.tr("Selected work", "Obras selecionadas")} · {ctx.year}
                    </span>
                  )}
                  <span className="h-px flex-1 bg-pf-ink/15" />
                  <span>{pieces(ctx, ctx.d.artworks.length)}</span>
                </div>
              </div>
              {a && (
                <figure className={cn("clg:mb-[-4.5rem]", flip && "clg:order-1")}>
                  <div className="overflow-hidden bg-pf-surface">
                    <Img ctx={ctx} art={a} large className="aspect-[4/5] w-full object-cover" />
                  </div>
                  <figcaption className="mt-3 text-[9.5px] uppercase tracking-[0.18em] text-pf-ink/40">
                    {a.title}
                  </figcaption>
                </figure>
              )}
            </div>
          </section>
        </W>
      );
    }
    case "image":
      return (
        a && (
          <W>
            <figure style={sy(3)}>
              {b.heading && <SectionHead title={b.heading} />}
              <div className={cn("overflow-hidden", b.heading && "mt-8")}>
                <Img ctx={ctx} art={a} large className="aspect-[21/9] w-full object-cover" />
              </div>
              <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-2 text-[10px] uppercase tracking-[0.18em] text-pf-ink/40">
                <span>{a.title}</span>
                {b.text && <span>{plain(b.text)}</span>}
              </figcaption>
            </figure>
          </W>
        )
      );
    case "featured":
    case "galleryGrid": {
      const works = b.type === "featured" ? ctx.featured : g ? ctx.works(g) : [];
      if (!works.length) return null;
      return (
        <W>
          <section id="work" className="scroll-mt-24" style={sy(5)}>
            <SectionHead
              title={b.heading || (g ? g.title : ctx.tr("Selected work", "Obras selecionadas"))}
              meta={pieces(ctx, works.length)}
            />
            {b.text && <Rich text={b.text} className="mt-5 max-w-[520px] text-[13.5px] leading-[1.9] text-pf-ink/60" />}
            <Wall ctx={ctx} works={works} />
          </section>
        </W>
      );
    }
    case "galleryPreview": {
      const list = b.galleryId ? ctx.galleries.filter((v) => v.id === b.galleryId) : ctx.galleries;
      if (!list.length) return null;
      return (
        <W>
          <section style={sy(5)}>
            <SectionHead
              title={b.heading || ctx.tr("Collections", "Coleções")}
              meta={pad(list.length) + " " + ctx.tr("series", "séries")}
            />
            <div className="mt-10 grid gap-x-10 gap-y-12 csm:grid-cols-2 clg:grid-cols-3">
              {list.map((v, i) => {
                const cover = ctx.cover(v);
                return (
                  <a key={v.id} href={ctx.galleryHref(v)} className={cn("group block", i % 3 === 1 && "clg:mt-14")}>
                    <div className="overflow-hidden bg-pf-surface">
                      {cover ? (
                        <Img ctx={ctx} art={cover} className="aspect-[4/5] w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]" />
                      ) : (
                        <div className="aspect-[4/5]" />
                      )}
                    </div>
                    <div className="mt-4 flex items-baseline justify-between gap-4">
                      <p className="font-pf-display text-[21px] leading-snug">{v.title}</p>
                      <p className="shrink-0 text-[9.5px] uppercase tracking-[0.18em] text-pf-ink/40">
                        {pieces(ctx, v.artIds.length)}
                      </p>
                    </div>
                    {v.description && (
                      <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-[1.8] text-pf-ink/55">{v.description}</p>
                    )}
                  </a>
                );
              })}
            </div>
          </section>
        </W>
      );
    }
    case "about":
      return (
        <W>
          <section id="about" className="scroll-mt-24" style={sy(5)}>
            <div className={cn("grid gap-10 csm:gap-16", a && (flip ? "csm:grid-cols-[1.15fr_0.85fr]" : "csm:grid-cols-[0.85fr_1.15fr]"))}>
              {a && (
                <div className={cn("overflow-hidden", flip && "csm:order-2")}>
                  <Img ctx={ctx} art={a} className="aspect-[3/4] w-full object-cover" />
                </div>
              )}
              <div className="flex flex-col justify-center">
                <p className="text-[9.5px] uppercase tracking-[0.3em] text-pf-ink/40">{ctx.tr("About", "Sobre")}</p>
                {b.heading && (
                  <h2 className="mt-4 font-pf-display text-[30px] leading-[1.15] csm:text-[38px]">
                    <Inline text={b.heading} em="italic" />
                  </h2>
                )}
                <div className="mt-5 max-w-[440px] space-y-4">
                  <Rich text={b.text} className="text-[13.5px] leading-[1.9] text-pf-ink/60" />
                </div>
                {ctx.social.length > 0 && (
                  <div className="mt-8 border-t border-pf-ink/12 pt-6">
                    <p className="text-[9.5px] uppercase tracking-[0.22em] text-pf-ink/35">
                      {ctx.tr("Elsewhere", "Em outros lugares")}
                    </p>
                    <ul className="mt-3 space-y-2 text-[12.5px] text-pf-ink/60">
                      {ctx.social.map((url, i) => (
                        <li key={url} className="flex gap-4">
                          <span className="w-10 shrink-0 font-pf-display text-[13px] text-pf-ink/40">{pad(i + 1)}</span>
                          <a href={url} rel="me noreferrer" className="hover:text-pf-ink">
                            {host(url)}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        </W>
      );
    case "richText":
      if (b.layout === "center")
        return (
          <W>
            <section className="border-y border-pf-ink/12 text-center" style={sy(5)}>
              <div className="mx-auto max-w-[620px] space-y-5">
                <Rich text={b.text} className="font-pf-display text-[26px] leading-[1.35] text-pf-ink/80 csm:text-[34px]" />
              </div>
              {b.heading && (
                <p className="mt-6 text-[9.5px] uppercase tracking-[0.26em] text-pf-ink/35">{plain(b.heading)}</p>
              )}
            </section>
          </W>
        );
      return (
        <W>
          <section style={sy(3.5)} className={cn(b.layout === "right" && "flex justify-end")}>
            <div className="max-w-[620px]">
              {b.heading && (
                <h2 className="mb-5 font-pf-display text-[30px] leading-[1.15] csm:text-[38px]">
                  <Inline text={b.heading} em="italic" />
                </h2>
              )}
              <div className="space-y-4">
                <Rich text={b.text} className="text-[13.5px] leading-[1.9] text-pf-ink/60" />
              </div>
            </div>
          </section>
        </W>
      );
    case "heading":
      return (
        <W>
          <div style={sy(2.5)}>
            <SectionHead title={b.heading} meta={b.text ? plain(b.text) : undefined} />
          </div>
        </W>
      );
    case "cta":
    case "contact": {
      const link = ctx.link(b.url);
      if (b.type === "cta" && !link) return null;
      return (
        <W>
          <section style={sy(4.5)} className={cn(b.layout === "center" && "text-center")}>
            <p className="text-[9.5px] uppercase tracking-[0.28em] text-pf-ink/35">
              {b.type === "contact" ? b.heading || ctx.tr("Enquiries", "Contato") : ctx.tr("Next", "A seguir")}
            </p>
            {b.type === "cta" && (
              <h2 className="mt-3 max-w-[760px] font-pf-display text-[30px] leading-[1.1] csm:text-[42px]">
                <Inline text={b.heading || ctx.linkLabel(b.url)} em="italic" />
              </h2>
            )}
            {b.text && (
              <div className={cn("mt-4 max-w-[480px] space-y-3", b.layout === "center" && "mx-auto")}>
                <Rich text={b.text} className="text-[13.5px] leading-[1.9] text-pf-ink/60" />
              </div>
            )}
            {link && (
              <a
                href={link}
                rel="noreferrer"
                className="mt-5 inline-block font-pf-display text-[24px] leading-none tracking-tight underline decoration-pf-ink/25 decoration-1 underline-offset-[6px] transition-colors hover:decoration-pf-ink [overflow-wrap:anywhere] csm:text-[32px]"
              >
                {ctx.linkLabel(b.url)} ↗
              </a>
            )}
          </section>
        </W>
      );
    }
    case "social":
      if (!ctx.social.length) return null;
      return (
        <W>
          <section style={sy(3)} className="flex flex-wrap items-baseline gap-x-8 gap-y-3 border-y border-pf-ink/12">
            {b.heading && <h2 className="font-pf-display text-[22px]">{plain(b.heading)}</h2>}
            {ctx.social.map((url) => (
              <a key={url} href={url} rel="me noreferrer" className="text-[10px] uppercase tracking-[0.2em] text-pf-ink/50 hover:text-pf-ink">
                {host(url)} ↗
              </a>
            ))}
          </section>
        </W>
      );
    case "divider":
      return (
        <W>
          <div style={sy(1.5)}>
            <hr className="border-pf-ink/12" />
          </div>
        </W>
      );
  }
}

function GalleryPage({ ctx, gallery }: { ctx: Ctx; gallery: Gallery }) {
  const works = ctx.works(gallery);
  return (
    <W>
      <section className="pb-16 pt-12 csm:pb-24 csm:pt-16">
        <p className={caps}>{pieces(ctx, works.length)}</p>
        <h1 className="mt-5 font-pf-display text-[52px] leading-[0.9] tracking-[-0.015em] csm:text-[80px]">
          {gallery.title}
        </h1>
        {gallery.description && (
          <p className="mt-6 max-w-[460px] font-pf-display text-[19px] italic leading-relaxed text-pf-ink/65">
            {gallery.description}
          </p>
        )}
        <div className="mt-12">
          <SectionHead title={ctx.tr("Works", "Obras")} meta={pieces(ctx, works.length)} />
          {works.length ? (
            <Wall ctx={ctx} works={works} />
          ) : (
            <p className="mt-10 font-pf-display text-[19px] italic text-pf-ink/50">
              {ctx.tr("No artwork in this gallery yet.", "Esta galeria ainda não tem obras.")}
            </p>
          )}
        </div>
      </section>
    </W>
  );
}

function WorkPage({ ctx, art }: { ctx: Ctx; art: Art }) {
  const list = workList(ctx, art);
  const { next } = neighbours(list, art);
  const where = galleriesOf(ctx, art);
  const rows: [string, ReactNode][] = [
    ...artworkDetailKeys.flatMap(key => art.details?.[key] ? [[detailLabel(key, ctx.l), art.details[key]] as [string, string]] : []),
    [ctx.tr("Title", "Título"), art.title],
    ...(where.length
      ? [[ctx.tr("Collection", "Coleção"), where.map((g, i) => (
          <span key={g.id}>
            {i > 0 && ", "}
            <a href={ctx.galleryHref(g)} className="underline decoration-pf-ink/20 underline-offset-4 hover:decoration-pf-ink">
              {g.title}
            </a>
          </span>
        ))] as [string, ReactNode]]
      : []),
    [ctx.tr("Artist", "Artista"), ctx.d.title],
  ];
  return (
    <W className="py-10">
      <div className="overflow-hidden bg-pf-surface">
        <Img ctx={ctx} art={art} large className="max-h-[72vh] w-full object-contain" />
      </div>
      <div className="mt-8 grid gap-8 csm:grid-cols-[1.2fr_1fr]">
        <div>
          <h1 className="font-pf-display text-[34px] leading-[1.05] csm:text-[46px]">{art.title}</h1>
          {art.description && (
            <div className="mt-4 max-w-[440px] space-y-3">
              <Rich text={art.description} className="text-[13.5px] leading-[1.9] text-pf-ink/60" />
            </div>
          )}
        </div>
        <dl className="space-y-3 border-t border-pf-ink/12 pt-5 text-[11.5px] csm:border-0 csm:pt-0">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-6 border-b border-pf-ink/10 pb-2.5">
              <dt className="text-[9.5px] uppercase tracking-[0.18em] text-pf-ink/35">{k}</dt>
              <dd className="text-right text-pf-ink/70">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      {next && next.id !== art.id && (
        <a href={ctx.workHref(next)} className="group mt-16 flex items-center justify-between gap-6 border-t border-pf-ink/12 pt-8">
          <div>
            <p className="text-[9.5px] uppercase tracking-[0.24em] text-pf-ink/35">{ctx.tr("Next work", "Próxima obra")}</p>
            <p className="mt-2 font-pf-display text-[26px] leading-none csm:text-[32px]">{next.title}</p>
          </div>
          <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-pf-ink/45">
            {ctx.tr("Continue", "Continuar")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </a>
      )}
    </W>
  );
}

export const gallery: TemplateDesign = {
  palettes: {
    original: { bg: "#FFFDF8", ink: "#1F1E1C", surface: "#F2EEE6" },
    warm: { bg: "#FBF4EA", ink: "#2A211B", surface: "#F0E5D6" },
    cool: { bg: "#F6F8F8", ink: "#1C2228", surface: "#E7ECEE" },
    noir: { bg: "#151413", ink: "#EDE8DF", surface: "#211F1C" },
  },
  display: '"UI Instrument", Georgia, serif',
  body: '"UI DM Sans", system-ui, sans-serif',
  root: "bg-pf-bg text-pf-ink",
  tint: "bg-pf-accent/10",
  paper: "bg-pf-surface/70",
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
