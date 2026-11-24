"use client";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  ChevronLeft,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  Images,
  Layers,
  LayoutGrid,
  Palette,
  Plus,
  Type,
} from "lucide-react";
import { containerChoices, creativeBlockTypes, type Block, type Draft } from "@doodallery/shared";
import { t } from "../../shared/lib/copy";
import { blockName, library, takesArt, takesGallery } from "./blocks";
import { Lock } from "lucide-react";
import { RevisionPanel } from "./RevisionPanel";
import { ThemePanel } from "./ThemePanel";
import { cn } from "../../shared/lib/cn";
import type { EditorProps } from "./Editor";

export type RailTab = "pages" | "blocks" | "galleries" | "media" | "theme" | "layers";
const TABS = [
  { id: "pages", icon: FileText, key: "pages" },
  { id: "blocks", icon: LayoutGrid, key: "blocks" },
  { id: "galleries", icon: Images, key: "galleries" },
  { id: "media", icon: Type, key: "media" },
  { id: "theme", icon: Palette, key: "theme" },
  { id: "layers", icon: Layers, key: "layers" },
] as const;
const label = "text-[9px] uppercase tracking-[0.18em] text-ink/35";

export function LeftRail(
  props: EditorProps & {
    tab: RailTab;
    setTab: (t: RailTab) => void;
    open: boolean;
    setOpen: (b: boolean) => void;
    page: Draft["pages"][number];
    selected: string | null;
    block: Block | null;
    onSelect: (id: string) => void;
    onPage: (id: string) => void;
    onAddPage: () => void;
    onAdd: (type: Block["type"], init?: Partial<Block>) => void;
    onMove: (from: number, to: number) => void;
    onToggle: (id: string) => void;
    onPatch: (v: Partial<Block>) => void;
    edit: (change: (x: Draft) => void, key?: string) => void;
  },
) {
  const { d, l, site, tab, setTab, open, setOpen, page, selected, block, limits } = props;
  const [drag, setDrag] = useState<number | null>(null);
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const thumb = (assetId: string) => "/api/media/" + site + "/" + assetId + "/thumb";
  const arts = new Map(d.artworks.map((a) => [a.id, a]));
  return (
    <div className="flex h-full shrink-0">
      <div className="flex w-12 flex-col items-center gap-1 border-r border-ink/10 bg-ivory py-3" role="tablist" aria-orientation="vertical">
        {TABS.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={tab === v.id && open}
            onClick={() => {
              setTab(v.id);
              setOpen(tab === v.id ? !open : true);
            }}
            title={t(l, v.key)}
            aria-label={t(l, v.key)}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-lg transition-colors",
              tab === v.id && open ? "bg-ink text-paper" : "text-ink/40 hover:bg-ink/[0.05] hover:text-ink",
            )}
          >
            <v.icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      {open && (
        <div className="flex w-[228px] flex-col border-r border-ink/10 bg-ivory">
          <div className="flex items-center justify-between border-b border-ink/10 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/40">
              {t(l, TABS.find((v) => v.id === tab)!.key)}
            </p>
            <button type="button" onClick={() => setOpen(false)} aria-label={t(l, "cancel")} className="text-ink/35 hover:text-ink">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5">
            {tab === "pages" && props.creativeEnabled && <RevisionPanel key={page.id} {...props} page={page} block={block}/>}
            {tab === "pages" && (
              <div className="space-y-1">
                {d.pages.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => props.onPage(p.id)}
                    aria-current={p.id === page.id ? "page" : undefined}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-ink/[0.04]",
                      p.id === page.id && "bg-ink/[0.05]",
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", p.inNav ? "bg-mint" : "bg-butter")} />
                    <span className="flex-1 truncate text-[12px]">{p.title}</span>
                    <span className="font-mono text-[9.5px] text-ink/30">/{p.id === d.home ? "" : p.slug}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={props.onAddPage}
                  disabled={d.pages.length - 1 >= limits.pages}
                  className="mt-2 flex w-full items-center gap-1.5 rounded-lg border border-dashed border-ink/25 px-2 py-2 text-[11.5px] text-ink/45 hover:border-ink/50 hover:text-ink disabled:opacity-40 disabled:hover:border-ink/25"
                >
                  <Plus className="h-3 w-3" /> {t(l, "addPage")}
                </button>
                <ManageLink onClick={() => props.onExit("pages")} text={t(l, "manage") + " " + t(l, "pages").toLowerCase()} />
              </div>
            )}

            {tab === "blocks" && (
              <div className="grid grid-cols-2 gap-1.5">
                {library.filter(b=>props.creativeEnabled || !creativeBlockTypes.some(t=>t===b.type)).map((b) => (
                  <button
                    key={b.type}
                    type="button"
                    onClick={() => props.onAdd(b.type)}
                    className="group rounded-lg border border-ink/10 bg-paper p-2 text-left transition-all hover:-translate-y-0.5 hover:border-ink/35"
                  >
                    <BlockGlyph type={b.type} />
                    <span className="flex items-center gap-1 text-[10.5px] font-medium leading-tight">
                      {blockName(l, b.type)}
                      {b.type.startsWith("commission") && !props.features.commissions && <Lock className="h-2.5 w-2.5 shrink-0 text-ink/40" aria-label={t(l, "locked")} />}
                    </span>
                    <span className="mt-0.5 block text-[9px] leading-tight text-ink/35">{l === "en" ? b.hint[0] : b.hint[1]}</span>
                  </button>
                ))}
              </div>
            )}

            {tab === "galleries" && (
              <div className="space-y-1.5">
                {d.galleries.length === 0 && <Empty text={tr("No galleries yet.", "Nenhuma galeria ainda.")} />}
                {d.galleries.map((g) => {
                  const cover = arts.get(g.cover ?? g.artIds[0] ?? "");
                  return (
                    <button
                      key={g.id}
                      type="button"
                      title={t(l, "insertGallery")}
                      onClick={() =>
                        block && takesGallery(block.type) ? props.onPatch({ galleryId: g.id }) : props.onAdd("galleryGrid", { galleryId: g.id })
                      }
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg p-1.5 text-left hover:bg-ink/[0.04]",
                        block?.galleryId === g.id && "bg-coral/10",
                      )}
                    >
                      {cover ? (
                        <img src={thumb(cover.assetId)} alt="" className="h-8 w-8 shrink-0 rounded-md object-cover" />
                      ) : (
                        <span className="h-8 w-8 shrink-0 rounded-md bg-ink/[0.06]" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11.5px] font-medium">{g.title}</span>
                        <span className="block text-[9.5px] text-ink/35">
                          {g.artIds.length} {t(l, "works")}
                          {!g.visible && " · " + tr("hidden", "oculta")}
                        </span>
                      </span>
                      <Plus className="h-3 w-3 shrink-0 text-ink/30" />
                    </button>
                  );
                })}
                <ManageLink onClick={() => props.onExit("galleries")} text={t(l, "manage") + " " + t(l, "galleries").toLowerCase()} />
              </div>
            )}

            {tab === "media" && (
              <>
                <div className="grid grid-cols-3 gap-1">
                  {d.artworks.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      title={a.title}
                      onClick={() =>
                        block && takesArt(block.type) ? props.onPatch({ artId: a.id }) : props.onAdd("image", { artId: a.id })
                      }
                      className={cn(
                        "overflow-hidden rounded-md ring-offset-1 hover:ring-2 hover:ring-coral",
                        block?.artId === a.id && "ring-2 ring-coral",
                      )}
                    >
                      <img src={thumb(a.assetId)} alt={a.alt || a.title} className="aspect-square w-full object-cover" loading="lazy" />
                    </button>
                  ))}
                  <label
                    title={t(l, "upload")}
                    className="grid aspect-square cursor-pointer place-items-center rounded-md border border-dashed border-ink/30 text-ink/35 hover:border-ink/60 hover:text-ink"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      aria-label={t(l, "upload")}
                      onChange={(e) => {
                        props.onUpload(Array.from(e.target.files ?? []));
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {props.progress !== null && (
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuenow={props.progress} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-coral transition-all" style={{ width: props.progress + "%" }} />
                  </div>
                )}
                <p className="mt-3 text-[10px] leading-relaxed text-ink/40">
                  {block && takesArt(block.type)
                    ? tr("Click a work to place it in the selected section.", "Clique em uma obra para colocá-la na seção selecionada.")
                    : tr("Click a work to add it as an image section.", "Clique em uma obra para adicioná-la como seção de imagem.")}
                </p>
                <ManageLink onClick={() => props.onExit("library")} text={t(l, "library")} />
              </>
            )}

            {tab === "theme" && <ThemePanel d={d} l={l} edit={props.edit} features={props.features} />}

            {tab === "layers" && (
              <div className="space-y-1">
                {page.blocks.map((b, i) => (
                  <div
                    key={b.id}
                    style={{marginInlineStart:b.parentId?"0.75rem":undefined}}
                    draggable
                    onDragStart={(e) => {
                      setDrag(i);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (drag !== null) {
                        const moving = page.blocks[drag];
                        if (
                          b.type === "columns" &&
                          containerChoices(page.blocks, moving).some((parent) => parent.id === b.id)
                        ) {
                          props.edit((x) => {
                            x.pages
                              .find((p) => p.id === page.id)!
                              .blocks.find((k) => k.id === moving.id)!.parentId = b.id;
                          });
                        } else props.onMove(drag, i);
                      }
                      setDrag(null);
                    }}
                    onDragEnd={() => setDrag(null)}
                    className={cn(
                      "flex items-center gap-1 rounded-lg border px-1.5 py-1.5",
                      selected === b.id ? "border-coral bg-coral/10" : "border-transparent hover:bg-ink/[0.04]",
                      drag === i && "opacity-40",
                    )}
                  >
                    <GripVertical className="h-3 w-3 shrink-0 cursor-grab text-ink/25" />
                    <button
                      type="button"
                      onClick={() => props.onSelect(b.id)}
                      className={cn("flex-1 truncate text-left text-[11.5px]", !b.visible && "text-ink/35 line-through")}
                    >
                      {blockName(l, b.type)}
                      {b.heading && <span className="text-ink/35"> · {b.heading.replace(/[*\n]/g, " ")}</span>}
                    </button>
                    <button
                      type="button"
                      aria-label={t(l, "up")}
                      disabled={i === 0}
                      onClick={() => props.onMove(i, i - 1)}
                      className="text-ink/30 hover:text-ink disabled:opacity-20"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      aria-label={t(l, "down")}
                      disabled={i === page.blocks.length - 1}
                      onClick={() => props.onMove(i, i + 1)}
                      className="text-ink/30 hover:text-ink disabled:opacity-20"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      aria-label={t(l, "visible")}
                      aria-pressed={b.visible}
                      onClick={() => props.onToggle(b.id)}
                      className={b.visible ? "text-ink/35 hover:text-ink" : "text-coral"}
                    >
                      {b.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </button>
                  </div>
                ))}
                {page.blocks.length === 0 && <Empty text={t(l, "empty")} />}
                <p className={cn(label, "px-1 pt-3 normal-case tracking-normal")}>
                  {tr("Drag rows or use the arrows to reorder.", "Arraste as linhas ou use as setas para reordenar.")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ManageLink({ onClick, text }: { onClick: () => void; text: string }) {
  return (
    <button type="button" onClick={onClick} className="mt-3 flex w-full items-center gap-1 px-1 text-[10.5px] text-ink/45 hover:text-ink">
      {text} <ArrowUpRight className="h-3 w-3" />
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-ink/15 px-3 py-4 text-center text-[11px] text-ink/40">{text}</p>;
}

/** Tiny schematic of each section, after the reference's pill placeholder. */
function BlockGlyph({ type }: { type: Block["type"] }) {
  const bar = "rounded-full bg-ink/25";
  return (
    <span className="mb-1.5 flex h-8 items-center justify-center gap-1 rounded-md bg-ink/[0.04]">
      {type === "image" || type === "hero" ? (
        <>
          {type === "hero" && <span className={cn(bar, "h-1.5 w-4")} />}
          <span className="h-4 w-5 rounded-[3px] bg-ink/20" />
        </>
      ) : type === "galleryGrid" || type === "featured" || type === "galleryPreview" ? (
        [0, 1, 2].map((i) => <span key={i} className="h-3.5 w-3.5 rounded-[3px] bg-ink/20" />)
      ) : type === "about" ? (
        <>
          <span className="h-4 w-4 rounded-full bg-ink/20" />
          <span className={cn(bar, "h-1.5 w-5")} />
        </>
      ) : type === "spacer" ? (
        <span className="h-4 w-8 border-y border-dashed border-ink/30" />
      ) : type === "divider" ? (
        <span className="h-px w-8 bg-ink/30" />
      ) : type === "cta" ? (
        <span className="h-2.5 w-7 rounded-full bg-coral/60" />
      ) : type === "social" ? (
        [0, 1, 2].map((i) => <span key={i} className="h-2 w-2 rounded-full bg-ink/25" />)
      ) : (
        <span className={cn(bar, "h-1.5 w-6")} />
      )}
    </span>
  );
}
