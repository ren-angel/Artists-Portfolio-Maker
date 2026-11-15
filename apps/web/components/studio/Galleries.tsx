"use client";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  GripVertical,
  ImageIcon,
  Images,
  Plus,
  Settings2,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { removeGallery, type Draft } from "@studio/shared";
import { t, type Lang } from "../../lib/copy";
import type { Update } from "../../lib/use-draft";
import { reorder } from "../../lib/reorder";
import { cn } from "../home/types";
import { EmptyStudio, inkPill, PageHeader } from "./parts";

type Gallery = Draft["galleries"][number];
const slugify = (name: string, id: string) =>
  (name
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 35) || "gallery") +
  "-" +
  id.slice(0, 5);

export function Galleries({
  d,
  update,
  l,
  site,
  publicBase,
  onSave,
  embedded = false,
}: {
  d: Draft;
  update: Update;
  l: Lang;
  site: string;
  /** Public portfolio root when published, else null. */
  publicBase: string | null;
  onSave: () => void;
  embedded?: boolean;
}) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const [open, setOpen] = useState(""),
    [name, setName] = useState(""),
    [drag, setDrag] = useState<number | null>(null);
  const g = d.galleries.find((v) => v.id === open);
  const thumb = (assetId: string) => "/api/media/" + site + "/" + assetId + "/thumb";
  const arts = new Map(d.artworks.map((a) => [a.id, a]));
  const create = () => {
    const id = crypto.randomUUID();
    const title = name.trim();
    update((x) =>
      x.galleries.push({ id, title, slug: slugify(title, id), visible: true, description: "", artIds: [], cover: null }),
    );
    setName("");
    if (!embedded) setOpen(id);
  };

  if (g) return <Detail key={g.id} {...{ d, update, l, site, g, publicBase, onSave, back: () => setOpen("") }} />;

  return (
    <div className="space-y-5">
      {!embedded && (
        <PageHeader
          eyebrow={tr("Your work", "Suas obras")}
          title={t(l, "galleries")}
          subtitle={tr(
            "Group artworks into rooms of your portfolio. Each gallery gets its own page, cover and order — and can be shown or hidden at any time.",
            "Agrupe obras em salas do seu portfólio. Cada galeria tem página, capa e ordem próprias — e pode ser exibida ou ocultada quando quiser.",
          )}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {d.galleries.map((v, i) => {
          const cover = arts.get(v.cover ?? v.artIds[0] ?? "");
          return (
            <div
              key={v.id}
              draggable
              onDragStart={() => setDrag(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (drag !== null) update((x) => reorder(x.galleries, drag, i));
                setDrag(null);
              }}
              className={cn(
                "group relative overflow-hidden rounded-[1.2rem] border border-ink/10 bg-ivory transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_26px_44px_-34px_hsl(var(--ink)/0.6)]",
                drag === i && "opacity-40",
              )}
            >
              <button type="button" onClick={() => setOpen(v.id)} className="block w-full text-left" aria-label={t(l, "edit") + " " + v.title}>
                <div className="relative aspect-[16/9] overflow-hidden bg-paper">
                  {cover ? (
                    <img src={thumb(cover.assetId)} alt="" className="h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.05]" />
                  ) : (
                    <div className="grid h-full place-items-center bg-lilac/15">
                      <Images className="h-6 w-6 text-ink/25" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
                  <span
                    className={cn(
                      "absolute left-3 top-3 rounded-full px-2 py-[3px] text-[9px] font-semibold uppercase tracking-[0.12em] text-ink",
                      v.visible ? "bg-mint/90" : "bg-butter/90",
                    )}
                  >
                    {v.visible ? tr("Public", "Pública") : tr("Hidden", "Oculta")}
                  </span>
                  <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-paper/85 px-2 py-[3px] text-[10px] font-medium text-ink/70 backdrop-blur">
                    <Images className="h-2.5 w-2.5" /> {v.artIds.length}
                  </span>
                </div>
                <div className="p-4 pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-[17px] font-semibold leading-none tracking-tight">{v.title}</h3>
                      <p className="mt-1.5 line-clamp-2 min-h-[2.4em] text-[12px] leading-relaxed text-ink/50">
                        {v.description || tr("No description yet.", "Sem descrição ainda.")}
                      </p>
                    </div>
                    <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-ink/25 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>
                </div>
              </button>
              <div className="mx-4 mb-4 mt-3 flex items-center justify-between gap-2 border-t border-ink/10 pt-3">
                <span className="truncate text-[10.5px] uppercase tracking-[0.14em] text-ink/35">/galleries/{v.slug}</span>
                <span className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label={t(l, "up")}
                    disabled={i === 0}
                    onClick={() => update((x) => reorder(x.galleries, i, i - 1))}
                    className="grid h-6 w-6 place-items-center rounded-full text-ink/35 hover:bg-ink/[0.05] hover:text-ink disabled:opacity-25"
                  >
                    <ArrowLeft className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    aria-label={t(l, "down")}
                    disabled={i === d.galleries.length - 1}
                    onClick={() => update((x) => reorder(x.galleries, i, i + 1))}
                    className="grid h-6 w-6 place-items-center rounded-full text-ink/35 hover:bg-ink/[0.05] hover:text-ink disabled:opacity-25"
                  >
                    <ArrowRight className="h-3 w-3" />
                  </button>
                  <button type="button" onClick={() => setOpen(v.id)} className="ml-1 inline-flex items-center gap-1 text-[11.5px] font-medium text-ink/60 hover:text-coral">
                    {t(l, "manage")} <Settings2 className="h-3 w-3" />
                  </button>
                </span>
              </div>
            </div>
          );
        })}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) create();
          }}
          className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-[1.2rem] border border-dashed border-ink/25 bg-ivory/40 p-6 text-center transition-colors focus-within:border-ink/50 focus-within:bg-ivory hover:border-ink/50 hover:bg-ivory"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-lilac/25">
            <Plus className="h-4 w-4 text-ink/60" />
          </span>
          <span className="text-[13px] font-medium">{tr("Create a gallery", "Criar uma galeria")}</span>
          <span className="max-w-[240px] text-[11.5px] leading-relaxed text-ink/45">
            {tr("Fanart, sketchbook, a single project — call it whatever it is to you.", "Fanart, caderno de esboços, um projeto — chame do que fizer sentido para você.")}
          </span>
          <label className="mt-2 w-full max-w-[260px]">
            <span className="sr-only">{t(l, "custom")}</span>
            <input
              value={name}
              maxLength={120}
              required
              aria-label={t(l, "custom")}
              placeholder={tr("Gallery name", "Nome da galeria")}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-full border border-ink/15 bg-paper px-4 text-center text-[12.5px] focus:border-ink/45 focus:outline-none"
            />
          </label>
          <button type="submit" disabled={!name.trim()} className={cn(inkPill, "py-2 text-[12px]")}>
            <Plus className="h-3.5 w-3.5" /> {t(l, "add")}
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-ink/10 bg-ivory px-4 py-3">
        <Eye className="h-4 w-4 shrink-0 text-ink/35" />
        <p className="text-[12px] text-ink/50">
          {tr(
            "Hidden galleries stay in your studio and disappear from the published site. Drag cards or use the arrows to reorder them.",
            "Galerias ocultas ficam no ateliê e somem do site publicado. Arraste os cartões ou use as setas para reordenar.",
          )}
        </p>
      </div>
    </div>
  );
}

function Detail({
  d,
  update,
  l,
  site,
  g,
  publicBase,
  onSave,
  back,
}: {
  d: Draft;
  update: Update;
  l: Lang;
  site: string;
  g: Gallery;
  publicBase: string | null;
  onSave: () => void;
  back: () => void;
}) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const [adding, setAdding] = useState(false),
    [drag, setDrag] = useState<number | null>(null);
  const arts = new Map(d.artworks.map((a) => [a.id, a]));
  const thumb = (assetId: string) => "/api/media/" + site + "/" + assetId + "/thumb";
  const cover = arts.get(g.cover ?? g.artIds[0] ?? "");
  const patch = (changes: Partial<Gallery>) => update((x) => Object.assign(x.galleries.find((v) => v.id === g.id)!, changes));
  const order = (from: number, to: number) => {
    const ids = [...g.artIds];
    reorder(ids, from, to);
    patch({ artIds: ids });
  };
  const featured = g.artIds.filter((id) => arts.get(id)?.featured).length;
  const tile = "rounded-xl border border-ink/12 bg-paper px-3 py-2.5";
  const tileLabel = "text-[9px] uppercase tracking-[0.14em] text-ink/35";
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={back} className="inline-flex items-center gap-1.5 text-[12px] text-ink/45 hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> {tr("All galleries", "Todas as galerias")}
        </button>
        <div className="flex items-center gap-2">
          {publicBase && g.visible && (
            <a
              href={publicBase + "/galleries/" + g.slug}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-ink/15 px-3.5 py-2 text-[11.5px] font-medium text-ink/60 hover:border-ink/40 hover:text-ink"
            >
              {tr("View on site", "Ver no site")}
            </a>
          )}
          <button type="button" onClick={onSave} className="rounded-full bg-coral px-4 py-2 text-[11.5px] font-medium text-ink transition-transform hover:-translate-y-0.5">
            {tr("Save changes", "Salvar alterações")}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.2rem] border border-ink/10 bg-ivory">
        <div className="relative h-[180px] bg-ink sm:h-[220px]">
          {cover && <img src={thumb(cover.assetId)} alt="" className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent" />
          <div className="absolute inset-x-5 bottom-4">
            <input
              value={g.title}
              maxLength={120}
              onChange={(e) => patch({ title: e.target.value })}
              aria-label={t(l, "title")}
              className="w-full max-w-[420px] bg-transparent font-display text-[28px] font-semibold leading-none tracking-tight text-paper outline-none placeholder:text-paper/40 focus-visible:underline focus-visible:decoration-paper/40 focus-visible:underline-offset-8 sm:text-[34px]"
            />
            <div className="mt-2 flex items-center gap-2">
              <span className={cn("rounded-full px-2 py-[2px] text-[9px] font-semibold uppercase tracking-wider text-ink", g.visible ? "bg-mint" : "bg-butter")}>
                {g.visible ? tr("Public", "Pública") : tr("Hidden", "Oculta")}
              </span>
              <span className="text-[11px] text-paper/60">
                {g.artIds.length} {t(l, "works")} · {g.cover ? tr("custom cover", "capa escolhida") : tr("cover from first piece", "capa da primeira obra")}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-[1.2fr_1fr]">
          <label className="block">
            <span className="mb-1.5 block text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ink/35">{t(l, "description")}</span>
            <textarea
              value={g.description}
              onChange={(e) => patch({ description: e.target.value })}
              rows={3}
              maxLength={2000}
              className="w-full resize-y rounded-xl border border-ink/12 bg-paper px-3 py-2.5 text-[12.5px] leading-relaxed focus:border-ink/45 focus:outline-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={tile}>
              <span className={tileLabel}>{tr("Address", "Endereço")}</span>
              <span className="mt-1 flex items-center font-mono text-[11px] text-ink/45">
                /galleries/
                <input
                  value={g.slug}
                  maxLength={50}
                  onChange={(e) => patch({ slug: e.target.value.toLowerCase() })}
                  aria-label={t(l, "slug")}
                  className="min-w-0 flex-1 bg-transparent text-ink/70 focus:outline-none"
                />
              </span>
            </label>
            <div className={tile}>
              <p className={tileLabel}>{t(l, "cover")}</p>
              <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-ink/60">
                <ImageIcon className="h-3 w-3 shrink-0" /> {cover?.title ?? t(l, "none")}
              </p>
            </div>
            <div className={tile}>
              <p className={tileLabel}>{t(l, "featured")}</p>
              <p className="mt-1 text-[11px] text-ink/60">
                {featured} {tr("in this gallery", "nesta galeria")}
              </p>
            </div>
            <button type="button" role="switch" aria-checked={g.visible} onClick={() => patch({ visible: !g.visible })} className={cn(tile, "text-left hover:border-ink/35")}>
              <span className={tileLabel}>{t(l, "visible")}</span>
              <span className="mt-1 flex items-center gap-1 text-[11px] text-ink/60">
                {g.visible ? <Check className="h-3 w-3 text-[#3d9b78]" /> : <EyeOff className="h-3 w-3 text-coral" />}
                {g.visible ? tr("Public", "Pública") : tr("Hidden", "Oculta")}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-[18px] font-semibold tracking-tight">{tr("Artworks in this gallery", "Obras nesta galeria")}</h2>
        <span className="text-[11px] text-ink/40">{tr("Drag to reorder · ★ to feature · ▣ to set the cover", "Arraste para reordenar · ★ destaca · ▣ define a capa")}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {g.artIds.map((id, i) => {
          const w = arts.get(id);
          if (!w) return null;
          const isCover = g.cover === id;
          return (
            <div
              key={id}
              draggable
              onDragStart={() => setDrag(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (drag !== null) order(drag, i);
                setDrag(null);
              }}
              className={cn("group relative overflow-hidden rounded-xl border border-ink/10 bg-ivory", drag === i && "opacity-40", isCover && "ring-2 ring-coral")}
            >
              <div className="relative overflow-hidden">
                <img src={thumb(w.assetId)} alt={w.alt || w.title} loading="lazy" className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-ink/0 transition-colors group-hover:bg-ink/25" />
                <div className="absolute inset-x-1.5 top-1.5 flex justify-between opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                  <span className="cursor-grab rounded bg-paper/85 p-1">
                    <GripVertical className="h-3 w-3 text-ink/60" />
                  </span>
                  <span className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => patch({ cover: isCover ? null : id })}
                      aria-pressed={isCover}
                      aria-label={t(l, "cover") + ": " + w.title}
                      title={t(l, "cover")}
                      className={cn("rounded-full p-1.5", isCover ? "bg-coral text-ink" : "bg-paper/85 text-ink/50")}
                    >
                      <ImageIcon className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => update((x) => void (x.artworks.find((a) => a.id === id)!.featured = !w.featured))}
                      aria-pressed={w.featured}
                      aria-label={t(l, "featured") + ": " + w.title}
                      className={cn("rounded-full p-1.5", w.featured ? "bg-butter text-ink" : "bg-paper/85 text-ink/50")}
                    >
                      <Star className={cn("h-3 w-3", w.featured && "fill-ink/70")} />
                    </button>
                  </span>
                </div>
                <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                  <span className="flex gap-1">
                    <button type="button" aria-label={t(l, "up")} disabled={i === 0} onClick={() => order(i, i - 1)} className="rounded bg-paper/85 px-1.5 py-0.5 text-[10px] text-ink/60 disabled:opacity-40">
                      ←
                    </button>
                    <button
                      type="button"
                      aria-label={t(l, "down")}
                      disabled={i === g.artIds.length - 1}
                      onClick={() => order(i, i + 1)}
                      className="rounded bg-paper/85 px-1.5 py-0.5 text-[10px] text-ink/60 disabled:opacity-40"
                    >
                      →
                    </button>
                  </span>
                  <button
                    type="button"
                    aria-label={t(l, "remove") + ": " + w.title}
                    onClick={() => patch({ artIds: g.artIds.filter((v) => v !== id), cover: isCover ? null : g.cover })}
                    className="rounded bg-paper/85 p-1 text-ink/60 hover:text-coral"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="px-2 py-2">
                <p className="truncate text-[11.5px] font-medium">{w.title}</p>
                <p className="mt-0.5 text-[10px] text-ink/35">{w.featured ? "✦ " + t(l, "featured") : isCover ? t(l, "cover") : "#" + (i + 1)}</p>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex aspect-[4/5] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink/25 text-ink/40 transition-colors hover:border-ink/50 hover:text-ink"
        >
          <Plus className="h-4 w-4" />
          <span className="text-[11px]">{tr("Add artwork", "Adicionar obra")}</span>
        </button>
      </div>
      {g.artIds.length === 0 && <EmptyStudio compact tone="lilac" title={t(l, "emptyGallery")} body={tr("Add pieces from your library.", "Adicione peças da sua biblioteca.")} />}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            if (!confirm(t(l, "deleteAsk"))) return;
            update((x) => removeGallery(x, g.id));
            back();
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3.5 py-2 text-[11.5px] text-ink/55 hover:border-coral hover:text-coral"
        >
          <Trash2 className="h-3.5 w-3.5" /> {tr("Delete gallery", "Excluir galeria")}
        </button>
      </div>

      {adding && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={tr("Add artwork", "Adicionar obra")}>
          <button type="button" aria-label={t(l, "cancel")} className="absolute inset-0 bg-ink/45 backdrop-blur-sm" onClick={() => setAdding(false)} />
          <div className="u-pop relative flex max-h-[86vh] w-full max-w-[640px] flex-col overflow-hidden rounded-[1.5rem] border border-ink/10 bg-ivory shadow-2xl">
            <div className="flex items-center gap-2 border-b border-ink/10 px-5 py-3">
              <Images className="h-3.5 w-3.5 text-coral" />
              <p className="flex-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink/45">
                {tr("Add to", "Adicionar a")} {g.title}
              </p>
              <button type="button" onClick={() => setAdding(false)} aria-label={t(l, "cancel")} className="grid h-7 w-7 place-items-center rounded-full bg-paper/80 text-ink/50 hover:text-ink">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid flex-1 grid-cols-3 gap-2 overflow-y-auto p-4 sm:grid-cols-4">
              {d.artworks.map((a) => {
                const on = g.artIds.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => patch({ artIds: on ? g.artIds.filter((v) => v !== a.id) : [...g.artIds, a.id], cover: on && g.cover === a.id ? null : g.cover })}
                    className={cn(
                      "relative overflow-hidden rounded-xl border border-ink/10 bg-paper text-left transition-all hover:-translate-y-0.5",
                      on && "ring-2 ring-coral ring-offset-2 ring-offset-ivory",
                    )}
                  >
                    <img src={thumb(a.assetId)} alt={a.alt || a.title} loading="lazy" className="aspect-square w-full object-cover" />
                    <span className="block truncate px-2 py-1.5 text-[10.5px] font-medium">{a.title}</span>
                    {on && (
                      <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-coral text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
              {d.artworks.length === 0 && <p className="col-span-full py-8 text-center text-[12px] text-ink/45">{t(l, "noArtYet")}</p>}
            </div>
            <div className="flex justify-end border-t border-ink/10 px-5 py-3">
              <button type="button" onClick={() => setAdding(false)} className={inkPill}>
                {tr("Done", "Concluir")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
