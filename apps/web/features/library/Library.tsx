"use client";
import { cleanPageReferences } from "@studio/shared";
import { useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import { ArrowLeft, ArrowRight, Check, ImageUp, Search, Star, Trash2, Upload, X } from "lucide-react";
import { detailLabel } from "../../entities/portfolio/artwork-details";
import { artworkDetailKeys, type Draft } from "@studio/shared";
import { t, type Lang } from "../../shared/lib/copy";
import type { Limits, Update } from "../studio/use-draft";
import { reorder } from "../../shared/lib/reorder";
import { cn } from "../../shared/lib/cn";
import { EmptyStudio, inkPill, PageHeader } from "../../shared/ui/studio-kit";

/* Port of Design/src/components/dashboard/ArtworkLibrary.jsx. Gallery names
   replace the reference's category filters; every field saves to the draft. */

const field = "w-full rounded-lg border border-ink/12 bg-paper px-2.5 py-1.5 text-[11.5px] focus:border-ink/40 focus:outline-none";
const small = "mb-1 block text-[9px] uppercase tracking-[0.14em] text-ink/35";
const ACCEPT = "image/png,image/jpeg,image/webp";

export function Library({
  d,
  update,
  l,
  site,
  limits,
  storageUsed,
  progress,
  onFiles,
  onSave,
  embedded = false,
}: {
  d: Draft;
  update: Update;
  l: Lang;
  site: string;
  limits: Limits;
  storageUsed?: number;
  progress: number | null;
  onFiles: (files: File[], replace?: string) => void;
  onSave: () => void;
  /** Inside onboarding: no page header. */
  embedded?: boolean;
}) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [chosen, setChosen] = useState(embedded ? "" : (d.artworks[0]?.id ?? "")),
    [over, setOver] = useState(false),
    [drag, setDrag] = useState<number | null>(null);
  const a = d.artworks.find((v) => v.id === chosen);
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return d.artworks.filter((w) => {
      const g = d.galleries.find((v) => v.id === filter);
      const pass =
        filter === "all" ||
        (filter === "featured" && w.featured) ||
        (filter === "loose" && !d.galleries.some((v) => v.artIds.includes(w.id))) ||
        (g && g.artIds.includes(w.id));
      return pass && (!q || (w.title + " " + w.alt + " " + w.description).toLowerCase().includes(q));
    });
  }, [d.artworks, d.galleries, query, filter]);
  const patch = (changes: Partial<Draft["artworks"][number]>) =>
    update((x) => Object.assign(x.artworks.find((v) => v.id === chosen)!, changes));
  const files = (e: ChangeEvent<HTMLInputElement>, replace?: string) => {
    onFiles(Array.from(e.target.files ?? []), replace);
    e.target.value = "";
  };
  const drop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    if (e.dataTransfer.files.length) onFiles(Array.from(e.dataTransfer.files));
  };
  const thumb = (assetId: string) => "/api/media/" + site + "/" + assetId + "/thumb";
  const used = storageUsed ?? 0;
  const filters: [string, string][] = [
    ["all", tr("All", "Todas")],
    ["featured", t(l, "featured")],
    ...d.galleries.map((g) => [g.id, g.title] as [string, string]),
    ["loose", tr("Not in a gallery", "Fora de galerias")],
  ];
  const remove = () => {
    if (!a || !confirm(t(l, "deleteAsk"))) return;
    update((x) => {
      x.artworks = x.artworks.filter((v) => v.id !== a.id);
      for (const g of x.galleries) {
        g.artIds = g.artIds.filter((id) => id !== a.id);
        if (g.cover === a.id) g.cover = null;
      }
      for (const p of x.pages) for (const b of p.blocks) {
        if (b.artId === a.id) b.artId = null;
        if (b.bgArtId === a.id) b.bgArtId = null;
      }
      cleanPageReferences(x);
      for (const type of x.commissions.types) if (type.artId === a.id) type.artId = null;
    });
    setChosen("");
  };
  const index = a ? d.artworks.indexOf(a) : -1;

  return (
    <div className="space-y-5">
      {!embedded && (
        <PageHeader
          eyebrow={t(l, "media")}
          title={t(l, "library")}
          subtitle={tr(
            "One home for every file you've uploaded. Add titles and descriptions, sort into galleries, and mark your favourites as featured.",
            "Um lar para cada arquivo enviado. Dê títulos e descrições, organize em galerias e marque suas favoritas como destaque.",
          )}
          actions={
            <label className={cn(inkPill, "cursor-pointer")}>
              <Upload className="h-3.5 w-3.5" /> {tr("Upload artwork", "Enviar obra")}
              <input type="file" multiple accept={ACCEPT} className="sr-only" onChange={(e) => files(e)} />
            </label>
          }
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr("Search your library…", "Buscar na biblioteca…")}
            aria-label={tr("Search your library", "Buscar na biblioteca")}
            className="h-10 w-full rounded-full border border-ink/12 bg-ivory pl-9 pr-3 text-[12.5px] focus:border-ink/40 focus:outline-none"
          />
        </div>
        <div className="no-scrollbar flex max-w-full gap-1.5 overflow-x-auto" role="radiogroup" aria-label={tr("Filter", "Filtrar")}>
          {filters.map(([k, v]) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={filter === k}
              onClick={() => setFilter(k)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
                filter === k ? "border-ink bg-ink text-paper" : "border-ink/12 bg-ivory text-ink/50 hover:border-ink/35 hover:text-ink",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className={cn("grid gap-4", a && !embedded && "lg:grid-cols-[1fr_280px]")}>
        <div>
          <div className="art-cards grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setOver(true);
              }}
              onDragLeave={() => setOver(false)}
              onDrop={drop}
              className={cn("block cursor-pointer text-left transition-transform hover:-translate-y-0.5", over && "scale-[1.02]")}
            >
              <EmptyStudio
                compact
                tone="lilac"
                className={cn("aspect-[4/5] px-3 py-5", over && "border-coral")}
                title={tr("Drop files here", "Solte os arquivos aqui")}
                body={"PNG · JPG · WebP · " + tr("up to", "até") + " " + Math.round(limits.upload / 1024 ** 2) + " MB"}
              />
              <input type="file" multiple accept={ACCEPT} className="sr-only" aria-label={t(l, "upload")} onChange={(e) => files(e)} />
            </label>

            {items.map((w) => {
              const i = d.artworks.indexOf(w);
              return (
                <button
                  key={w.id}
                  type="button"
                  draggable
                  onDragStart={() => setDrag(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (drag !== null && !e.dataTransfer.files.length) update((x) => reorder(x.artworks, drag, i));
                    setDrag(null);
                  }}
                  onClick={() => setChosen(w.id)}
                  aria-pressed={chosen === w.id}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border bg-ivory text-left transition-all",
                    chosen === w.id ? "border-coral ring-2 ring-coral" : "border-ink/10 hover:border-ink/30",
                    drag === i && "opacity-40",
                  )}
                >
                  <img
                    src={thumb(w.assetId)}
                    alt={w.alt || w.title}
                    loading="lazy"
                    className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {w.featured && (
                    <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-butter text-ink" title={t(l, "featured")}>
                      <Star className="h-2.5 w-2.5 fill-ink/70" />
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-ink/70 to-transparent px-2.5 pb-2 pt-6 text-[11px] font-medium text-paper opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    {w.title}
                  </span>
                </button>
              );
            })}
          </div>
          {d.artworks.length > 0 && items.length === 0 && (
            <p className="mt-4 text-center text-[12px] text-ink/45">{tr("Nothing matches this search.", "Nada corresponde a esta busca.")}</p>
          )}
          {progress !== null && (
            <div className="mt-4 rounded-xl border border-ink/10 bg-ivory px-4 py-3" role="status">
              <div className="flex items-center justify-between text-[10.5px] text-ink/45">
                <span>{tr("Uploading…", "Enviando…")}</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-ink/10">
                <div className="h-1.5 rounded-full bg-coral transition-all" style={{ width: progress + "%" }} />
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-3 rounded-xl border border-ink/10 bg-ivory px-4 py-3">
            <div className="flex-1">
              <div className="flex items-center justify-between text-[10.5px] text-ink/45">
                <span>{tr("Storage", "Armazenamento")}</span>
                <span>
                  {(used / 1024 ** 2).toFixed(1)} MB {tr("of", "de")} {Math.round(limits.storage / 1024 ** 2)} MB
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-ink/10">
                <div className="h-1.5 rounded-full bg-ink/50" style={{ width: Math.min(100, (used / limits.storage) * 100) + "%" }} />
              </div>
            </div>
            <span className="shrink-0 text-[10.5px] text-ink/35">
              {items.length} {tr("of", "de")} {d.artworks.length} · {tr("max", "máx.")} {limits.artworks}
            </span>
          </div>
        </div>

        {a && (
          <aside className={embedded ? "max-w-[360px]" : "lg:sticky lg:top-20 lg:self-start"}>
            <div className="u-pop overflow-hidden rounded-[1.1rem] border border-ink/10 bg-ivory">
              <div className="relative bg-paper">
                <img src={thumb(a.assetId)} alt={a.alt || a.title} className="aspect-[4/3] w-full object-cover" />
                {d.galleries.find((g) => g.artIds.includes(a.id)) && (
                  <span className="absolute left-2 top-2 rounded-full bg-paper/85 px-2 py-[2px] text-[9px] uppercase tracking-wider backdrop-blur">
                    {d.galleries.find((g) => g.artIds.includes(a.id))!.title}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="truncate font-display text-[15px] font-semibold tracking-tight">{a.title}</h3>
                <p className="mt-0.5 text-[10.5px] text-ink/35">
                  {index + 1} / {d.artworks.length} · {d.galleries.filter((g) => g.artIds.includes(a.id)).length} {t(l, "galleries").toLowerCase()}
                </p>

                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className={small}>{t(l, "title")}</span>
                    <input value={a.title} maxLength={120} onChange={(e) => patch({ title: e.target.value })} className={field} />
                  </label>
                  <label className="block">
                    <span className={small}>{t(l, "description")}</span>
                    <textarea
                      rows={2}
                      value={a.description}
                      maxLength={2000}
                      onChange={(e) => patch({ description: e.target.value })}
                      className={cn(field, "resize-y leading-relaxed")}
                    />
                  </label>
                  <label className="block">
                    <span className={small}>{t(l, "alt")}</span>
                    <input value={a.alt} maxLength={500} onChange={(e) => patch({ alt: e.target.value })} className={field} />
                  </label>
                  <details className="rounded-lg border border-ink/12 bg-paper/60 px-3 py-2" key={a.id}>
                    <summary className="cursor-pointer text-[12px] font-medium">{tr("Artwork details", "Ficha da obra")}</summary>
                    <div className="mt-3 space-y-2">
                      {artworkDetailKeys.map(key => <label key={key} className="block">
                        <span className={small}>{detailLabel(key, l)}</span>
                        <input value={a.details?.[key] ?? ""} maxLength={160} className={field}
                          onChange={e => patch({ details: { ...a.details, [key]: e.target.value } })} />
                      </label>)}
                    </div>
                  </details>
                  {d.galleries.length > 0 && (
                    <div role="group" aria-label={t(l, "galleries")}>
                      <span className={small}>{t(l, "galleries")}</span>
                      <div className="flex flex-wrap gap-1">
                        {d.galleries.map((g) => {
                          const on = g.artIds.includes(a.id);
                          return (
                            <button
                              key={g.id}
                              type="button"
                              aria-pressed={on}
                              onClick={() =>
                                update((x) => {
                                  const v = x.galleries.find((k) => k.id === g.id)!;
                                  v.artIds = on ? v.artIds.filter((id) => id !== a.id) : [...v.artIds, a.id];
                                  if (on && v.cover === a.id) v.cover = null;
                                })
                              }
                              className={cn(
                                "flex items-center gap-1 rounded-full px-2 py-[2px] text-[9.5px]",
                                on ? "bg-ink text-paper" : "border border-ink/15 text-ink/45 hover:border-ink/40 hover:text-ink",
                              )}
                            >
                              {on && <Check className="h-2.5 w-2.5" />}
                              {g.title}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <label className="flex cursor-pointer items-center justify-between rounded-lg bg-butter/40 px-2.5 py-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium">
                      <Star className="h-3 w-3 fill-ink/60 text-ink/60" /> {t(l, "featured")}
                    </span>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={a.featured}
                      onChange={(e) => patch({ featured: e.target.checked })}
                      className="relative h-4 w-7 shrink-0 cursor-pointer appearance-none rounded-full bg-ink/20 transition-colors before:absolute before:left-0.5 before:top-0.5 before:h-3 before:w-3 before:rounded-full before:bg-paper before:transition-transform checked:bg-ink/70 checked:before:translate-x-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/50"
                    />
                  </label>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label={t(l, "up")}
                      disabled={index === 0}
                      onClick={() => update((x) => reorder(x.artworks, index, index - 1))}
                      className="grid h-8 w-8 place-items-center rounded-full border border-ink/15 text-ink/50 hover:border-ink/40 hover:text-ink disabled:opacity-30"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={t(l, "down")}
                      disabled={index === d.artworks.length - 1}
                      onClick={() => update((x) => reorder(x.artworks, index, index + 1))}
                      className="grid h-8 w-8 place-items-center rounded-full border border-ink/15 text-ink/50 hover:border-ink/40 hover:text-ink disabled:opacity-30"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <label className="flex h-8 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-ink/15 text-[11px] text-ink/60 hover:border-ink/40 hover:text-ink">
                      <ImageUp className="h-3.5 w-3.5" /> {t(l, "replace")}
                      <input type="file" accept={ACCEPT} className="sr-only" onChange={(e) => files(e, a.id)} />
                    </label>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={onSave} className="h-8 flex-1 rounded-full bg-ink text-[11px] font-medium text-paper">
                    {t(l, "save")}
                  </button>
                  <button
                    type="button"
                    onClick={remove}
                    aria-label={t(l, "remove")}
                    title={t(l, "remove")}
                    className="grid h-8 w-8 place-items-center rounded-full border border-ink/15 text-ink/40 hover:border-coral hover:text-coral"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setChosen("")}
                    aria-label={t(l, "cancel")}
                    className="grid h-8 w-8 place-items-center rounded-full border border-ink/15 text-ink/40 hover:text-ink"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
