"use client";
import { useEffect, useState } from "react";
import { Check, Images, Plus, Search, X } from "lucide-react";
import { t } from "../../../lib/copy";
import { cn } from "../../home/types";
import type { EditorProps } from "./Editor";

/** Artwork selection dialog, styled after the reference's publish dialog. */
export function ArtPicker({
  d,
  l,
  site,
  progress,
  onUpload,
  open,
  current,
  onClose,
  onPick,
}: EditorProps & {
  open: boolean;
  current: string | null;
  onClose: () => void;
  onPick: (id: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);
  if (!open) return null;
  const q = query.trim().toLowerCase();
  const list = d.artworks.filter((a) => !q || (a.title + " " + a.alt).toLowerCase().includes(q));
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={t(l, "chooseArt")}>
      <button type="button" aria-label={t(l, "cancel")} className="absolute inset-0 bg-ink/45 backdrop-blur-sm" onClick={onClose} />
      <div className="u-pop relative flex max-h-[86vh] w-full max-w-[640px] flex-col overflow-hidden rounded-[1.5rem] border border-ink/10 bg-ivory shadow-2xl">
        <div className="flex items-center gap-2 border-b border-ink/10 px-5 py-3">
          <Images className="h-3.5 w-3.5 text-coral" />
          <p className="flex-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink/45">{t(l, "chooseArt")}</p>
          <button type="button" onClick={onClose} aria-label={t(l, "cancel")} className="grid h-7 w-7 place-items-center rounded-full bg-paper/80 text-ink/50 hover:text-ink">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2 border-b border-ink/10 px-5 py-2.5">
          <Search className="h-3.5 w-3.5 text-ink/35" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={l === "en" ? "Search by title" : "Buscar pelo título"}
            aria-label={l === "en" ? "Search by title" : "Buscar pelo título"}
            className="flex-1 bg-transparent text-[12.5px] focus:outline-none"
          />
          <span className="text-[10px] text-ink/35">
            {list.length} {t(l, "works")}
          </span>
        </div>
        <div className="grid flex-1 grid-cols-3 gap-2 overflow-y-auto p-4 sm:grid-cols-4">
          <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border border-dashed border-ink/30 text-center text-[10.5px] text-ink/45 hover:border-ink/60 hover:text-ink">
            <span>
              <Plus className="mx-auto mb-1 h-4 w-4" />
              {t(l, "upload")}
            </span>
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => {
                onUpload(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
          </label>
          {list.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onPick(a.id)}
              aria-pressed={a.id === current}
              className={cn(
                "group relative overflow-hidden rounded-xl border border-ink/10 bg-paper text-left transition-all hover:-translate-y-0.5",
                a.id === current && "ring-2 ring-coral ring-offset-2 ring-offset-ivory",
              )}
            >
              <img src={"/api/media/" + site + "/" + a.assetId + "/thumb"} alt={a.alt || a.title} loading="lazy" className="aspect-square w-full object-cover" />
              <span className="block truncate px-2 py-1.5 text-[10.5px] font-medium">{a.title}</span>
              {a.id === current && (
                <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-coral text-white">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          ))}
        </div>
        {progress !== null && (
          <div className="h-1 bg-ink/10" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-coral transition-all" style={{ width: progress + "%" }} />
          </div>
        )}
        {current && (
          <div className="flex justify-end border-t border-ink/10 px-5 py-2.5">
            <button type="button" onClick={() => onPick(null)} className="text-[11px] text-ink/50 hover:text-coral">
              {l === "en" ? "Remove artwork from this section" : "Remover obra desta seção"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
