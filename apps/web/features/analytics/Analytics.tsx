"use client";
import { useEffect, useId, useState } from "react";
import { ArrowDownRight, ArrowUpRight, CalendarDays, Eye, Images, Layers, Lock, ShieldCheck } from "lucide-react";
import { api } from "../../shared/lib/client";
import { message, type Lang } from "../../shared/lib/copy";
import { cn } from "../../shared/lib/cn";
import { card, EmptyStudio, PageHeader } from "../../shared/ui/studio-kit";

export type Report = {
  days: number;
  maxDays: number;
  advanced: boolean;
  total: number;
  artworkViews: number;
  galleryViews: number;
  series: { day: string; views: number }[];
  pages: { path: string; views: number }[];
  works: { title: string; path: string; assetId: string | null; views: number }[];
  galleries: { path: string; views: number }[];
  referrers?: { key: string; views: number }[];
  countries?: { key: string | null; views: number }[];
  clicks?: { target: string; clicks: number }[];
  previous?: number;
};

/** One focusable chart, with arrow-key and pointer access to daily values. */
export function Chart({ series, l, height = 140 }: { series: Report["series"]; l: Lang; height?: number }) {
  const gradient = useId();
  const [index, setIndex] = useState<number | null>(null);
  if (!series.length) return null;
  const max = Math.max(1, ...series.map(d => d.views));
  const x = (i: number) => i * 1000 / Math.max(1, series.length - 1);
  const y = (v: number) => 96 - v / max * 92;
  const line = series.map((d,i) => (i ? "L" : "M") + x(i) + " " + y(d.views)).join(" ");
  const selected = Math.min(index ?? series.length - 1, series.length - 1);
  const date = (i: number) => new Date(series[i].day + "T12:00:00Z").toLocaleDateString(l, {day:"numeric",month:"short",timeZone:"UTC"});
  const value = date(selected) + " · " + series[selected].views + (l === "en" ? " views" : " visualizações");
  return <figure>
    <div className="relative" style={{ height }}>
      <svg className="h-full w-full text-coral" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden>
        <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="currentColor" stopOpacity=".42" /><stop offset="100%" stopColor="currentColor" stopOpacity=".03" />
        </linearGradient></defs>
        {[25,50,75].map(n => <path key={n} d={`M0 ${n}H1000`} stroke="currentColor" opacity=".2" strokeDasharray="3 6" vectorEffect="non-scaling-stroke" />)}
        <path d={line + " L1000 100 L0 100 Z"} fill={`url(#${gradient})`} />
        <path d={line} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {index !== null && <path d={`M${x(selected)} 0 V100`} stroke="currentColor" vectorEffect="non-scaling-stroke" />}
      </svg>
      <input type="range" min={0} max={series.length-1} value={selected}
        aria-label={l === "en" ? "Daily views" : "Visualizações diárias"} aria-valuetext={value}
        className="absolute inset-0 h-full w-full cursor-crosshair opacity-0"
        onFocus={() => setIndex(selected)} onBlur={() => setIndex(null)} onChange={e => setIndex(Number(e.target.value))}
        onPointerMove={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          setIndex(Math.max(0, Math.min(series.length - 1, Math.round((e.clientX - rect.left)/rect.width * (series.length-1)))));
        }} onPointerLeave={e => { if (document.activeElement !== e.currentTarget) setIndex(null); }} />
      {index !== null && <span className="pointer-events-none absolute top-0 right-1 rounded-md bg-ink px-2 py-1 text-[10px] text-paper">{value}</span>}
    </div>
    <figcaption className="mt-2 flex justify-between text-[10px] text-ink/55"><span>{date(0)}</span><span>{date(series.length - 1)}</span></figcaption>
  </figure>;
}

function List({ title, rows, empty }: { title: string; rows: [string, number][]; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <section className={cn(card, "p-5")}>
      <h3 className="font-display text-[15px] font-semibold tracking-tight">{title}</h3>
      {rows.length ? (
        <ul className="mt-3 space-y-2">
          {rows.map(([k, v]) => (
            <li key={k} className="relative overflow-hidden rounded-lg px-2.5 py-1.5 text-[12.5px]">
              <span className="absolute inset-y-0 left-0 bg-lilac/25" style={{ width: (v / max) * 100 + "%" }} />
              <span className="relative flex justify-between gap-3">
                <span className="truncate">{k}</span>
                <span className="font-medium tabular-nums">{v}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[12px] text-ink/45">{empty}</p>
      )}
    </section>
  );
}

export function Analytics({ l, site, onUpgrade }: { l: Lang; site: string; onUpgrade: () => void }) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const [days, setDays] = useState(30),
    [r, setR] = useState<Report | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setR(null);
    setError("");
    api<Report>(`/sites/${site}/analytics?days=${days}`).then(report => {
      if (active) { setR(report); setError(""); }
    }, e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [site, days]);
  const REF: Record<string, [string, string]> = {
    direct: ["Direct or private", "Direto ou privado"],
    search: ["Search engines", "Buscadores"],
    social: ["Social networks", "Redes sociais"],
    art: ["Art communities", "Comunidades de arte"],
    internal: ["Your own pages", "Suas próprias páginas"],
    other: ["Other websites", "Outros sites"],
  };
  const change = r?.previous !== undefined && r.previous > 0 ? Math.round(((r.total - r.previous) / r.previous) * 100) : null;
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={tr("Growth", "Crescimento")}
        title={tr("Analytics", "Estatísticas")}
        subtitle={tr(
          "Views of your published portfolio. Counted on our server without cookies or visitor identifiers; previews and bots are excluded.",
          "Visualizações do portfólio publicado. Contadas no servidor, sem cookies nem identificadores de visitantes; prévias e robôs ficam de fora.",
        )}
        actions={
          <div className="flex gap-1 rounded-full border border-ink/12 bg-ivory p-1" role="radiogroup" aria-label={tr("Period", "Período")}>
            {[7, 30, 90, 365].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={days === n}
                disabled={!r || n > r.maxDays}
                onClick={() => setDays(n)}
                title={r && n > r.maxDays ? tr("Studio plan", "Plano Estúdio") : undefined}
                className={cn("rounded-full px-3 py-1 text-[11.5px] font-medium disabled:opacity-35", days === n ? "bg-ink text-paper" : "text-ink/55 hover:text-ink")}
              >
                {n === 365 ? tr("1 year", "1 ano") : n + tr(" days", " dias")}
              </button>
            ))}
          </div>
        }
      />
      {!r && !error && <p role="status" className="text-[13px] text-ink/60">{tr("Loading analytics…", "Carregando estatísticas…")}</p>}
      {error && <p role="alert" className="text-[13px] text-[#8a2f25]">{message(l, error)}</p>}
      {r && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {Icon: Eye, label: tr("Page views", "Visualizações"), count: r.total},
              {Icon: Images, label: tr("Artwork opens", "Aberturas de obras"), count: r.artworkViews},
              {Icon: Layers, label: tr("Gallery views", "Visualizações de galerias"), count: r.galleryViews},
              {Icon: CalendarDays, label: tr("Days with visits", "Dias com visitas"), count: r.series.filter(day => day.views > 0).length},
            ].map(({Icon, label, count}) => <section key={label} className={cn(card, "p-4")}>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink/[0.05]"><Icon className="h-4 w-4 text-ink/55" /></span>
              <p className="mt-3 font-display text-2xl font-semibold leading-none tabular-nums">{count.toLocaleString(l)}</p>
              <p className="mt-1.5 text-[10.5px] uppercase tracking-[0.12em] text-ink/50">{label}</p>
            </section>)}
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <section className={cn(card, "min-w-0 p-5")}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-display text-[15px] font-semibold">{tr("Traffic", "Tráfego")}</h3>
                <span className="text-[11px] text-ink/55">{r.days} {tr("days", "dias")}</span>
              </div>
              {r.total ? <Chart series={r.series} l={l} height={190} /> : <EmptyStudio compact tone="lilac" title={tr("No views yet", "Nenhuma visualização ainda")} body={tr("Visits to your published pages will appear here.", "As visitas às páginas publicadas aparecerão aqui.")} />}
              {change !== null && (
                <p className={cn("mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-medium", change >= 0 ? "bg-mint/50" : "bg-coral/20")}>
                  {change >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  {change >= 0 ? "+" : ""}
                  {change}% {tr("vs previous period", "vs período anterior")}
                </p>
              )}
              <p className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-ink/45">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {tr("No IP addresses or personal data are stored.", "Nenhum endereço IP ou dado pessoal é guardado.")}
              </p>
            </section>
            {r.advanced ? <List title={tr("Where visitors come from", "De onde vêm os visitantes")} rows={(r.referrers ?? []).map(x => [REF[x.key]?.[l === "en" ? 0 : 1] ?? x.key, x.views])} empty={tr("No sources in this period.", "Sem origens neste período.")} /> :
              <List title={tr("Most visited pages", "Páginas mais visitadas")} rows={r.pages.map(p => [p.path, p.views])} empty={tr("No page views in this period.", "Sem visualizações neste período.")} />}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <section className={cn(card, "p-5")}>
              <h3 className="font-display text-[15px] font-semibold">{tr("Most opened artworks", "Obras mais abertas")}</h3>
              {r.works.length ? <ol className="mt-3 space-y-2">{r.works.map((w, i) => <li key={w.path} className="flex items-center gap-3">
                <span className="text-[10px] text-ink/45">{i+1}</span>
                {w.assetId && <img alt="" src={`/api/media/${site}/${w.assetId}/thumb`} className="h-9 w-9 rounded-md object-cover"/>}
                <span className="min-w-0 flex-1 truncate text-[12px]">{w.title}</span><span className="text-[12px] tabular-nums">{w.views}</span>
              </li>)}</ol> : <p className="mt-3 text-[12px] text-ink/50">{tr("No artwork views in this period.", "Sem visualizações de obras neste período.")}</p>}
            </section>
            <section className={cn(card, "min-w-0 p-5")}>
              <h3 className="font-display text-[15px] font-semibold">{tr("Popular galleries", "Galerias populares")}</h3>
              {r.galleries.length ? <ul className="mt-4 flex items-end gap-3 overflow-x-auto">{r.galleries.map(g => <li key={g.path} className="min-w-14 flex-1 text-center text-[11px]">
                <span className="tabular-nums">{g.views}</span>
                <span className="mx-auto mt-1 block w-full max-w-16 rounded-t bg-mint" style={{height: (100*g.views/r.galleries[0].views)+"px"}}/>
                <span className="mt-1.5 block truncate" title={g.path}>{g.path.replace("/galleries/", "")}</span>
              </li>)}</ul> : <p className="mt-3 text-[12px] text-ink/50">{tr("No gallery views in this period.", "Sem visualizações de galerias.")}</p>}
            </section>
          </div>
          {r.advanced ? (
            <div className="grid gap-4 md:grid-cols-3">
              <List title={tr("Most visited pages", "Páginas mais visitadas")} rows={r.pages.map(p => [p.path, p.views])} empty="—" />
              <List
                title={tr("Countries", "Países")}
                rows={(r.countries ?? []).map((x) => [x.key ? new Intl.DisplayNames([l], { type: "region" }).of(x.key) ?? x.key : tr("Unknown", "Desconhecido"), x.views])}
                empty="—"
              />
              <List title={tr("Contact link clicks", "Cliques em contatos")} rows={(r.clicks ?? []).map((x) => [x.target.replace(/^contact:/, ""), x.clicks])} empty={tr("No clicks yet.", "Nenhum clique ainda.")} />
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.2rem] border border-ink/10 bg-lilac/20 p-5">
              <p className="flex items-start gap-3 text-[12.5px] text-ink/65">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                {tr(
                  "Studio adds referrer categories, countries, contact-link clicks, period comparisons and up to a year of history.",
                  "O plano Estúdio inclui origens, países, cliques em contatos, comparação de períodos e até um ano de histórico.",
                )}
              </p>
              <button type="button" onClick={onUpgrade} className="rounded-full bg-ink px-4 py-2 text-[12px] font-medium text-paper">
                {tr("See plans", "Ver planos")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
