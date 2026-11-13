"use client";
import { useState } from "react";
import { Eye, EyeOff, GripVertical, Home, MoreHorizontal, Pencil, Plus, Rocket, Trash2 } from "lucide-react";
import { newBlock, type Draft } from "@studio/shared";
import { t, type Lang } from "../../lib/copy";
import type { Limits, Update } from "../../lib/use-draft";
import { reorder } from "../../lib/reorder";
import { cn } from "../home/types";
import { inkPill, PageHeader } from "./parts";

/* Port of Design/src/components/dashboard/PagesManager.jsx. Status reflects
   navigation visibility; every page is published together with the site. */

const field = "w-full rounded-lg border border-ink/12 bg-paper px-2.5 py-1.5 text-[12px] focus:border-ink/40 focus:outline-none";

export function Pages({
  d,
  update,
  l,
  limits,
  onEdit,
}: {
  d: Draft;
  update: Update;
  l: Lang;
  limits: Limits;
  onEdit: (pageId: string) => void;
}) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const [menu, setMenu] = useState(""),
    [editing, setEditing] = useState(""),
    [drag, setDrag] = useState<number | null>(null);
  const full = d.pages.length - 1 >= limits.pages;
  const patch = (id: string, changes: Partial<Draft["pages"][number]>) => update((x) => Object.assign(x.pages.find((p) => p.id === id)!, changes));
  const add = () => {
    const id = crypto.randomUUID();
    update((x) =>
      x.pages.push({ id, slug: "page-" + id.slice(0, 6), title: t(l, "newPage"), inNav: true, blocks: [{ ...newBlock("heading"), heading: t(l, "newPage") }] }),
    );
    setEditing(id);
  };
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={tr("Structure", "Estrutura")}
        title={t(l, "pages")}
        subtitle={tr(
          "Every page in your portfolio. Reorder them to change your navigation, and edit any page in the visual editor.",
          "Todas as páginas do seu portfólio. Reordene para mudar a navegação e edite qualquer página no editor visual.",
        )}
        actions={
          <button type="button" onClick={add} disabled={full} className={inkPill}>
            <Plus className="h-3.5 w-3.5" /> {t(l, "addPage")}
          </button>
        }
      />

      <div className="overflow-hidden rounded-[1.2rem] border border-ink/10 bg-ivory">
        <div className="hidden grid-cols-[auto_1.4fr_1fr_0.8fr_0.8fr_auto] gap-4 border-b border-ink/10 px-4 py-2.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ink/35 lg:grid">
          <span />
          <span>{tr("Page", "Página")}</span>
          <span>{tr("Address", "Endereço")}</span>
          <span>{tr("Status", "Status")}</span>
          <span>{tr("Sections", "Seções")}</span>
          <span />
        </div>

        {d.pages.map((page, i) => {
          const home = page.id === d.home;
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
                    <button type="button" aria-label={t(l, "up")} disabled={i === 0} onClick={() => update((x) => reorder(x.pages, i, i - 1))} className="text-[9px] leading-none text-ink/25 hover:text-ink disabled:opacity-20">
                      ▲
                    </button>
                    <button
                      type="button"
                      aria-label={t(l, "down")}
                      disabled={i === d.pages.length - 1}
                      onClick={() => update((x) => reorder(x.pages, i, i + 1))}
                      className="text-[9px] leading-none text-ink/25 hover:text-ink disabled:opacity-20"
                    >
                      ▼
                    </button>
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-[13.5px] font-medium">
                    {page.title}
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
                          { icon: Home, text: t(l, "homePage"), run: () => update((x) => void (x.home = page.id)), off: home },
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
                              if (confirm(t(l, "deleteAsk"))) update((x) => void (x.pages = x.pages.filter((p) => p.id !== page.id)));
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
          disabled={full}
          className="flex w-full items-center justify-center gap-2 border-t border-dashed border-ink/15 px-4 py-4 text-[12px] text-ink/40 transition-colors hover:bg-paper/60 hover:text-ink disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          {full
            ? t(l, "page_limit")
            : tr(`Add a page — ${limits.pages + 1 - d.pages.length} left`, `Adicionar página — restam ${limits.pages + 1 - d.pages.length}`)}
        </button>
      </div>

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
