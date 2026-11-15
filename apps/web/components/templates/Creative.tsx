import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { Art, Block } from "@studio/shared";
import {
  Img,
  Inline,
  Rich,
  firstParagraph,
  host,
  neighbours,
  plain,
  type Ctx,
  type Gallery,
  type TemplateDesign,
} from "./kit";
import { Sparkle, Squiggle } from "../home/bits";
import { cn } from "../home/types";

/* Port of Design/src/routes/portfolio.creative.index.jsx: peach paper, soft
   colour blobs, sticker labels, a tilted white-framed print, a marquee strip
   and a staggered card wall. */

const W = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("relative z-10 mx-auto max-w-[1120px] px-5", className)}>{children}</div>
);
const sy = (rem: number) => ({ paddingBlock: `calc(${rem}rem * var(--sy, 1))` });
const em = "font-serif font-normal italic text-pf-accent";
const eyebrow = "text-[10px] font-bold uppercase tracking-[0.24em] text-pf-ink/35";
const short = (url: string) => host(url).replace(/\.(com|net|org|art|me|io|co)(\.[a-z]{2})?$/, "");

/** Headline with the brand sparkle rendered as a coral serif glyph. */
function Headline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(✦)/).map((part, i) =>
        part === "✦" ? (
          <span key={i} className={em}>
            ✦
          </span>
        ) : (
          <Inline key={i} text={part} em={em} />
        ),
      )}
    </>
  );
}

function Header({ ctx }: { ctx: Ctx }) {
  const nav = ctx.d.theme.nav;
  if (ctx.route.kind === "page" && ctx.route.page.id !== ctx.d.home &&
    ctx.route.page.blocks.find(block => block.visible)?.type === "commissionStatus") {
    const c = ctx.d.commissions;
    const status = {open: ctx.tr("Open", "Abertas"), waitlist: ctx.tr("Waitlist", "Lista de espera"), closed: ctx.tr("Closed", "Fechadas")};
    return <header className="relative z-30 border-b border-pf-ink/10">
      <div className="mx-auto flex max-w-[1040px] items-center justify-between gap-3 px-5 py-4">
        <a href={ctx.homeHref} className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]"><ArrowLeft className="h-3 w-3"/>{ctx.d.title}</a>
        <span className={cn("rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em]", c.status === "open" ? "bg-mint text-ink" : "bg-pf-surface")}>{status[c.status]}</span>
        {c.status !== "closed" && c.contacts.length > 0 && <a href={ctx.contactUrl(0)} className="hidden rounded-full bg-pf-ink px-4 py-2 text-[11px] font-semibold uppercase text-pf-bg csm:block">{ctx.tr("Say hi", "Diga oi")}</a>}
      </div>
    </header>;
  }
  const commissions = ctx.commissionPage;
  const say = commissions?.href ?? ctx.social[0];
  const links = ctx.nav.map((p) => (
    <a
      key={p.id}
      href={p.href}
      aria-current={p.current ? "page" : undefined}
      className={cn(
        "rounded-full px-3 py-1.5 lowercase text-pf-ink/55 transition-colors hover:bg-pf-surface/70 hover:text-pf-ink",
        p.current && "bg-pf-surface/70 text-pf-ink",
      )}
    >
      {p.title}
    </a>
  ));
  return (
    <header className="relative z-40">
      <div
        className={cn(
          "mx-auto flex max-w-[1120px] px-5 py-5",
          nav === "split" ? "items-center justify-between" : "flex-col gap-3",
          nav === "center" && "items-center",
        )}
      >
        <a href={ctx.homeHref} className="flex items-center gap-2">
          <span className="font-pf-display text-[19px] font-bold lowercase tracking-tight">{ctx.d.title}</span>
          <Sparkle size={12} className="text-pf-accent" />
        </a>
        <nav className={cn("hidden items-center gap-1 text-[12.5px] csm:flex", nav !== "split" && "flex-wrap")}>
          {links}
        </nav>
        {say && nav === "split" && (
          <a
            href={say}
            rel="me noreferrer"
            className="rounded-full bg-pf-ink px-4 py-2 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-pf-bg transition-transform hover:-translate-y-0.5"
          >
            {commissions?.title ?? ctx.tr("say hi", "diga oi")}
          </a>
        )}
      </div>
      {ctx.nav.length > 0 && (
        <div className="no-scrollbar flex gap-5 overflow-x-auto border-t border-pf-ink/10 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-pf-ink/45 csm:hidden">
          {ctx.nav.map((p) => (
            <a key={p.id} href={p.href} className={cn("shrink-0 hover:text-pf-ink", p.current && "text-pf-ink")}>
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
    <footer className="relative z-10 border-t border-pf-ink/12 bg-pf-surface/50">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-3 px-5 py-7 text-[10.5px] uppercase tracking-[0.16em] text-pf-ink/40 csm:flex-row csm:items-center csm:justify-between">
        <span>
          © {ctx.year} <span className="lowercase">{ctx.d.title}</span>
        </span>
        {ctx.footerSocial.length > 0 && (
          <span className="flex flex-wrap gap-4">
            {ctx.footerSocial.map((url) => (
              <a key={url} href={url} rel="me noreferrer" className="hover:text-pf-ink/70">
                {short(url)}
              </a>
            ))}
          </span>
        )}
        {ctx.d.theme.footerText && <span>{ctx.d.theme.footerText}</span>}
        {ctx.branding && (
          <span>
            {ctx.tr("Made with", "Feito com")} {ctx.brand} ✦
          </span>
        )}
      </div>
    </footer>
  );
}

const tagOf = (ctx: Ctx, a: Art) =>
  ctx.galleries.find((g) => g.artIds.includes(a.id))?.title ?? (a.featured ? ctx.tr("featured", "destaque") : "");

/** Bento wall: every fifth piece opens a large two-by-two card. */
function Wall({ ctx, works }: { ctx: Ctx; works: Art[] }) {
  return (
    <div className="mt-8 grid gap-4 csm:grid-cols-2 clg:grid-cols-4">
      {works.map((w, i) => {
        const big = i % 5 === 0;
        return (
          <a
            key={w.id}
            href={ctx.workHref(w)}
            className={cn("group block", big && "csm:col-span-2 csm:row-span-2", i % 5 === 2 && "clg:mt-6")}
          >
            <figure>
              <div className="overflow-hidden rounded-[1.4rem] border-4 border-pf-surface bg-pf-surface shadow-[0_18px_40px_-28px_rgba(39,36,56,0.55)]">
                <Img
                  ctx={ctx}
                  art={w}
                  className={cn(
                    "w-full object-cover transition-transform duration-700 group-hover:scale-105",
                    big ? "aspect-[4/3]" : "aspect-square",
                  )}
                />
              </div>
              <figcaption className="mt-2 flex items-baseline justify-between gap-2 px-1">
                <span className="truncate text-[12px] font-medium">{w.title}</span>
                {tagOf(ctx, w) && (
                  <span className="shrink-0 rounded-full bg-pf-surface/80 px-2 py-[1px] text-[9px] font-bold uppercase tracking-wider text-pf-ink/45">
                    {tagOf(ctx, w)}
                  </span>
                )}
              </figcaption>
            </figure>
          </a>
        );
      })}
    </div>
  );
}

function Cards({ ctx, list }: { ctx: Ctx; list: Gallery[] }) {
  return (
    <div className="grid gap-4 csm:grid-cols-3">
      {list.map((g) => {
        const cover = ctx.cover(g);
        return (
          <a
            key={g.id}
            href={ctx.galleryHref(g)}
            className="group relative overflow-hidden rounded-[1.4rem] border border-pf-ink/10 bg-pf-surface"
          >
            {cover ? (
              <Img ctx={ctx} art={cover} className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="aspect-[4/3] bg-lilac/30" />
            )}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="font-pf-display text-[14px] font-semibold">{g.title}</span>
              <span className="text-[10.5px] uppercase tracking-wider text-pf-ink/40">{g.artIds.length}</span>
            </div>
          </a>
        );
      })}
    </div>
  );
}

function block(b: Block, ctx: Ctx): ReactNode {
  const a = b.artId ? ctx.arts.get(b.artId) : undefined;
  const g = ctx.galleries.find((v) => v.id === b.galleryId);
  const flip = b.layout === "right";
  const link = ctx.link(b.url);
  switch (b.type) {
    case "hero": {
      const page = ctx.route.kind === "page" ? ctx.route.page : null;
      const hasWork = page?.blocks.some((v) => v.visible && (v.type === "featured" || v.type === "galleryGrid"));
      const second = ctx.commissionPage ?? ctx.nav.find((p) => !p.current);
      const badge = ctx.d.description.length <= 48 ? ctx.d.description : "";
      const words = [...ctx.galleries.map((v) => v.title), ...ctx.featured.map((v) => v.title)].slice(0, 6);
      return (
        <>
          <W>
            <section
              style={sy(b.spacing === "compact" ? 1 : 1.5)}
              className={cn("grid items-center gap-10 !pb-16 clg:gap-14", a && "clg:grid-cols-[1.05fr_1fr]")}
            >
              <div className={cn(flip && "clg:order-2", b.layout === "center" && !a && "mx-auto max-w-[640px] text-center")}>
                {badge && (
                  <span className="inline-flex -rotate-2 items-center gap-1.5 rounded-full border border-ink/15 bg-mint px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink">
                    <span className="h-1.5 w-1.5 rounded-full bg-ink/60" /> {badge}
                  </span>
                )}
                <h1 className="mt-6 whitespace-pre-line font-pf-display text-[48px] font-bold leading-[0.88] tracking-[-0.04em] [overflow-wrap:anywhere] csm:text-[68px] clg:text-[76px]">
                  <Headline text={b.heading || ctx.d.title} />
                </h1>
                {b.text && (
                  <p className="mt-6 max-w-[400px] text-[15px] leading-relaxed text-pf-ink/65">
                    <Inline text={firstParagraph(b.text)} em={em} />
                  </p>
                )}
                <div className={cn("mt-7 flex flex-wrap gap-2.5", b.layout === "center" && !a && "justify-center")}>
                  {(link || hasWork) && (
                    <a
                      href={link ?? "#work"}
                      className="inline-flex items-center gap-2 rounded-full bg-pf-accent px-5 py-3 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-white shadow-[0_3px_0_0_rgba(39,36,56,0.15)] transition-transform hover:-translate-y-0.5"
                    >
                      {ctx.tr("see my work", "ver meu trabalho")} <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {second && (
                    <a
                      href={second.href}
                      className="inline-flex items-center gap-2 rounded-full border border-pf-ink/25 px-5 py-3 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-pf-ink/70 hover:border-pf-ink/60"
                    >
                      {second.title}
                    </a>
                  )}
                </div>
                {ctx.social.length > 0 && (
                  <div className="mt-7 flex flex-wrap items-center gap-4 text-pf-ink/40">
                    {ctx.social.map((url) => (
                      <a key={url} href={url} rel="me noreferrer" className="text-[11px] font-semibold uppercase tracking-[0.14em] hover:text-pf-ink">
                        {short(url)}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {a && (
                <div className={cn("relative", flip && "clg:order-1")}>
                  <div className="relative rotate-[2deg] overflow-hidden rounded-[2rem] border-[6px] border-pf-surface bg-pf-surface shadow-[0_30px_60px_-30px_rgba(39,36,56,0.5)]">
                    <Img ctx={ctx} art={a} large className="aspect-[4/5] w-full object-cover" />
                  </div>
                  <span className="absolute -left-3 top-6 max-w-[70%] -rotate-6 truncate rounded-full bg-butter px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink shadow">
                    ★ {tagOf(ctx, a) || a.title}
                  </span>
                  <span className="absolute -right-2 bottom-8 rotate-3 rounded-2xl bg-lilac px-3 py-2 text-[10px] font-bold uppercase leading-tight tracking-[0.1em] text-ink shadow">
                    {ctx.d.artworks.length} {ctx.tr("works", "obras")}
                    <br />
                    {ctx.tr("and counting", "e contando")}
                  </span>
                  <Sparkle size={22} className="absolute -right-4 top-2 text-pf-accent" />
                  <Squiggle className="absolute -bottom-4 left-6 text-pf-accent/60" width={96} />
                </div>
              )}
            </section>
          </W>
          {words.length > 1 && (
            <div aria-hidden="true" className="relative z-10 overflow-hidden border-y border-pf-ink/12 bg-pf-ink py-3 text-pf-bg">
              <div className="flex w-max animate-marquee gap-8 whitespace-nowrap">
                {[0, 1].map((pass) => (
                  <div key={pass} className="flex items-center gap-8">
                    {[...words, ...words].map((w, i) => (
                      <span key={pass + "-" + i} className="flex items-center gap-8 font-pf-display text-[13px] font-semibold uppercase tracking-[0.16em]">
                        {w}
                        <Sparkle size={10} className="text-pf-accent" />
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      );
    }
    case "featured":
    case "galleryGrid": {
      const works = b.type === "featured" ? ctx.featured : g ? ctx.works(g) : [];
      if (!works.length) return null;
      const all = g ?? ctx.galleries[0];
      return (
        <W>
          <section id="work" className="scroll-mt-10" style={sy(4)}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className={eyebrow}>{b.type === "featured" ? ctx.tr("featured pieces", "obras em destaque") : ctx.tr("gallery", "galeria")}</p>
                <h2 className="mt-2 font-pf-display text-[30px] font-bold leading-none tracking-[-0.03em] csm:text-[40px]">
                  <Headline text={b.heading || g?.title || ctx.tr("some favourites", "alguns favoritos")} />
                </h2>
              </div>
              {all && (
                <a href={ctx.galleryHref(all)} className="group flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-pf-ink/50 hover:text-pf-ink">
                  {g ? ctx.tr("open gallery", "abrir galeria") : ctx.tr("all works", "todas as obras")}
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              )}
            </div>
            {b.text && <Rich text={b.text} className="mt-3 max-w-[460px] text-[13.5px] leading-[1.8] text-pf-ink/60" em={em} />}
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
          <section style={sy(1.5)}>
            {b.heading && (
              <h2 className="mb-6 font-pf-display text-[24px] font-bold tracking-[-0.03em]">
                <Headline text={b.heading} />
              </h2>
            )}
            <Cards ctx={ctx} list={list} />
          </section>
        </W>
      );
    }
    case "cta":
    case "contact": {
      const toCommission = b.url === "portfolio:commissions";
      if (b.type === "cta" && !link) return null;
      return (
        <W>
          <section style={sy(4)}>
            <div className={cn("relative overflow-hidden rounded-[1.8rem] px-6 py-9 text-ink csm:px-10", b.type === "cta" ? "bg-lilac/70" : "bg-mint/60")}>
              <Sparkle size={26} className="absolute right-6 top-6 text-white/70" />
              <div className={cn("flex flex-col gap-6", b.layout === "center" ? "items-center text-center" : "csm:flex-row csm:items-center csm:justify-between")}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-ink/45">
                    {b.type === "contact" ? ctx.tr("contact", "contato") : toCommission ? ctx.tr("commissions", "encomendas") : link ? short(link) : ""}
                  </p>
                  <h2 className="mt-2 max-w-[420px] font-pf-display text-[26px] font-bold leading-[1.05] tracking-[-0.03em] csm:text-[34px]">
                    <Inline text={b.heading || ctx.tr("say hello", "diga oi")} em="font-serif font-normal italic" />
                  </h2>
                  {b.text && <Rich text={b.text} className="mt-2 max-w-[460px] text-[12.5px] text-ink/60" />}
                </div>
                {link && (
                  <a
                    href={link}
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-2 rounded-full bg-ink px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-paper transition-transform hover:-translate-y-0.5"
                  >
                    {toCommission ? ctx.tr("See prices", "Ver preços") : b.type === "contact" ? ctx.linkLabel(b.url) : ctx.tr("let's go", "vamos lá")} <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </section>
        </W>
      );
    }
    case "about":
      return (
        <W>
          <section
            id="about"
            style={sy(3.5)}
            className={cn("grid gap-8 border-t border-pf-ink/12 csm:gap-14", a && (flip ? "csm:grid-cols-[1.1fr_0.9fr]" : "csm:grid-cols-[0.9fr_1.1fr]"))}
          >
            {a && (
              <div className={cn("relative", flip && "csm:order-2")}>
                <div className="overflow-hidden rounded-[1.6rem] border-4 border-pf-surface shadow">
                  <Img ctx={ctx} art={a} className="aspect-square w-full object-cover" />
                </div>
                <span className="absolute -bottom-3 -right-2 rotate-3 rounded-full bg-mint px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink shadow">
                  {ctx.tr("that's me!", "sou eu!")}
                </span>
              </div>
            )}
            <div className="flex flex-col justify-center">
              <h2 className="font-pf-display text-[24px] font-bold tracking-[-0.03em]">
                <Headline text={b.heading || ctx.tr("about me", "sobre mim")} />
              </h2>
              <div className="mt-3 max-w-[420px] space-y-3">
                <Rich text={b.text} className="text-[13.5px] leading-[1.85] text-pf-ink/65" em={em} />
              </div>
              {ctx.social.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {ctx.social.map((url) => (
                    <a key={url} href={url} rel="me noreferrer" className="rounded-full border border-pf-ink/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-pf-ink/50 hover:border-pf-ink/50 hover:text-pf-ink">
                      {short(url)}
                    </a>
                  ))}
                </div>
              )}
              {link && (
                <div className="mt-6">
                  <a href={link} rel="noreferrer" className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-pf-ink/55 underline decoration-pf-accent decoration-2 underline-offset-4 hover:text-pf-ink">
                    {ctx.linkLabel(b.url)}
                  </a>
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
            <figure style={sy(3)} className={cn("max-w-[860px]", b.layout === "center" ? "mx-auto" : b.layout === "right" && "ml-auto")}>
              {b.heading && (
                <h2 className="mb-5 font-pf-display text-[24px] font-bold tracking-[-0.03em]">
                  <Headline text={b.heading} />
                </h2>
              )}
              <div className="overflow-hidden rounded-[2rem] border-[6px] border-pf-surface bg-pf-surface shadow-[0_30px_60px_-30px_rgba(39,36,56,0.5)]">
                <Img ctx={ctx} art={a} large className="max-h-[78vh] w-full object-contain" />
              </div>
              <figcaption className="mt-3 flex items-baseline justify-between gap-3 px-1">
                <span className="text-[12px] font-medium">{a.title}</span>
                {b.text && <span className="text-[11px] text-pf-ink/50">{plain(b.text)}</span>}
              </figcaption>
            </figure>
          </W>
        )
      );
    case "heading":
      return (
        <W>
          <div style={sy(2)}>
            {b.text && <p className={eyebrow}>{plain(b.text)}</p>}
            <h2 className="mt-2 font-pf-display text-[30px] font-bold leading-none tracking-[-0.03em] csm:text-[40px]">
              <Headline text={b.heading} />
            </h2>
          </div>
        </W>
      );
    case "richText":
      if (b.text && b.text.split(/\n\s*\n/).every(line => /^\d+\.\s+/.test(line))) {
        return <W><section className="rounded-[1.6rem] border border-pf-ink/10 bg-pf-surface/70 px-6" style={sy(2)}>
          {b.heading && <h2 className="font-pf-display text-[22px] font-bold"><Headline text={b.heading} /></h2>}
          <ol className="mt-5 grid gap-5 csm:grid-cols-3">{b.text.split(/\n\s*\n/).map((line,i) => <li key={i}>
            <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full bg-pf-accent text-[11px] font-bold text-white">{line.split(".")[0]}</span>
            <p className="mt-2.5 text-[13px] leading-relaxed"><Inline text={line.replace(/^\d+\.\s+/, "")} /></p>
          </li>)}</ol>
        </section></W>;
      }
      return (
        <W>
          <section style={sy(2.5)} className={cn(b.layout === "center" && "mx-auto max-w-[620px]", b.layout === "right" && "flex justify-end")}>
            <div className="max-w-[560px]">
              {b.heading && (
                <h2 className="mb-4 font-pf-display text-[26px] font-bold leading-[1.05] tracking-[-0.03em] csm:text-[32px]">
                  <Headline text={b.heading} />
                </h2>
              )}
              <div className="space-y-4">
                <Rich text={b.text} className="text-[15px] leading-relaxed text-pf-ink/65" em={em} />
              </div>
            </div>
          </section>
        </W>
      );
    case "social":
      if (!ctx.social.length) return null;
      return (
        <W>
          <section style={sy(2.5)} className="flex flex-wrap items-center gap-2">
            {b.heading && (
              <h2 className="mr-3 font-pf-display text-[20px] font-bold tracking-[-0.03em]">
                <Headline text={b.heading} />
              </h2>
            )}
            {ctx.social.map((url, i) => (
              <a
                key={url}
                href={url}
                rel="me noreferrer"
                className={cn(
                  "u-sticker inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-transform hover:-translate-y-0.5",
                  ["bg-butter", "bg-mint", "bg-lilac", "bg-coral"][i % 4],
                  i % 2 ? "rotate-2" : "-rotate-2",
                )}
              >
                {short(url)} <ArrowUpRight className="h-3 w-3" />
              </a>
            ))}
          </section>
        </W>
      );
    case "divider":
      return (
        <W>
          <div style={sy(1.5)} className="flex items-center justify-center gap-3 text-pf-accent">
            <Sparkle size={12} />
            <Squiggle width={120} />
            <Sparkle size={12} className="text-lilac" />
          </div>
        </W>
      );
  }
}

function GalleryPage({ ctx, gallery }: { ctx: Ctx; gallery: Gallery }) {
  const works = ctx.works(gallery);
  const others = ctx.galleries.filter((g) => g.id !== gallery.id).slice(0, 3);
  return (
    <W>
      <section className="pb-6 pt-6 clg:pt-12">
        <a href={ctx.homeHref} className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-pf-ink/45 hover:text-pf-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> {ctx.tr("back home", "voltar")}
        </a>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex -rotate-2 items-center gap-1.5 rounded-full border border-ink/15 bg-butter px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink">
              ★ {works.length} {ctx.tr("works", "obras")}
            </span>
            <h1 className="mt-5 font-pf-display text-[44px] font-bold lowercase leading-[0.9] tracking-[-0.04em] csm:text-[64px]">
              {gallery.title} <span className={em}>✦</span>
            </h1>
          </div>
          {gallery.description && <p className="max-w-[380px] text-[14px] leading-relaxed text-pf-ink/60">{gallery.description}</p>}
        </div>
        {works.length ? (
          <Wall ctx={ctx} works={works} />
        ) : (
          <p className="mt-10 rounded-[1.4rem] border border-dashed border-pf-ink/20 bg-pf-surface/60 px-6 py-10 text-center text-[13px] text-pf-ink/55">
            {ctx.tr("No artwork in this gallery yet.", "Esta galeria ainda não tem obras.")}
          </p>
        )}
      </section>
      {others.length > 0 && (
        <section className="border-t border-pf-ink/12 py-14">
          <p className={cn(eyebrow, "mb-5")}>{ctx.tr("more galleries", "mais galerias")}</p>
          <Cards ctx={ctx} list={others} />
        </section>
      )}
    </W>
  );
}

function WorkPage({ ctx, art }: { ctx: Ctx; art: Art }) {
  const g = ctx.galleries.find((v) => v.artIds.includes(art.id));
  const list = g ? ctx.works(g) : ctx.d.artworks;
  const { next, prev } = neighbours(list, art);
  return (
    <W>
      <section className="grid items-center gap-10 pb-16 pt-6 clg:grid-cols-[1.1fr_0.9fr] clg:gap-14 clg:pt-12">
        <div className="relative">
          <div className="relative -rotate-1 overflow-hidden rounded-[2rem] border-[6px] border-pf-surface bg-pf-surface shadow-[0_30px_60px_-30px_rgba(39,36,56,0.5)]">
            <Img ctx={ctx} art={art} large className="max-h-[78vh] w-full object-contain" />
          </div>
          <Sparkle size={22} className="absolute -right-3 -top-3 text-pf-accent" />
        </div>
        <div>
          <a href={g ? ctx.galleryHref(g) : ctx.homeHref} className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-pf-ink/45 hover:text-pf-ink">
            <ArrowLeft className="h-3.5 w-3.5" /> {g ? g.title : ctx.tr("back home", "voltar")}
          </a>
          <h1 className="mt-5 font-pf-display text-[40px] font-bold leading-[0.92] tracking-[-0.04em] csm:text-[56px]">{art.title}</h1>
          {art.description && (
            <div className="mt-5 max-w-[400px] space-y-3">
              <Rich text={art.description} className="text-[15px] leading-relaxed text-pf-ink/65" em={em} />
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-1.5">
            {ctx.galleries
              .filter((v) => v.artIds.includes(art.id))
              .map((v, i) => (
                <a key={v.id} href={ctx.galleryHref(v)} className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink", ["bg-mint", "bg-lilac", "bg-butter"][i % 3])}>
                  {v.title}
                </a>
              ))}
          </div>
          {list.length > 1 && (
            <div className="mt-10 flex gap-2.5">
              <a href={ctx.workHref(prev)} className="inline-flex items-center gap-2 rounded-full border border-pf-ink/25 px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-pf-ink/70 hover:border-pf-ink/60">
                <ArrowLeft className="h-3.5 w-3.5" /> {ctx.tr("previous", "anterior")}
              </a>
              <a href={ctx.workHref(next)} className="inline-flex items-center gap-2 rounded-full bg-pf-accent px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-white shadow-[0_3px_0_0_rgba(39,36,56,0.15)] transition-transform hover:-translate-y-0.5">
                {ctx.tr("next", "próxima")} <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>
      </section>
    </W>
  );
}

export const creative: TemplateDesign = {
  palettes: {
    original: { bg: "#FFF4EF", ink: "#272438", surface: "#FFFFFF" },
    warm: { bg: "#FFF1E6", ink: "#3A2A2A", surface: "#FFFBF6" },
    cool: { bg: "#F1F4FF", ink: "#232A44", surface: "#FFFFFF" },
    noir: { bg: "#1D1A28", ink: "#F6EEF2", surface: "#2A2638" },
  },
  display: '"UI Bricolage", ui-sans-serif, system-ui, sans-serif',
  body: '"UI DM Sans", system-ui, sans-serif',
  root: "relative overflow-hidden bg-pf-bg text-pf-ink",
  tint: "bg-pf-accent/10",
  paper: "bg-pf-surface/55",
  Shell: ({ ctx, children }) => (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-lilac/30 blur-[70px]" />
        <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-mint/30 blur-[70px]" />
        <div className="absolute bottom-40 left-1/3 h-64 w-64 rounded-full bg-butter/40 blur-[70px]" />
      </div>
      <Header ctx={ctx} />
      <main className="relative z-10">{children}</main>
      <Footer ctx={ctx} />
    </>
  ),
  block,
  GalleryPage,
  WorkPage,
};
