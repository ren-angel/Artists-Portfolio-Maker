"use client";
import { useEffect, useState } from "react";
import type { DiscoveryWork } from "@studio/shared";
import { api } from "../../lib/client";
import type { Lang } from "../../lib/copy";

export default function PublishedWorks({ query, lang }: { query: string; lang: Lang }) {
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<{ works: DiscoveryWork[]; more: boolean } | null>(null);
  const [error, setError] = useState(false);
  const tr = (en: string, pt: string) => lang === "en" ? en : pt;
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      api<{ works: DiscoveryWork[]; more: boolean }>("/discover?q=" + encodeURIComponent(query) + "&offset=" + page * 24)
        .then(r => { if (active) setResult(r); }, () => { if (active) setError(true); });
    }, 180);
    return () => { active = false; clearTimeout(timer); };
  }, [query, page]);
  return <section className="mt-12">
    <h2 className="font-display text-[24px] font-semibold">{tr("Published by artists", "Publicadas pelos artistas")}</h2>
    {error ? <p role="status">{tr("The exhibition is temporarily unavailable.", "A exposição está temporariamente indisponível.")}</p> :
      !result ? <p role="status">…</p> : result.works.length ? <div className="mt-5 columns-2 gap-4 lg:columns-3">
        {result.works.map(w => <a key={w.handle + w.artId} href={"/site/" + w.handle + "/works/" + w.artId}
          className="group mb-4 block break-inside-avoid overflow-hidden rounded-[1.2rem] border border-ink/10 bg-ivory">
          <img src={w.thumbnail} alt={w.alt} loading="lazy" className="w-full transition-transform group-hover:scale-[1.02]" />
          <div className="p-3"><h3 className="font-display font-semibold">{w.title}</h3><p className="text-[12px] text-ink/65">{w.artist}</p></div>
        </a>)}</div> : <p className="mt-2 text-[14px] text-ink/60">{query ? tr("No matching published works.", "Nenhuma obra publicada corresponde à busca.") :
          tr("Artists can include their published work here from Privacy & discovery in the studio.", "Os artistas podem incluir suas obras publicadas aqui em Privacidade e descoberta no ateliê.")}</p>}
    {(page > 0 || result?.more) && <div className="mt-4 flex gap-3">
      {([[-1,tr("Previous", "Anterior")],[1,tr("Next", "Próxima")]] as const).map(([step,label]) =>
        <button key={step} disabled={step < 0 ? page === 0 : !result?.more} className="rounded-full border border-ink/25 px-4 py-2 disabled:opacity-35"
          onClick={() => { setError(false); setResult(null); setPage(page + step); }}>{label}</button>)}
    </div>}
  </section>;
}
