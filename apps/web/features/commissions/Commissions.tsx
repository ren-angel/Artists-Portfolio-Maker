"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpRight, Eye, EyeOff, ImageIcon, Lock, Plus, Sparkles, Trash2, X } from "lucide-react";
import { newBlock, type Commissions as Settings, type Contact, type Draft } from "@studio/shared";
import type { Lang } from "../../shared/lib/copy";
import type { Limits, Update } from "../studio/use-draft";
import { commissionPrice } from "../../entities/portfolio/commission-price";
import { reorder } from "../../shared/lib/reorder";
import { cn } from "../../shared/lib/cn";
import { buttonClasses } from "../../shared/ui/Field";
import { card, EmptyStudio, PageHeader } from "../../shared/ui/studio-kit";

const field = "w-full rounded-lg border border-ink/12 bg-paper px-2.5 py-2 text-[12.5px] focus:border-ink/40 focus:outline-none";
const small = "mb-1 block text-[9.5px] uppercase tracking-[0.14em] text-ink/40";
const CURRENCIES = ["BRL", "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "MXN", "ARS"];
const PRESETS: [string, string][] = [
  ["Headshot", "Headshot"],
  ["Bust", "Busto"],
  ["Half-body", "Meio corpo"],
  ["Full-body", "Corpo inteiro"],
  ["Reference sheet", "Ficha de referência"],
  ["Emotes", "Emotes"],
  ["Illustration", "Ilustração"],
];

function Chips({ l, items, onChange, placeholder }: { l: Lang; items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [v, setV] = useState("");
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((x, i) => (
          <span key={x + i} className="inline-flex items-center gap-1 rounded-full bg-ink/[0.06] py-1 pl-2.5 pr-1 text-[12px]">
            {x}
            <button type="button" aria-label={(l === "en" ? "Remove " : "Remover ") + x} onClick={() => onChange(items.filter((_, j) => j !== i))} className="grid h-5 w-5 place-items-center rounded-full hover:bg-ink/10">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <input
        value={v}
        maxLength={100}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && v.trim()) {
            e.preventDefault();
            if (items.length < 20) onChange([...items, v.trim()]);
            setV("");
          }
        }}
        className={cn(field, "mt-2")}
      />
    </div>
  );
}

export function Commissions({
  d,
  update,
  l,
  site,
  entitled,
  limits,
  onUpgrade,
  onEditPage,
  onPreview,
}: {
  d: Draft;
  update: Update;
  l: Lang;
  site: string;
  entitled: boolean;
  limits: Limits;
  onUpgrade: () => void;
  onEditPage: (id: string) => void;
  onPreview: (id: string) => void;
}) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const c = d.commissions;
  const [editingType, setEditingType] = useState<string | null>(null);
  const set = (fn: (c: Settings) => void) => update((x) => fn(x.commissions));
  const addType = (name: string) => {
    const id = crypto.randomUUID();
    set(x => x.types.push({ id, name, description: "", priceFrom: null, priceTo: null, turnaround: "", artId: null, visible: true }));
    setEditingType(id);
  };
  const thumb = (assetId: string) => "/api/media/" + site + "/" + assetId + "/thumb";
  const placed = d.pages.find((p) => p.blocks.some((b) => b.type === "commissionPrices" || b.type === "commissionStatus"));
  const addSections = () => {
    const blocks = [newBlock("commissionStatus"), newBlock("commissionPrices"), newBlock("commissionTerms"), newBlock("contactLinks")];
    const room = d.pages.length - 1 < limits.pages;
    const id = room ? crypto.randomUUID() : d.home;
    update((x) => {
      if (room) x.pages.push({ id, title: tr("Commissions", "Encomendas"), slug: d.pages.some((p) => p.slug === "commissions") ? "commissions-" + id.slice(0, 4) : "commissions", inNav: true, blocks });
      else x.pages.find((p) => p.id === d.home)!.blocks.push(...blocks);
    });
    onEditPage(id);
  };
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={tr("Studio", "Ateliê")}
        title={tr("Commissions", "Encomendas")}
        subtitle={tr(
          "Show whether you're open, what you offer and how to reach you. Requests and payments happen through the contacts you choose.",
          "Mostre se está aberto, o que oferece e como falar com você. Pedidos e pagamentos acontecem pelos contatos que você escolher.",
        )}
        actions={
          placed ? (
            <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onPreview(placed.id)} className={buttonClasses("paper", "sm")}>
              {tr("Preview page", "Prévia da página")} <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => onEditPage(placed.id)} className={buttonClasses("paper", "sm")}>
              {tr("Edit the page", "Editar a página")}
            </button>
            </div>
          ) : (
            <button type="button" onClick={addSections} className={buttonClasses("ink", "sm")}>
              <Sparkles className="h-3.5 w-3.5" /> {tr("Add a commissions page", "Criar página de encomendas")}
            </button>
          )
        }
      />
      {!entitled && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.2rem] border border-ink/10 bg-lilac/20 p-5">
          <p className="flex items-start gap-3 text-[12.5px] text-ink/65">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            {tr(
              "You can prepare everything now. Commission sections appear on your published site with the Artist or Studio plan; contact buttons work on every plan.",
              "Você já pode preparar tudo. As seções de encomenda aparecem no site publicado com os planos Artista ou Estúdio; os botões de contato funcionam em todos os planos.",
            )}
          </p>
          <button type="button" onClick={onUpgrade} className={buttonClasses("ink", "sm")}>
            {tr("See plans", "Ver planos")}
          </button>
        </div>
      )}

      <section className={cn(card, "grid gap-4 p-5 md:grid-cols-[1fr_1fr]")}>
        <div>
          <span className={small}>{tr("Status", "Status")}</span>
          <div className="flex gap-1 rounded-full border border-ink/10 bg-ink/[0.04] p-1" role="radiogroup" aria-label={tr("Status", "Status")}>
            {(
              [
                ["open", tr("Open", "Abertas"), "bg-mint"],
                ["waitlist", tr("Waitlist", "Lista de espera"), "bg-butter"],
                ["closed", tr("Closed", "Fechadas"), "bg-ink text-paper"],
              ] as const
            ).map(([k, v, tone]) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={c.status === k}
                onClick={() => set((x) => void (x.status = k))}
                className={cn("flex-1 rounded-full py-1.5 text-[12px] font-medium", c.status === k ? tone : "text-ink/55 hover:text-ink")}
              >
                {v}
              </button>
            ))}
          </div>
          <label className="mt-4 block">
            <span className={small}>{tr("Short note", "Recado curto")}</span>
            <textarea rows={2} maxLength={300} value={c.note} onChange={(e) => set((x) => void (x.note = e.target.value))} className={cn(field, "resize-y")} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={small}>{tr("Currency", "Moeda")}</span>
            <select value={c.currency} onChange={(e) => set((x) => void (x.currency = e.target.value))} className={field}>
              {CURRENCIES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={small}>{tr("Typical turnaround", "Prazo típico")}</span>
            <input maxLength={120} value={c.turnaround} placeholder={tr("2–3 weeks", "2–3 semanas")} onChange={(e) => set((x) => void (x.turnaround = e.target.value))} className={field} />
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-[18px] font-semibold tracking-tight">{tr("Commission types", "Tipos de encomenda")}</h2>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.filter(([en, pt]) => !c.types.some((t) => t.name === en || t.name === pt))
              .slice(0, 4)
              .map((p) => (
                <button
                  key={p[0]}
                  type="button"
                  disabled={c.types.length >= 20}
                  onClick={() => addType(p[l === "en" ? 0 : 1])}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-ink/25 px-2.5 py-1 text-[11.5px] text-ink/55 hover:border-ink/50 hover:text-ink"
                >
                  <Plus className="h-3 w-3" /> {p[l === "en" ? 0 : 1]}
                </button>
              ))}

          </div>
        </div>
        {c.types.length === 0 && <EmptyStudio compact tone="butter" title={tr("No commission types yet", "Nenhum tipo ainda")} body={tr("Start with a preset above.", "Comece com uma sugestão acima.")} />}
        <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {c.types.map((t, i) => {
          const art = d.artworks.find(a => a.id === t.artId);
          const amount = commissionPrice(l, c.currency, t.priceFrom, t.priceTo);
          const expanded = editingType === t.id;
          const patch = (fn: (t: Settings["types"][number]) => void) => set((x) => fn(x.types[i]));
          const num = (v: string) => (v === "" ? null : Math.max(0, Math.min(1_000_000, Number(v))));
          return (
            <article key={t.id} className={cn(card, "group min-w-0 overflow-hidden", expanded && "sm:col-span-full")}>
              <button type="button" className="block w-full text-left" aria-expanded={expanded}
                aria-controls={"type-" + t.id} onClick={() => setEditingType(expanded ? null : t.id)}>
                <div className="relative grid h-[130px] place-items-center overflow-hidden bg-lilac/15">
                  {art ? <img src={thumb(art.assetId)} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    : <ImageIcon aria-hidden className="h-6 w-6 text-ink/25" />}
                  <span className="absolute right-2 top-2 rounded-full bg-paper/95 px-2 py-1 text-[10px]">
                    {t.visible ? tr("Visible", "Visível") : tr("Hidden", "Oculto")}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-1">
                    <h3 className="font-display text-[15px] font-semibold">{t.name}</h3>
                    <span className="font-serif italic">{amount}</span>
                  </div>
                  {t.description && <p className="mt-1.5 text-[12px] text-ink/65">{t.description}</p>}
                  <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3 text-[11px]">
                    <span>{t.turnaround || c.turnaround}</span>
                    <span>{expanded ? tr("Close editor", "Fechar edição") : tr("Edit", "Editar")}</span>
                  </div>
                </div>
              </button>
              <div id={"type-" + t.id} hidden={!expanded}>
              <div className="grid gap-4 border-t border-ink/10 p-4 md:grid-cols-[120px_1fr]">
              <label className="block">
                <span className={small}>{tr("Example", "Exemplo")}</span>
                <div className="aspect-square overflow-hidden rounded-lg border border-ink/10 bg-paper">
                  {t.artId && d.artworks.find((a) => a.id === t.artId) && (
                    <img src={thumb(d.artworks.find((a) => a.id === t.artId)!.assetId)} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <select value={t.artId ?? ""} onChange={(e) => patch((x) => void (x.artId = e.target.value || null))} className={cn(field, "mt-1.5 py-1 text-[11px]")}>
                  <option value="">{tr("No image", "Sem imagem")}</option>
                  {d.artworks.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className={small}>{tr("Name", "Nome")}</span>
                  <input maxLength={60} value={t.name} onChange={(e) => patch((x) => void (x.name = e.target.value))} className={field} />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className={small}>{tr("From", "A partir de")} ({c.currency})</span>
                    <input type="number" min={0} step="0.01" value={t.priceFrom ?? ""} onChange={(e) => patch((x) => void (x.priceFrom = num(e.target.value)))} className={field} />
                  </label>
                  <label className="block">
                    <span className={small}>{tr("Up to (optional)", "Até (opcional)")}</span>
                    <input type="number" min={0} step="0.01" value={t.priceTo ?? ""} onChange={(e) => patch((x) => void (x.priceTo = num(e.target.value)))} className={field} />
                  </label>
                </div>
                <label className="block sm:col-span-2">
                  <span className={small}>{tr("Description", "Descrição")}</span>
                  <textarea rows={2} maxLength={500} value={t.description} onChange={(e) => patch((x) => void (x.description = e.target.value))} className={cn(field, "resize-y")} />
                </label>
                <label className="block">
                  <span className={small}>{tr("Turnaround", "Prazo")}</span>
                  <input maxLength={80} value={t.turnaround} onChange={(e) => patch((x) => void (x.turnaround = e.target.value))} className={field} />
                </label>
                <label className="block">
                  <span className={small}>{tr("Gallery of examples", "Galeria de exemplos")}</span>
                  <select value={t.galleryId ?? ""} onChange={e => patch(type => { type.galleryId = e.target.value || null; })} className={field}>
                    <option value="">{tr("No gallery", "Sem galeria")}</option>
                    {d.galleries.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                  </select>
                </label>
                <div className="flex items-end justify-end gap-1">
                  <button type="button" aria-label={tr("Move up", "Mover para cima")} disabled={i === 0} onClick={() => set((x) => reorder(x.types, i, i - 1))} className="grid h-8 w-8 place-items-center rounded-full border border-ink/15 text-ink/50 disabled:opacity-30">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" aria-label={tr("Move down", "Mover para baixo")} disabled={i === c.types.length - 1} onClick={() => set((x) => reorder(x.types, i, i + 1))} className="grid h-8 w-8 place-items-center rounded-full border border-ink/15 text-ink/50 disabled:opacity-30">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" aria-pressed={t.visible} aria-label={tr("Visible", "Visível")} onClick={() => patch((x) => void (x.visible = !x.visible))} className="grid h-8 w-8 place-items-center rounded-full border border-ink/15 text-ink/50">
                    {t.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-coral" />}
                  </button>
                  <button type="button" aria-label={tr("Remove", "Remover")} onClick={() => set((x) => void x.types.splice(i, 1))} className="grid h-8 w-8 place-items-center rounded-full border border-ink/15 text-ink/50 hover:border-coral hover:text-coral">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              </div>
              </div>
            </article>
          );
        })}
          <button type="button" disabled={c.types.length >= 20} onClick={() => addType(tr("New type", "Novo tipo"))}
            className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-[1.1rem] border border-dashed border-ink/25 p-5 text-[12px] text-ink/65 hover:border-ink/50 disabled:opacity-40">
            <Plus className="h-4 w-4" /> {tr("Add a commission type", "Adicionar tipo de encomenda")}
          </button>
        </div>
      </section>

      <section className={cn(card, "grid gap-5 p-5 md:grid-cols-2")}>
        <div>
          <span className={small}>{tr("Happy to draw", "Desenho com prazer")}</span>
          <Chips l={l} items={c.allowed} onChange={(v) => set((x) => void (x.allowed = v))} placeholder={tr("Type and press Enter, e.g. OCs", "Digite e Enter, ex.: OCs")} />
        </div>
        <div>
          <span className={small}>{tr("I won't draw", "Não desenho")}</span>
          <Chips l={l} items={c.disallowed} onChange={(v) => set((x) => void (x.disallowed = v))} placeholder={tr("Type and press Enter, e.g. mecha", "Digite e Enter, ex.: mecha")} />
        </div>
        <label className="block md:col-span-2">
          <span className={small}>{tr("Terms of service", "Termos de serviço")}</span>
          <textarea rows={6} maxLength={5000} value={c.terms} onChange={(e) => set((x) => void (x.terms = e.target.value))} className={cn(field, "resize-y leading-relaxed")} />
        </label>
      </section>

      <section className={cn(card, "p-5")}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-[16px] font-semibold tracking-tight">{tr("How to reach you", "Como falar com você")}</h2>
          <button
            type="button"
            disabled={c.contacts.length >= 10}
            onClick={() => set((x) => x.contacts.push({ kind: "link", label: "", value: "https://" } as Contact))}
            className={buttonClasses("paper", "sm")}
          >
            <Plus className="h-3.5 w-3.5" /> {tr("Add contact", "Adicionar contato")}
          </button>
        </div>
        <p className="mt-1 text-[11.5px] text-ink/45">
          {tr("Email, WhatsApp, social profiles or an external commission form (VGen, Ko-fi, Google Forms…).", "E-mail, WhatsApp, redes sociais ou um formulário externo (VGen, Ko-fi, Google Forms…).")}
        </p>
        <div className="mt-4 space-y-2">
          {c.contacts.map((x, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[140px_1fr_2fr_auto]">
              <select
                aria-label={tr("Type", "Tipo")}
                value={x.kind}
                onChange={(e) => set((s) => void (s.contacts[i] = { kind: e.target.value, label: x.label, value: "" } as Contact))}
                className={field}
              >
                <option value="link">{tr("Link", "Link")}</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
              <input aria-label={tr("Button label", "Texto do botão")} placeholder={tr("Button label", "Texto do botão")} maxLength={40} value={x.label} onChange={(e) => set((s) => void (s.contacts[i].label = e.target.value))} className={field} />
              <input
                aria-label={tr("Address", "Endereço")}
                placeholder={x.kind === "email" ? "you@example.com" : x.kind === "whatsapp" ? "+5511999999999" : "https://"}
                value={x.value}
                onChange={(e) => set((s) => void (s.contacts[i].value = e.target.value))}
                className={cn(field, "font-mono text-[11.5px]")}
              />
              <button type="button" aria-label={tr("Remove", "Remover")} onClick={() => set((s) => void s.contacts.splice(i, 1))} className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-ink/50 hover:border-coral hover:text-coral">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-ink/40">
          {tr("Invalid addresses are not saved; the status bar shows when something needs fixing.", "Endereços inválidos não são salvos; a barra de status avisa quando algo precisa de ajuste.")}
        </p>
      </section>
    </div>
  );
}
