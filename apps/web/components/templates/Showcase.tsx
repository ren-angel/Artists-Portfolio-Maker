import type { ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Art, Block } from "@studio/shared";
import {
  Img,
  Inline,
  Rich,
  firstParagraph,
  host,
  neighbours,
  pad,
  plain,
  type Ctx,
  type Gallery,
  type TemplateDesign,
} from "./kit";
import { cn } from "../home/types";

/* Port of Design/src/routes/portfolio.showcase.index.jsx and
   portfolio.showcase.projects.$projectId.jsx: near-black field, amber accent,
   uppercase Archivo, edge-to-edge artwork and wide project rows. */

const W = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("mx-auto max-w-[1240px] px-5", className)}>{children}</div>
);
const sy = (rem: number) => ({ paddingBlock: `calc(${rem}rem * var(--sy, 1))` });
const label = "font-pf-display text-[9.5px] font-semibold uppercase tracking-[0.24em]";
const amber = "text-pf-accent";

function Header({ ctx }: { ctx: Ctx }) {
  const { route, d } = ctx;
  if (route.kind !== "page") {
    const back =
      route.kind === "work"
        ? ctx.galleries.find((g) => g.artIds.includes(route.art.id))
        : undefined;
    return (
      <header className="sticky top-0 z-40 border-b border-pf-ink/10 bg-pf-bg/85 backdrop-blur">
        <W className="flex items-center justify-between py-4">
          <a
            href={back ? ctx.galleryHref(back) : ctx.homeHref}
            className="inline-flex items-center gap-2 font-pf-display text-[10px] font-semibold uppercase tracking-[0.2em] text-pf-ink/50 hover:text-pf-ink"
          >
            <ArrowLeft className="h-3 w-3" /> {back ? back.title : ctx.tr("All work", "Todos os trabalhos")}
          </a>
          <span className="hidden font-pf-display text-[11px] font-extrabold uppercase tracking-[0.24em] csm:block">{d.title}</span>
          <span className="font-pf-display text-[9.5px] uppercase tracking-[0.18em] text-pf-ink/30">{ctx.year}</span>
        </W>
      </header>
    );
  }
  const nav = d.theme.nav;
  const links = ctx.nav.map((p) => (
    <a key={p.id} href={p.href} aria-current={p.current ? "page" : undefined} className={cn("hover:text-pf-ink", p.current && "text-pf-ink")}>
      {p.title}
    </a>
  ));
  return (
    <header className="sticky top-0 z-40 border-b border-pf-ink/10 bg-pf-bg/85 backdrop-blur">
      <W
        className={cn(
          "flex py-4",
          nav === "split" ? "items-center justify-between" : "flex-col gap-2.5",
          nav === "center" && "items-center",
        )}
      >
        <a href={ctx.homeHref} className="font-pf-display text-[12px] font-extrabold uppercase tracking-[0.24em]">
          {d.title}
        </a>
        <nav className="hidden flex-wrap gap-7 font-pf-display text-[10px] font-semibold uppercase tracking-[0.2em] text-pf-ink/45 csm:flex">{links}</nav>
        {nav === "split" && (
          <span className={cn("flex items-center gap-2 font-pf-display text-[9.5px] uppercase tracking-[0.2em]", amber)}>
            <span className="h-1.5 w-1.5 rounded-full bg-pf-accent" /> {ctx.d.artworks.length} {ctx.tr("works", "trabalhos")}
          </span>
        )}
      </W>
      {ctx.nav.length > 0 && (
        <div className="flex gap-6 overflow-x-auto border-t border-pf-ink/10 px-5 py-2.5 font-pf-display text-[9.5px] font-semibold uppercase tracking-[0.2em] text-pf-ink/45 csm:hidden">
          {links}
        </div>
      )}
    </header>
  );
}

function Footer({ ctx }: { ctx: Ctx }) {
  return (
    <footer id="contact" className="border-t border-pf-ink/10">
      <W className="flex flex-col gap-4 py-8 font-pf-display text-[9.5px] font-semibold uppercase tracking-[0.2em] text-pf-ink/30 csm:flex-row csm:items-center csm:justify-between">
        <span>
          © {ctx.year} {ctx.d.title}
          {ctx.d.description && ctx.d.description.length < 60 ? " · " + ctx.d.description : ""}
        </span>
        <span className="flex flex-wrap gap-5">
          {ctx.social.map((url) => (
            <a key={url} href={url} rel="me noreferrer" className="transition-colors hover:text-pf-ink/60">
              {host(url)}
            </a>
          ))}
          <span>
            {ctx.tr("Made with", "Feito com")} {ctx.brand}
          </span>
        </span>
      </W>
    </footer>
  );
}

type Row = { key: string; href: string; art?: Art; kicker: string; title: string; blurb: string; meta: string };

function workRows(ctx: Ctx, works: Art[]): Row[] {
  return works.map((a) => ({
    key: a.id,
    href: ctx.workHref(a),
    art: a,
    kicker: ctx.galleries.find((g) => g.artIds.includes(a.id))?.title ?? ctx.tr("Selected work", "Trabalho selecionado"),
    title: a.title,
    blurb: a.description,
    meta: ctx.d.title,
  }));
}

function SectionBar({ left, right }: { left: string; right: string }) {
  return (
    <W className="py-10">
      <div className={cn("flex items-baseline justify-between text-pf-ink/30", label)}>
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </W>
  );
}

function block(b: Block, ctx: Ctx): ReactNode {
  const a = b.artId ? ctx.arts.get(b.artId) : undefined;
  const g = ctx.galleries.find((v) => v.id === b.galleryId);
  const link = ctx.link(b.url);
  switch (b.type) {
    case "hero": {
      const center = b.layout === "center";
      return (
        <section className="relative h-[76vh] max-h-[860px] min-h-[480px] w-full overflow-hidden">
          {a ? (
            <Img ctx={ctx} art={a} large className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--accent)_25%,transparent),transparent_60%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-pf-bg via-pf-bg/15 to-pf-bg/25" />
          <W className={cn("relative flex h-full flex-col justify-end pb-12", center && "items-center text-center")}>
            {ctx.d.description && <p className={cn("line-clamp-2 max-w-[640px] font-pf-display text-[9.5px] font-semibold uppercase tracking-[0.3em]", amber)}>{ctx.d.description}</p>}
            <h1 className="mt-4 max-w-[900px] whitespace-pre-line font-pf-display text-[42px] font-extrabold uppercase leading-[0.9] tracking-[-0.02em] [overflow-wrap:anywhere] csm:text-[76px] clg:text-[92px]">
              <Inline text={b.heading || ctx.d.title} em={cn("not-italic", amber)} />
            </h1>
            <div className={cn("mt-7 flex w-full flex-wrap items-end justify-between gap-4 border-t border-white/20 pt-5", center && "justify-center")}>
              {b.text && (
                <p className="max-w-[420px] text-[13px] leading-relaxed text-pf-ink/60">
                  <Inline text={firstParagraph(b.text)} />
                </p>
              )}
              <a href={link ?? "#work"} className="flex items-center gap-2 font-pf-display text-[10px] font-semibold uppercase tracking-[0.2em] text-pf-ink/60 hover:text-pf-ink">
                {ctx.tr("Enter", "Entrar")} {link ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
              </a>
            </div>
          </W>
        </section>
      );
    }
    case "featured":
    case "galleryGrid": {
      const works = b.type === "featured" ? ctx.featured : g ? ctx.works(g) : [];
      if (!works.length) return null;
      return (
        <section id="work" className="scroll-mt-16 border-t border-pf-ink/10">
          <SectionBar left={plain(b.heading) || g?.title || ctx.tr("Selected projects", "Projetos selecionados")} right={pad(works.length)} />
          <Rows ctx={ctx} rows={workRows(ctx, works)} />
        </section>
      );
    }
    case "galleryPreview": {
      const list = b.galleryId ? ctx.galleries.filter((v) => v.id === b.galleryId) : ctx.galleries;
      if (!list.length) return null;
      const rows = list.map<Row>((v) => ({
        key: v.id,
        href: ctx.galleryHref(v),
        art: ctx.cover(v),
        kicker: v.artIds.length + " " + ctx.tr("frames", "quadros"),
        title: v.title,
        blurb: v.description,
        meta: ctx.tr("Project", "Projeto"),
      }));
      return (
        <section className="scroll-mt-16 border-t border-pf-ink/10">
          <SectionBar left={plain(b.heading) || ctx.tr("Projects", "Projetos")} right={pad(list.length)} />
          <Rows ctx={ctx} rows={rows} />
        </section>
      );
    }
    case "about":
      return (
        <section id="about" className="scroll-mt-16">
          <W className={cn("grid gap-10 clg:gap-16", a && (b.layout === "right" ? "clg:grid-cols-[1.1fr_0.9fr]" : "clg:grid-cols-[0.9fr_1.1fr]"))}>
              {a && (
                <div className={cn("overflow-hidden border border-pf-ink/10", b.layout === "right" && "clg:order-2")} style={{ marginBlock: "calc(4rem * var(--sy, 1))" }}>
                  <Img ctx={ctx} art={a} className="aspect-[3/4] w-full object-cover" />
                </div>
              )}
              <div className="flex flex-col justify-center" style={sy(4)}>
                <p className={cn(label, "tracking-[0.28em]", amber)}>{ctx.tr("About", "Sobre")}</p>
                <h2 className="mt-4 whitespace-pre-line font-pf-display text-[28px] font-extrabold uppercase leading-[1] tracking-[-0.01em] csm:text-[40px]">
                  <Inline text={b.heading || ctx.d.title} em={cn("not-italic", amber)} />
                </h2>
                <div className="mt-5 max-w-[460px] space-y-4">
                  <Rich text={b.text} className="text-[13.5px] leading-[1.85] text-pf-ink/55" />
                </div>
                {ctx.social.length > 0 && (
                  <div className="mt-8 border-t border-pf-ink/15 pt-6">
                    <p className={cn("font-pf-display text-[9px] font-semibold uppercase tracking-[0.24em] text-pf-ink/30")}>{ctx.tr("Find me", "Onde me encontrar")}</p>
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 font-pf-display text-[11px] font-semibold uppercase tracking-[0.12em] text-pf-ink/55">
                      {ctx.social.map((url) => (
                        <a key={url} href={url} rel="me noreferrer" className="hover:text-pf-ink">
                          {host(url)}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {link && (
                  <div className="mt-8 flex flex-wrap gap-3">
                    <a href={link} rel="noreferrer" className="inline-flex items-center gap-2 bg-pf-accent px-5 py-3 font-pf-display text-[10px] font-bold uppercase tracking-[0.2em] text-pf-bg transition-transform hover:-translate-y-0.5">
                      {ctx.tr("Start a project", "Iniciar um projeto")} <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </div>
          </W>
        </section>
      );
    case "image":
      return (
        a && (
          <W>
            <figure style={sy(2.5)}>
              <div className="overflow-hidden border border-pf-ink/10">
                <Img ctx={ctx} art={a} large className="aspect-[21/9] w-full object-cover" />
              </div>
              <figcaption className={cn("mt-3 flex flex-wrap justify-between gap-2 font-pf-display text-[9px] uppercase tracking-[0.2em] text-pf-ink/30")}>
                <span>{plain(b.heading) || a.title}</span>
                {b.text && <span>{plain(b.text)}</span>}
              </figcaption>
            </figure>
          </W>
        )
      );
    case "heading":
      return (
        <W>
          <div style={sy(2.5)} className="border-t border-pf-ink/10">
            {b.text && <p className={cn(label, amber)}>{plain(b.text)}</p>}
            <h2 className="mt-3 font-pf-display text-[30px] font-extrabold uppercase leading-[0.95] tracking-[-0.01em] csm:text-[42px]">
              <Inline text={b.heading} em={cn("not-italic", amber)} />
            </h2>
          </div>
        </W>
      );
    case "richText":
      return (
        <W>
          <section style={sy(3)} className={cn("grid gap-6", b.heading && "clg:grid-cols-[0.8fr_1.2fr]", b.layout === "center" && "text-center")}>
            {b.heading && (
              <h2 className="font-pf-display text-[24px] font-extrabold uppercase leading-[1] tracking-[-0.01em] csm:text-[30px]">
                <Inline text={b.heading} em={cn("not-italic", amber)} />
              </h2>
            )}
            <div className={cn("max-w-[560px] space-y-4", b.layout === "center" && "mx-auto")}>
              <Rich text={b.text} className="text-[14px] leading-[1.85] text-pf-ink/60" />
            </div>
          </section>
        </W>
      );
    case "cta":
    case "contact": {
      if (b.type === "cta" && !link) return null;
      return (
        <section className="border-y border-pf-ink/10 bg-pf-surface/40">
          <W className={cn("flex flex-col gap-6 clg:flex-row clg:items-end clg:justify-between", b.layout === "center" && "items-center text-center clg:flex-col clg:items-center")} >
            <div style={sy(4)} className="!pb-0 clg:!pb-[calc(4rem*var(--sy,1))]">
              <p className={cn(label, amber)}>{b.type === "contact" ? ctx.tr("Contact", "Contato") : link ? host(link) : ""}</p>
              <h2 className="mt-3 max-w-[760px] whitespace-pre-line font-pf-display text-[32px] font-extrabold uppercase leading-[0.92] tracking-[-0.01em] csm:text-[54px]">
                <Inline text={b.heading || ctx.tr("Let's build a world", "Vamos construir um mundo")} em={cn("not-italic", amber)} />
              </h2>
              {b.text && (
                <div className="mt-4 max-w-[460px] space-y-3">
                  <Rich text={b.text} className="text-[13px] leading-relaxed text-pf-ink/55" />
                </div>
              )}
            </div>
            {link && (
              <a
                href={link}
                rel="noreferrer"
                className="mb-[calc(4rem*var(--sy,1))] inline-flex shrink-0 items-center gap-2 bg-pf-accent px-5 py-3 font-pf-display text-[10px] font-bold uppercase tracking-[0.2em] text-pf-bg transition-transform hover:-translate-y-0.5"
              >
                {b.type === "contact" ? host(link) : ctx.tr("Start a project", "Iniciar um projeto")} <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            )}
          </W>
        </section>
      );
    }
    case "social":
      if (!ctx.social.length) return null;
      return (
        <W>
          <section style={sy(2.5)} className="flex flex-wrap items-center gap-3">
            {b.heading && <p className={cn(label, "mr-4 text-pf-ink/30")}>{plain(b.heading)}</p>}
            {ctx.social.map((url) => (
              <a key={url} href={url} rel="me noreferrer" className="inline-flex items-center gap-2 border border-pf-ink/25 px-5 py-3 font-pf-display text-[10px] font-bold uppercase tracking-[0.2em] text-pf-ink/70 hover:border-pf-ink/60 hover:text-pf-ink">
                {host(url)} <ArrowUpRight className="h-3 w-3" />
              </a>
            ))}
          </section>
        </W>
      );
    case "divider":
      return <hr className="border-pf-ink/10" style={{ marginBlock: "calc(1.5rem * var(--sy, 1))" }} />;
  }
}

/** Alternating case-study rows with large 16:10 frames. */
function Rows({ ctx, rows }: { ctx: Ctx; rows: Row[] }) {
  return (
    <div className="divide-y divide-pf-ink/10 border-y border-pf-ink/10">
      {rows.map((r, i) => (
        <a key={r.key} href={r.href} className="group block">
          <div className={cn("mx-auto grid max-w-[1240px] items-center gap-6 px-5 py-8 clg:grid-cols-2 clg:gap-14 clg:py-14", i % 2 === 1 && "clg:[&>*:first-child]:order-2")}>
            <div className="relative overflow-hidden bg-pf-surface">
              {r.art ? (
                <Img ctx={ctx} art={r.art} className="aspect-[16/10] w-full object-cover transition-transform duration-[1100ms] group-hover:scale-[1.04]" />
              ) : (
                <div className="aspect-[16/10]" />
              )}
              <span className="absolute left-3 top-3 font-pf-display text-[9px] font-semibold uppercase tracking-[0.2em] text-white/60">{pad(i + 1)}</span>
            </div>
            <div>
              <p className={cn("font-pf-display text-[9.5px] font-semibold uppercase tracking-[0.22em]", amber)}>{r.kicker}</p>
              <h2 className="mt-3 font-pf-display text-[30px] font-extrabold uppercase leading-[0.95] tracking-[-0.01em] [overflow-wrap:anywhere] csm:text-[42px]">{r.title}</h2>
              {r.blurb && <p className="mt-3 line-clamp-3 max-w-[380px] text-[13px] leading-relaxed text-pf-ink/50">{r.blurb}</p>}
              <div className="mt-5 flex items-center gap-4 font-pf-display text-[10px] font-semibold uppercase tracking-[0.18em] text-pf-ink/35">
                <span>{r.meta}</span>
                <span className="h-px w-8 bg-pf-ink/20" />
                <span className="flex items-center gap-1 text-pf-ink/70 transition-colors group-hover:text-pf-accent">
                  {ctx.tr("Open", "Abrir")} <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

function Cinematic({ ctx, art, kicker, title }: { ctx: Ctx; art?: Art; kicker: string; title: string }) {
  return (
    <div className="relative h-[60vh] max-h-[720px] min-h-[380px] overflow-hidden">
      {art && <Img ctx={ctx} art={art} large className="absolute inset-0 h-full w-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-t from-pf-bg via-transparent to-transparent" />
      <W className="relative flex h-full flex-col justify-end pb-8">
        <p className={cn("font-pf-display text-[9px] font-semibold uppercase tracking-[0.26em]", amber)}>{kicker}</p>
        <h1 className="mt-3 font-pf-display text-[36px] font-extrabold uppercase leading-[0.92] tracking-[-0.01em] [overflow-wrap:anywhere] csm:text-[62px]">{title}</h1>
      </W>
    </div>
  );
}

function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-4 font-pf-display text-[10px] uppercase tracking-[0.16em]">
      {rows.map(([k, v]) => (
        <div key={k} className="border-t border-pf-ink/10 pt-2.5">
          <dt className="text-pf-ink/30">{k}</dt>
          <dd className="mt-1 text-pf-ink/70">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function NextLink({ href, kicker, title }: { href: string; kicker: string; title: string }) {
  return (
    <a href={href} className="group block border-t border-pf-ink/10">
      <W className="flex items-center justify-between gap-6 py-10">
        <div>
          <p className="font-pf-display text-[9px] font-semibold uppercase tracking-[0.24em] text-pf-ink/30">{kicker}</p>
          <p className="mt-2 font-pf-display text-[24px] font-extrabold uppercase leading-none tracking-[-0.01em] csm:text-[34px]">{title}</p>
        </div>
        <ArrowUpRight className="h-6 w-6 shrink-0 text-pf-ink/40 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
      </W>
    </a>
  );
}

function GalleryPage({ ctx, gallery }: { ctx: Ctx; gallery: Gallery }) {
  const works = ctx.works(gallery);
  const { next } = neighbours(ctx.galleries, gallery);
  const [first, second, third, ...rest] = works;
  return (
    <>
      <Cinematic ctx={ctx} art={ctx.cover(gallery)} kicker={works.length + " " + ctx.tr("frames", "quadros")} title={gallery.title} />
      <W className="grid gap-10 border-b border-pf-ink/10 py-12 clg:grid-cols-[1fr_1fr]">
        <p className="max-w-[520px] text-[14px] leading-[1.85] text-pf-ink/60">
          {gallery.description || ctx.tr("A collection of work by ", "Uma coleção de trabalhos de ") + ctx.d.title + "."}
        </p>
        <Facts
          rows={[
            [ctx.tr("Artist", "Artista"), ctx.d.title],
            [ctx.tr("Frames", "Quadros"), pad(works.length)],
            [ctx.tr("Collection", "Coleção"), gallery.title],
            [ctx.tr("Year", "Ano"), ctx.year],
          ]}
        />
      </W>
      <W className="space-y-4 py-10">
        {works.length === 0 && <p className="text-[13px] text-pf-ink/50">{ctx.tr("No artwork in this gallery yet.", "Esta galeria ainda não tem obras.")}</p>}
        {(first || second) && (
          <div className="grid gap-4 csm:grid-cols-2">
            {[first, second].filter(Boolean).map((w) => (
              <a key={w.id} href={ctx.workHref(w)} className="group overflow-hidden border border-pf-ink/10">
                <Img ctx={ctx} art={w} className="aspect-[4/3] w-full object-cover transition-transform duration-[1100ms] group-hover:scale-[1.03]" />
              </a>
            ))}
          </div>
        )}
        {third && (
          <a href={ctx.workHref(third)} className="group block overflow-hidden border border-pf-ink/10">
            <Img ctx={ctx} art={third} large className="aspect-[21/9] w-full object-cover transition-transform duration-[1100ms] group-hover:scale-[1.03]" />
          </a>
        )}
        {rest.length > 0 && (
          <div className="grid gap-4 csm:grid-cols-3">
            {rest.map((w) => (
              <a key={w.id} href={ctx.workHref(w)} className="group overflow-hidden border border-pf-ink/10">
                <Img ctx={ctx} art={w} className="aspect-[4/3] w-full object-cover transition-transform duration-[1100ms] group-hover:scale-[1.03]" />
              </a>
            ))}
          </div>
        )}
        {works.length > 0 && (
          <p className="font-pf-display text-[9px] uppercase tracking-[0.2em] text-pf-ink/25">
            {works.map((w) => w.title).join(" · ")}
          </p>
        )}
      </W>
      {next && next.id !== gallery.id && <NextLink href={ctx.galleryHref(next)} kicker={ctx.tr("Next project", "Próximo projeto")} title={next.title} />}
    </>
  );
}

function WorkPage({ ctx, art }: { ctx: Ctx; art: Art }) {
  const g = ctx.galleries.find((v) => v.artIds.includes(art.id));
  const list = g ? ctx.works(g) : ctx.d.artworks;
  const { next, index } = neighbours(list, art);
  return (
    <>
      <Cinematic ctx={ctx} art={art} kicker={g?.title ?? ctx.tr("Selected work", "Trabalho selecionado")} title={art.title} />
      <W className="grid gap-10 border-b border-pf-ink/10 py-12 clg:grid-cols-[1fr_1fr]">
        <div className="max-w-[520px] space-y-4">
          {art.description ? (
            <Rich text={art.description} className="text-[14px] leading-[1.85] text-pf-ink/60" />
          ) : (
            <p className="text-[14px] leading-[1.85] text-pf-ink/60">{art.alt || art.title}</p>
          )}
        </div>
        <Facts
          rows={[
            [ctx.tr("Artist", "Artista"), ctx.d.title],
            [ctx.tr("Frame", "Quadro"), pad(index + 1) + " / " + pad(list.length)],
            ...(g ? [[ctx.tr("Project", "Projeto"), g.title] as [string, ReactNode]] : []),
          ]}
        />
      </W>
      <W className="py-10">
        <div className="overflow-hidden border border-pf-ink/10">
          <Img ctx={ctx} art={art} large className="w-full object-contain" />
        </div>
      </W>
      {next && next.id !== art.id && <NextLink href={ctx.workHref(next)} kicker={ctx.tr("Next frame", "Próximo quadro")} title={next.title} />}
    </>
  );
}

export const showcase: TemplateDesign = {
  palettes: {
    original: { bg: "#141320", ink: "#F2EDE4", surface: "#1D1B2C" },
    warm: { bg: "#1C1612", ink: "#F4E9DC", surface: "#261E18" },
    cool: { bg: "#0F1622", ink: "#E6EEF4", surface: "#172131" },
    noir: { bg: "#08080C", ink: "#F2EDE4", surface: "#14141B" },
  },
  display: '"UI Archivo", ui-sans-serif, sans-serif',
  body: '"UI DM Sans", system-ui, sans-serif',
  root: "bg-pf-bg text-pf-ink",
  tint: "bg-pf-accent/10",
  paper: "bg-pf-surface",
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
