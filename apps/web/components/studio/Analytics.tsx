"use client";
import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Lock, ShieldCheck } from "lucide-react";
import { api } from "../../lib/client";
import { message, type Lang } from "../../lib/copy";
import { cn } from "../home/types";
import { card, EmptyStudio, PageHeader } from "./parts";

export type Report = {
  days: number;
  maxDays: number;
  advanced: boolean;
  total: number;
  series: { day: string; views: number }[];
  pages: { path: string; views: number }[];
  galleries: { path: string; views: number }[];
  referrers?: { key: string; views: number }[];
  countries?: { key: string | null; views: number }[];
  clicks?: { target: string; clicks: number }[];
  previous?: number;
};

/** Daily views as accessible bars: values are real counts, never estimates. */
export function Chart({ series, l, height = 140 }: { series: Report["series"]; l: Lang; height?: number }) {
  const max = Math.max(1, ...series.map((d) => d.views));
  return (
    <figure>
      <div className="flex items-end gap-[2px]" style={{ height }} role="img" aria-label={(l === "en" ? "Daily views, " : "Visualizações diárias, ") + series.map((d) => d.day + ": " + d.views).join(", ")}>
        {series.map((d) => (
          <div key={d.day} className="group relative flex-1">
            <div className="rounded-t-[3px] bg-coral/80 transition-colors group-hover:bg-coral" style={{ height: Math.max(2, (d.views / max) * height) }} />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[10px] text-paper group-hover:block">
              {new Date(d.day + "T12:00:00Z").toLocaleDateString(l, { day: "numeric", month: "short" })} · {d.views}
            </span>
          </div>
        ))}
      </div>
      <figcaption className="mt-2 flex justify-between text-[10px] text-ink/40">
        <span>{series[0] && new Date(series[0].day + "T12:00:00Z").toLocaleDateString(l, { day: "numeric", month: "short" })}</span>
        <span>{series.at(-1) && new Date(series.at(-1)!.day + "T12:00:00Z").toLocaleDateString(l, { day: "numeric", month: "short" })}</span>
      </figcaption>
    </figure>
  );
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
    api<Report>(`/sites/${site}/analytics?days=${days}`).then(setR, (e) => setError((e as Error).message));
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
                disabled={!!r && n > r.maxDays}
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
      {error && <p role="alert" className="text-[13px] text-[#8a2f25]">{message(l, error)}</p>}
      {r && (
        <>
          <div className="grid gap-4 lg:grid-cols-[1fr_2.2fr]">
            <section className={cn(card, "p-5")}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/40">{tr("Total views", "Visualizações")}</p>
              <p className="mt-2 font-display text-[44px] font-semibold leading-none tracking-[-0.04em] tabular-nums">{r.total.toLocaleString(l)}</p>
              <p className="mt-2 text-[12px] text-ink/50">
                {tr("last", "últimos")} {r.days} {tr("days", "dias")}
              </p>
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
            <section className={cn(card, "p-5")}>
              {r.total ? <Chart series={r.series} l={l} /> : <EmptyStudio compact tone="lilac" title={tr("No views yet", "Nenhuma visualização ainda")} body={tr("Publish your portfolio and share the link — views appear here the same day.", "Publique o portfólio e compartilhe o link — as visualizações aparecem aqui no mesmo dia.")} />}
            </section>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <List title={tr("Most visited pages", "Páginas mais visitadas")} rows={r.pages.map((p) => [p.path, p.views])} empty={tr("No page views in this period.", "Sem visualizações neste período.")} />
            <List title={tr("Popular galleries", "Galerias populares")} rows={r.galleries.map((p) => [p.path.replace("/galleries/", ""), p.views])} empty={tr("No gallery views in this period.", "Sem visualizações de galerias.")} />
          </div>
          {r.advanced ? (
            <div className="grid gap-4 md:grid-cols-3">
              <List title={tr("Where visitors come from", "De onde vêm os visitantes")} rows={(r.referrers ?? []).map((x) => [REF[x.key]?.[l === "en" ? 0 : 1] ?? x.key, x.views])} empty="—" />
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
