import { commissionPrice } from "../../lib/commission-price";
import type { ReactNode } from "react";
import { ArrowUpRight, Check, Clock, X } from "lucide-react";
import type { Art, Block } from "@studio/shared";
import { Img, Inline, Rich, plain, type Ctx } from "./kit";
import { cn } from "../home/types";

/* Commission sections and alternative artwork grids. They are shared by all
   templates and styled only with each template's palette, typeface and
   accent variables, so they adopt the surrounding design. Phase 2 commission
   tools are informational: no payments are taken here. */

const W = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("mx-auto max-w-[1120px] px-5", className)}>{children}</div>
);
const sy = (rem: number) => ({ paddingBlock: `calc(${rem}rem * var(--sy, 1))` });
const eyebrow = "text-[10px] font-semibold uppercase tracking-[0.22em] text-pf-ink/45";
const STATUS = {
  open: ["Open", "Abertas", "bg-mint text-ink"],
  waitlist: ["Waitlist", "Lista de espera", "bg-butter text-ink"],
  closed: ["Closed", "Fechadas", "bg-pf-ink/10 text-pf-ink/70"],
} as const;

function Heading({ ctx, b, fallback }: { ctx: Ctx; b: Block; fallback: [string, string] }) {
  return (
    <h2 className="font-pf-display text-[28px] leading-[1.05] tracking-[-0.02em] csm:text-[36px]">
      <Inline text={b.heading || ctx.tr(...fallback)} em="italic text-pf-accent" />
    </h2>
  );
}

function Contacts({ ctx, compact = false }: { ctx: Ctx; compact?: boolean }) {
  const list = ctx.d.commissions.contacts;
  if (!list.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {list.map((c, i) => (
        <a
          key={i}
          href={ctx.contactUrl(i)}
          rel="noreferrer nofollow"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[12px] font-medium transition-transform hover:-translate-y-0.5",
            i === 0 ? "border-transparent bg-pf-accent text-white" : "border-pf-ink/20 text-pf-ink/75 hover:border-pf-ink/50",
            compact && "px-3 py-1.5 text-[11px]",
          )}
        >
          {c.label || (c.kind === "email" ? "Email" : c.kind === "whatsapp" ? "WhatsApp" : new URL(c.value).hostname.replace(/^www\./, ""))}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      ))}
    </div>
  );
}

export function commissionBlock(b: Block, ctx: Ctx): ReactNode {
  const c = ctx.d.commissions;
  switch (b.type) {
    case "commissionStatus": {
      const [en, pt, tone] = STATUS[c.status];
      const lead = ctx.d.theme.template === "creative" && ctx.route.kind === "page" &&
        ctx.route.page.blocks.find(block => block.visible)?.id === b.id;
      if (lead) return <W><section style={sy(4)} className="text-center">
        <span className={cn("inline-block -rotate-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]", tone)}>{ctx.tr(en,pt)}</span>
        <h1 className="mx-auto mt-6 max-w-[720px] font-pf-display text-[40px] font-bold leading-[0.95] tracking-[-0.04em] csm:text-[58px]">
          <Inline text={b.heading || ctx.tr("Commissions", "Encomendas")} em="font-serif italic text-pf-accent" />
        </h1>
        <Rich text={b.text || c.note} className="mx-auto mt-5 max-w-[440px] text-[14.5px] leading-relaxed text-pf-ink/65" />
        <div className="mt-7 flex flex-wrap justify-center gap-5 text-[11px] uppercase tracking-[0.14em] text-pf-ink/55">
          {c.turnaround && <span className="inline-flex items-center gap-1.5"><Clock className="h-3 w-3" />{c.turnaround}</span>}
          <span>{ctx.tr("Prices in", "Valores em")} {c.currency}</span>
        </div>
        {c.status !== "closed" && <div className="mt-4 flex justify-center"><Contacts ctx={ctx} compact /></div>}
      </section></W>;
      return (
        <W>
          <section style={sy(3.5)} className={cn("grid gap-6 csm:grid-cols-[1.3fr_1fr] csm:items-end", b.layout === "center" && "text-center csm:grid-cols-1")}>
            <div>
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em]", tone)}>
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                {ctx.tr("Commissions", "Encomendas")} · {ctx.tr(en, pt)}
              </span>
              <div className="mt-4">
                <Heading ctx={ctx} b={b} fallback={["Commissions", "Encomendas"]} />
              </div>
              {(b.text || c.note) && (
                <div className={cn("mt-3 max-w-[520px] space-y-3", b.layout === "center" && "mx-auto")}>
                  <Rich text={b.text || c.note} className="text-[14px] leading-relaxed text-pf-ink/65" />
                </div>
              )}
            </div>
            <div className={cn("space-y-3", b.layout !== "center" && "csm:justify-self-end")}>
              {c.turnaround && (
                <p className="flex items-center gap-2 text-[12px] text-pf-ink/60">
                  <Clock className="h-3.5 w-3.5" /> {c.turnaround}
                </p>
              )}
              {c.status !== "closed" && <Contacts ctx={ctx} />}
            </div>
          </section>
        </W>
      );
    }
    case "commissionPrices": {
      const types = c.types.filter((t) => t.visible);
      if (!types.length) return null;
      return (
        <W>
          <section style={sy(3.5)}>
            <p className={eyebrow}>{ctx.tr("Prices", "Valores")}</p>
            <div className="mt-2">
              <Heading ctx={ctx} b={b} fallback={["What I offer", "O que eu ofereço"]} />
            </div>
            {b.text && <Rich text={b.text} className="mt-3 max-w-[560px] text-[14px] leading-relaxed text-pf-ink/65" />}
            <div className={cn("mt-8 grid gap-4 csm:grid-cols-2", ctx.d.theme.template !== "creative" && "clg:grid-cols-3")}>
              {types.map((t) => {
                const gallery = ctx.galleries.find(g => g.id === t.galleryId);
                const art = ctx.arts.get(t.artId ?? "") ?? (gallery && ctx.cover(gallery));
                return (
                  <article key={t.id} className="group flex flex-col overflow-hidden rounded-[1.5rem] border border-pf-ink/12 bg-pf-surface">
                    {art && <Img ctx={ctx} art={art} className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="font-pf-display text-[20px] leading-tight">{t.name}</h3>
                        <p className="font-serif text-[20px] italic text-pf-accent">{commissionPrice(ctx.l, c.currency, t.priceFrom, t.priceTo)}</p>
                      </div>
                      {gallery && <a href={ctx.galleryHref(gallery)} className="mt-2 text-[12px] underline underline-offset-4">{ctx.tr("See examples", "Ver exemplos")} · {gallery.title}</a>}
                      {t.description && <p className="mt-2 text-[13px] leading-relaxed text-pf-ink/65">{t.description}</p>}
                      {c.status !== "closed" && c.contacts.length > 0 && (
                        <a href={ctx.contactUrl(0)} rel="noreferrer nofollow" className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold underline underline-offset-4">
                          {ctx.tr("Request", "Solicitar")} · {t.name} <ArrowUpRight className="h-3 w-3" />
                        </a>
                      )}
                      {t.turnaround && (
                        <p className="mt-auto flex items-center gap-1.5 pt-4 text-[11px] uppercase tracking-[0.12em] text-pf-ink/45">
                          <Clock className="h-3 w-3" /> {t.turnaround}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </W>
      );
    }
    case "commissionTerms": {
      if (!c.terms && !c.allowed.length && !c.disallowed.length) return null;
      return (
        <W>
          <section style={sy(3.5)}>
            <Heading ctx={ctx} b={b} fallback={["Terms", "Termos"]} />
            <div className="mt-6 grid gap-6 csm:grid-cols-2">
              {[
                [c.allowed, ctx.tr("Happy to draw", "Desenho com prazer"), Check, "text-[#2f8a68]"],
                [c.disallowed, ctx.tr("I won't draw", "Não desenho"), X, "text-pf-accent"],
              ].map(([list, title, Icon, tone]) =>
                (list as string[]).length ? (
                  <div key={title as string} className="rounded-[1.1rem] border border-pf-ink/12 p-5">
                    <p className={eyebrow}>{title as string}</p>
                    <ul className="mt-3 space-y-2">
                      {(list as string[]).map((x) => {
                        const I = Icon as typeof Check;
                        return (
                          <li key={x} className="flex items-start gap-2 text-[13.5px] text-pf-ink/75">
                            <I className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", tone as string)} /> {x}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null,
              )}
            </div>
            {c.terms && (
              <div className="mt-6 space-y-3 rounded-[1.5rem] border border-pf-ink/10 bg-pf-accent/10 p-6">
                <Rich text={c.terms} className="text-[13px] leading-[1.8] text-pf-ink/65" />
              </div>
            )}
          </section>
        </W>
      );
    }
    case "contactLinks":
      if (!c.contacts.length) return null;
      return (
        <W>
          <section style={sy(2.5)} className={cn("flex flex-col gap-4", ctx.d.theme.template === "creative" && "mb-8 rounded-[1.6rem] bg-pf-ink px-6 text-pf-bg", b.layout === "center" && "items-center text-center")}>
            {b.heading && <Heading ctx={ctx} b={b} fallback={["Get in touch", "Fale comigo"]} />}
            {b.text && <Rich text={b.text} className="max-w-[520px] text-[14px] leading-relaxed text-pf-ink/65" />}
            <Contacts ctx={ctx} />
          </section>
        </W>
      );
  }
  return undefined;
}

/** Plan-gated alternatives to a template's own artwork wall. */
export function GridBlock({ ctx, b, works, mode }: { ctx: Ctx; b: Block; works: Art[]; mode: "uniform" | "masonry" }) {
  if (!works.length) return null;
  return (
    <W>
      <section style={sy(3.5)}>
        {b.heading && (
          <h2 className="mb-6 font-pf-display text-[28px] leading-tight tracking-[-0.02em] csm:text-[34px]">
            <Inline text={b.heading} em="italic text-pf-accent" />
          </h2>
        )}
        <div className={mode === "masonry" ? "columns-2 gap-4 csm:columns-3 [&>*]:mb-4" : "grid grid-cols-2 gap-4 csm:grid-cols-3"}>
          {works.map((w) => (
            <a key={w.id} href={ctx.workHref(w)} className="group block break-inside-avoid overflow-hidden rounded-[0.9rem] bg-pf-surface">
              <Img
                ctx={ctx}
                art={w}
                className={cn(
                  "w-full transition-transform duration-700 group-hover:scale-[1.03]",
                  mode === "uniform" ? "aspect-square object-cover" : "h-auto",
                )}
              />
              <span className="sr-only">{plain(w.title)}</span>
            </a>
          ))}
        </div>
      </section>
    </W>
  );
}
