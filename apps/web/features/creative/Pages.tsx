"use client";
import { useState } from "react";
import { Eye, EyeOff, GripVertical, Home, MoreHorizontal, Pencil, Plus, Rocket, Trash2 } from "lucide-react";
import { pageStarters, newBlock, newCreative, cleanPageReferences, type Creative, type Draft } from "@doodallery/shared";
import { ProductFile } from "./ProductFile";
import { CreativeFields } from "./CreativeFields";
import { t, type Lang } from "../../shared/lib/copy";
import type { Limits, Update } from "../studio/use-draft";
import { reorder } from "../../shared/lib/reorder";
import { cn } from "../../shared/lib/cn";
import { EmptyStudio, inkPill, PageHeader } from "../../shared/ui/studio-kit";

/* Port of Design/src/components/dashboard/PagesManager.jsx. Status reflects
   navigation visibility; every page is published together with the site. */

const field = "w-full rounded-lg border border-ink/12 bg-paper px-2.5 py-1.5 text-[12px] focus:border-ink/40 focus:outline-none";

export function Pages({
  d,
  update,
  l,
  limits, creativeEnabled, chapterLimit, site,flush,privateDownloads,
  onEdit,
  only,
}: {
  d: Draft;
  update: Update;
  l: Lang;
  privateDownloads:boolean;site:string;flush:()=>Promise<void>;limits: Limits; creativeEnabled:boolean; chapterLimit:number;
  onEdit: (pageId: string) => void;
  /** Restricts the view and new pages to one specialist kind. */
  only?: Creative["kind"];
}) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const [menu, setMenu] = useState(""),
    [editing, setEditing] = useState(""),
    [drag, setDrag] = useState<number | null>(null);
  const full = d.pages.length - 1 >= limits.pages;
  const patch = (id: string, changes: Partial<Draft["pages"][number]>) => update((x) => Object.assign(x.pages.find((p) => p.id === id)!, changes));
  const [chosenKind, setKind] = useState<Creative["kind"] | "page">("page");
  const kind = only ?? chosenKind;
  const [starter, setStarter] = useState<keyof typeof pageStarters | "">("");
  const starterLabels = {
    comic: tr("Comic artist", "Quadrinista"),
    character: tr("Character designer", "Designer de personagens"),
    illustration: tr("Illustrator", "Ilustrador"),
    photography: tr("Photographer", "Fotógrafo"),
    sculpture: tr("3D artist", "Artista 3D"),
    general: tr("General creative", "Criativo geral"),
  };
  const kinds = {
    page: t(l, "newPage"),
    comic: tr("Comic series", "Série de quadrinhos"),
    character: tr("Character", "Personagem"),
    project: tr("Creative project", "Projeto criativo"),
    product: tr("Digital product", "Produto digital"),
  };
  const intro = only && {
    comic: {
      title: tr("Comics", "Quadrinhos"),
      subtitle: tr(
        "Series, chapters and a reader that gets out of the way. Publish a chapter and it appears in order, with next/previous navigation.",
        "Séries, capítulos e um leitor que não atrapalha. Publique um capítulo e ele aparece em ordem, com navegação entre capítulos.",
      ),
      empty: tr("No comic series yet", "Nenhuma série ainda"),
    },
    character: {
      title: tr("Characters", "Personagens"),
      subtitle: tr(
        "Give your original characters a page of their own: reference sheet, personality, palette and every artwork they appear in.",
        "Dê aos seus personagens originais uma página própria: ficha de referência, personalidade, paleta e todas as artes em que aparecem.",
      ),
      empty: tr("No characters yet", "Nenhum personagem ainda"),
    },
    project: {
      title: tr("Projects", "Projetos"),
      subtitle: tr(
        "Long-form case studies for work that deserves more than a grid: brief, process, credits and the images in between.",
        "Estudos de caso para trabalhos que merecem mais que uma grade: briefing, processo, créditos e as imagens no meio do caminho.",
      ),
      empty: tr("No projects yet", "Nenhum projeto ainda"),
    },
    product: {
      title: tr("Shop", "Loja"),
      subtitle: tr(
        "List artbooks, wallpapers, brushes and downloads on your portfolio. Checkout is handled by your own store; private wallpaper delivery is available on paid plans.",
        "Liste artbooks, wallpapers, pincéis e downloads no seu portfólio. O pagamento acontece na sua própria loja; a entrega privada de wallpapers está disponível nos planos pagos.",
      ),
      empty: tr("No products yet", "Nenhum produto ainda"),
    },
  }[only];
  // Indexes refer to the full page list so reordering keeps navigation order.
  const shown = d.pages.flatMap((page, index) => (!only || page.creative?.kind === only ? [{ page, index }] : []));
  const canAdd = !full && (kind === "page" || creativeEnabled);
  const add = () => {
    const id = crypto.randomUUID();
    update((x) =>
      x.pages.push({ id, slug: kind+"-"+id.slice(0,8), title:kinds[kind], inNav:true, ...(kind!=="page" && {creative:newCreative(kind)}), blocks:starter?pageStarters[starter].map(type=>newBlock(type)):kind==="page"?[{ ...newBlock("heading"), heading: t(l, "newPage") }]:[] }),
    );
    setEditing(id);
  };
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={intro ? t(l, "createNav") : tr("Structure", "Estrutura")}
        title={intro ? intro.title : t(l, "pages")}
        subtitle={intro ? intro.subtitle : tr(
          "Every page in your portfolio. Reorder them to change your navigation, and edit any page in the visual editor.",
          "Todas as páginas do seu portfólio. Reordene para mudar a navegação e edite qualquer página no editor visual.",
        )}
        actions={
          <>{creativeEnabled && <select className={field+" max-w-44"} aria-label={tr("Starter sections","Seções iniciais")} value={starter} onChange={e=>setStarter(e.target.value as typeof starter)}><option value="">{tr("Default sections","Seções padrão")}</option>{Object.entries(starterLabels).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select>}{creativeEnabled && !only && <select aria-label={tr("Page type","Tipo de página")} className={field+" max-w-44"} value={kind} onChange={e=>setKind(e.target.value as typeof kind)}>{Object.entries(kinds).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select>}
          <button type="button" onClick={add} disabled={!canAdd} className={inkPill}>
            <Plus className="h-3.5 w-3.5" /> {only ? tr("New ", "Adicionar ") + kinds[only].toLowerCase() : t(l, "addPage")}
          </button></>
        }
      />

      {only && !creativeEnabled && (
        <p role="note" className="rounded-xl border border-butter bg-butter/25 px-4 py-3 text-[12px] text-ink/70">
          {tr(
            "Creating new specialist pages is not enabled on this server yet. Existing pages stay editable and published.",
            "A criação de novas páginas especiais ainda não está ativada neste servidor. As páginas existentes continuam editáveis e publicadas.",
          )}
        </p>
      )}
      {intro && !shown.length ? (
        <EmptyStudio
          tone="lilac"
          title={intro.empty}
          body={tr("Each one becomes a page of your portfolio, published together with your site.", "Cada um vira uma página do seu portfólio, publicada junto com o site.")}
        >
          <button type="button" onClick={add} disabled={!canAdd} className={inkPill}>
            <Plus className="h-3.5 w-3.5" /> {tr("Create the first one", "Criar o primeiro")}
          </button>
        </EmptyStudio>
      ) : (
      <div className="overflow-hidden rounded-[1.2rem] border border-ink/10 bg-ivory">
        <div className="hidden grid-cols-[auto_1.4fr_1fr_0.8fr_0.8fr_auto] gap-4 border-b border-ink/10 px-4 py-2.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ink/35 lg:grid">
          <span />
          <span>{tr("Page", "Página")}</span>
          <span>{tr("Address", "Endereço")}</span>
          <span>{tr("Status", "Status")}</span>
          <span>{tr("Sections", "Seções")}</span>
          <span />
        </div>

        {shown.map(({ page, index: i }, position) => {
          const home = page.id === d.home;
          const before = shown[position - 1]?.index ?? -1,
            after = shown[position + 1]?.index ?? -1;
          const path = home ? "/" : "/" + page.slug;
          return (
            <div key={page.id} className="border-b border-ink/[0.07] last:border-0">
              <div
                draggable
                onDragStart={() => setDrag(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (drag !== null) update((x) => reorder(x.pages, drag, i));
                  setDrag(null);
                }}
                className={cn(
                  "group grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 hover:bg-paper/60 lg:grid-cols-[auto_1.4fr_1fr_0.8fr_0.8fr_auto] lg:gap-4",
                  drag === i && "opacity-40",
                )}
              >
                <div className="flex items-center gap-1">
                  <GripVertical className="h-3.5 w-3.5 cursor-grab text-ink/20" />
                  <div className="flex flex-col">
                    <button type="button" aria-label={t(l, "up")} disabled={before < 0} onClick={() => update((x) => reorder(x.pages, i, before))} className="text-[9px] leading-none text-ink/25 hover:text-ink disabled:opacity-20">
                      ▲
                    </button>
                    <button
                      type="button"
                      aria-label={t(l, "down")}
                      disabled={after < 0}
                      onClick={() => update((x) => reorder(x.pages, i, after))}
                      className="text-[9px] leading-none text-ink/25 hover:text-ink disabled:opacity-20"
                    >
                      ▼
                    </button>
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-[13.5px] font-medium">
                    {page.title}{page.creative && <button className="rounded-full border border-ink/15 px-2 py-1 text-xs" onClick={()=>setEditing(editing===page.id?"":page.id)}>{kinds[page.creative.kind]}</button>}
                    {home && <Home className="h-3 w-3 shrink-0 text-coral" aria-label={t(l, "homePage")} />}
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-ink/35 lg:hidden">
                    {path} · {page.inNav ? tr("In navigation", "Na navegação") : tr("Hidden", "Oculta")} · {page.blocks.length} {t(l, "sections")}
                  </p>
                </div>

                <span className="hidden truncate font-mono text-[11.5px] text-ink/45 lg:block">{path}</span>
                <span className="hidden lg:block">
                  <span className={cn("rounded-full px-2 py-[2px] text-[9.5px] font-semibold uppercase tracking-wider text-ink/70", page.inNav ? "bg-mint/60" : "bg-butter/70")}>
                    {page.inNav ? tr("In menu", "No menu") : tr("Hidden", "Oculta")}
                  </span>
                </span>
                <span className="hidden text-[11.5px] text-ink/45 lg:block">
                  {page.blocks.length} {t(l, "sections")}
                </span>

                <div className="relative flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEdit(page.id)}
                    className="rounded-full border border-ink/15 px-3 py-1.5 text-[11px] font-medium text-ink/65 hover:border-ink/45 hover:text-ink"
                  >
                    {t(l, "edit")}
                  </button>
                  <button
                    type="button"
                    aria-label={tr("More options for ", "Mais opções para ") + page.title}
                    aria-expanded={menu === page.id}
                    onClick={() => setMenu(menu === page.id ? "" : page.id)}
                    className="grid h-7 w-7 place-items-center rounded-full text-ink/30 hover:bg-ink/[0.05] hover:text-ink"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {menu === page.id && (
                    <>
                      <button type="button" aria-hidden="true" tabIndex={-1} className="fixed inset-0 z-10 cursor-default" onClick={() => setMenu("")} />
                      <div className="u-pop absolute right-0 top-9 z-20 w-56 rounded-[1.1rem] border border-ink/10 bg-ivory p-1.5 shadow-[0_24px_48px_-24px_hsl(var(--ink)/0.45)]">
                        {[
                          { icon: Pencil, text: tr("Rename & address", "Nome e endereço"), run: () => setEditing(editing === page.id ? "" : page.id) },
                          { icon: Home, text: t(l, "homePage"), run: () => update((x) => void (x.home = page.id)), off: home || page.creative?.visible === false },
                          {
                            icon: page.inNav ? EyeOff : Eye,
                            text: page.inNav ? tr("Hide from navigation", "Ocultar da navegação") : tr("Show in navigation", "Mostrar na navegação"),
                            run: () => patch(page.id, { inNav: !page.inNav }),
                          },
                          {
                            icon: Trash2,
                            text: t(l, "remove"),
                            off: home,
                            run: () => {
                              if (confirm(t(l, "deleteAsk"))) update((x) => { x.pages = x.pages.filter((p) => p.id !== page.id); cleanPageReferences(x); });
                            },
                          },
                        ].map((item) => (
                          <button
                            key={item.text}
                            type="button"
                            disabled={item.off}
                            onClick={() => {
                              setMenu("");
                              item.run();
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] text-ink/70 hover:bg-ink/[0.04] hover:text-ink disabled:opacity-35 disabled:hover:bg-transparent"
                          >
                            <item.icon className="h-3.5 w-3.5 text-ink/40" /> {item.text}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {editing === page.id && page.creative?.kind==="product" && <ProductFile entitled={privateDownloads} site={site} page={page.id} flush={flush} l={l}/>}
              {editing === page.id && page.creative && <CreativeFields d={d} page={page} update={update} tr={tr} chapterLimit={chapterLimit}/>}
              {editing === page.id && (
                <div className="u-pop grid gap-3 border-t border-dashed border-ink/10 bg-paper/50 px-4 py-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <label className="block">
                    <span className="mb-1 block text-[9px] uppercase tracking-[0.14em] text-ink/35">{t(l, "title")}</span>
                    <input value={page.title} maxLength={120} onChange={(e) => patch(page.id, { title: e.target.value })} className={field} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[9px] uppercase tracking-[0.14em] text-ink/35">{t(l, "slug")}</span>
                    <input
                      value={page.slug}
                      maxLength={50}
                      onChange={(e) => patch(page.id, { slug: e.target.value.toLowerCase() })}
                      className={cn(field, "font-mono")}
                    />
                  </label>
                  <button type="button" onClick={() => setEditing("")} className="h-8 rounded-full bg-ink px-4 text-[11px] font-medium text-paper">
                    {tr("Done", "Concluir")}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={add}
          disabled={!canAdd}
          className="flex w-full items-center justify-center gap-2 border-t border-dashed border-ink/15 px-4 py-4 text-[12px] text-ink/40 transition-colors hover:bg-paper/60 hover:text-ink disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          {full
            ? t(l, "page_limit")
            : tr(`Add a page, ${limits.pages + 1 - d.pages.length} left`, `Adicionar página, restam ${limits.pages + 1 - d.pages.length}`)}
        </button>
      </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: Eye, title: tr("Hide a page", "Oculte uma página"), body: tr("Hidden pages stay published by address but disappear from navigation.", "Páginas ocultas continuam acessíveis pelo endereço, mas saem da navegação.") },
          { icon: Rocket, title: tr("Set your homepage", "Defina a página inicial"), body: tr("Any page can greet your visitors first.", "Qualquer página pode receber os visitantes primeiro.") },
          { icon: GripVertical, title: tr("Order is navigation", "A ordem é a navegação"), body: tr("Drag pages up or down and your site menu follows.", "Arraste as páginas e o menu do site acompanha.") },
        ].map((x) => (
          <div key={x.title} className="rounded-xl border border-ink/10 bg-ivory p-4">
            <x.icon className="h-4 w-4 text-ink/40" />
            <p className="mt-2.5 text-[12.5px] font-medium">{x.title}</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink/45">{x.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
