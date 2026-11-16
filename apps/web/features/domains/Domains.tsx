"use client";
import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Globe, Lock, RefreshCw, Star, Trash2, X } from "lucide-react";
import { api } from "../../shared/lib/client";
import { message, type Lang } from "../../shared/lib/copy";
import { cn } from "../../shared/lib/cn";
import { buttonClasses, inputClasses } from "../../shared/ui/Field";
import { card, PageHeader } from "../../shared/ui/studio-kit";

type Domain = {
  id: string;
  hostname: string;
  status: "pending" | "verified" | "failed";
  primary: boolean;
  dnsOk: boolean;
  tlsOk: boolean;
  error: string | null;
  checkedAt: string | null;
  instructions: { txt: { name: string; value: string }; cname: string | null; a: string | null };
};

function Copyable({ value, l }: { value: string; l: Lang }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(value).then(() => setDone(true), () => setDone(false))}
      className="group flex min-w-0 max-w-full items-center gap-2 rounded-lg border border-ink/12 bg-paper px-2.5 py-1.5 text-left font-mono text-[11.5px] hover:border-ink/35"
      title={l === "en" ? "Copy" : "Copiar"}
    >
      <span className="truncate">{value}</span>
      {done ? <Check className="h-3.5 w-3.5 shrink-0 text-[#2f8a68]" /> : <Copy className="h-3.5 w-3.5 shrink-0 text-ink/35 group-hover:text-ink" />}
    </button>
  );
}

function Chip({ ok, label, pending }: { ok: boolean; label: string; pending?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[10.5px] font-medium", ok ? "bg-mint/60" : pending ? "bg-butter/70" : "bg-ink/[0.07] text-ink/55")}>
      {ok ? <Check className="h-3 w-3" /> : pending ? <RefreshCw className="h-3 w-3" /> : <X className="h-3 w-3" />} {label}
    </span>
  );
}

export function Domains({ l, site, handle, address, publicHref, published, onUpgrade }: { l: Lang; site: string; handle: string; address: string; publicHref: string; published: boolean; onUpgrade: () => void }) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const [state, setState] = useState<{ entitled: boolean; domains: Domain[] } | null>(null),
    [host, setHost] = useState(""),
    [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  const load = useCallback(async () => setState(await api("/sites/" + site + "/domains")), [site]);
  useEffect(() => {
    void load().catch((e) => setError((e as Error).message));
  }, [load]);
  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    setError("");
    try {
      await fn();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  };
  const primary = state?.entitled && state.domains.find(d => d.primary && d.status === "verified" && d.dnsOk && d.tlsOk);
  const ERR: Record<string, [string, string]> = {
    txt_missing: ["We couldn't find the TXT record yet. DNS changes can take from minutes to a few hours.", "Ainda não encontramos o registro TXT. Mudanças de DNS levam de minutos a algumas horas."],
    dns_not_pointing: ["Ownership confirmed. Now point the domain to us with the record below.", "Propriedade confirmada. Agora aponte o domínio para nós com o registro abaixo."],
    tls_pending: ["DNS is pointing to us. A valid HTTPS certificate has not been confirmed yet. Check again shortly.", "O DNS aponta para nós. Ainda não confirmamos um certificado HTTPS válido. Verifique novamente em instantes."],
  };
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={tr("Growth", "Crescimento")}
        title={tr("Custom domain", "Domínio próprio")}
        subtitle={tr(
          `Use your own address, like artistname.com. Your free address ${address} keeps working either way.`,
          `Use seu próprio endereço, como nomedoartista.com. O endereço gratuito ${address} continua funcionando.`,
        )}
      />
      {!state && !error && <p role="status" className="text-[13px] text-ink/60">{tr("Loading domains…", "Carregando domínios…")}</p>}
      {error && (
        <p role="alert" className="rounded-xl bg-coral/15 px-4 py-3 text-[12.5px] text-[#8a2f25]">
          {message(l, error)}
        </p>
      )}
      <div className="grid items-start gap-4 lg:grid-cols-2">
      <section className={cn(card, "p-5")}>
        <h2 className="font-display text-[15px] font-semibold">{tr("Platform address", "Endereço da plataforma")}</h2>
        <div className="mt-3"><Copyable value={address} l={l} /></div>
        <dl className="mt-4 divide-y divide-ink/10 text-[12px]">
          <div className="flex justify-between py-2"><dt>{tr("Plan", "Plano")}</dt><dd>{tr("Included in all plans", "Incluso em todos os planos")}</dd></div>
          <div className="flex justify-between py-2"><dt>{tr("Publication", "Publicação")}</dt><dd>{published ? tr("Published", "Publicado") : tr("Draft", "Rascunho")}</dd></div>
        </dl>
        {published && <a href={publicHref} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[12px] underline decoration-coral underline-offset-4">{tr("Open the live site", "Abrir portfólio publicado")} →</a>}
      </section>
      {state && !state.entitled && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.2rem] border border-ink/10 bg-lilac/20 p-5">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 text-ink/50" />
            <div>
              <p className="font-display text-[15px] font-semibold">{tr("Available on Artist and Studio", "Disponível nos planos Artista e Estúdio")}</p>
              <p className="mt-1 max-w-[520px] text-[12.5px] text-ink/60">
                {state.domains.length
                  ? tr("Your domains are kept but not served while your plan doesn't include them. Visitors are served your free address.", "Seus domínios ficam guardados, mas não são servidos enquanto o plano não os incluir. Visitantes usam o endereço gratuito.")
                  : tr("Connect a domain you already own. We'll walk you through the DNS settings.", "Conecte um domínio que você já tem. Nós explicamos cada passo do DNS.")}
              </p>
            </div>
          </div>
          <button type="button" onClick={onUpgrade} className={buttonClasses("ink", "sm")}>
            {tr("See plans", "Ver planos")}
          </button>
        </div>
      )}
      {state?.entitled && (
        <section className={cn(card, "p-5")}>
        <h2 className="font-display text-[15px] font-semibold">{tr("Connect a domain you already own", "Conecte um domínio que você já tem")}</h2>
        <p className="mt-1 text-[12px] text-ink/55">{tr("Keep managing it with your current registrar.", "Continue gerenciando o domínio no seu registrador atual.")}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run("add", async () => {
              await api("/sites/" + site + "/domains", "POST", { hostname: host });
              setHost("");
            });
          }}
          className="mt-4 flex flex-wrap items-end gap-2"
        >
          <label className="min-w-[240px] flex-1">
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-ink/45">{tr("Your domain", "Seu domínio")}</span>
            <input required value={host} onChange={(e) => setHost(e.target.value)} placeholder="portfolio.artistname.com" className={inputClasses("h-11")} />
          </label>
          <button disabled={busy === "add"} className={buttonClasses("ink", "md")}>
            <Globe className="h-4 w-4" /> {tr("Connect domain", "Conectar domínio")}
          </button>
        </form>
        {!state.domains.length && <ol className="mt-4 list-decimal space-y-2 border-t border-ink/10 pt-4 pl-4 text-[12px] text-ink/65">
          <li>{tr("Enter the address you want visitors to use.", "Digite o endereço que os visitantes usarão.")}</li>
          <li>{tr("Copy the ownership and routing records to your DNS settings.", "Copie os registros de propriedade e de destino para as configurações de DNS.")}</li>
          <li>{tr("Check the connection here. When HTTPS is confirmed, you can use this address as primary.", "Verifique a conexão aqui. Após a confirmação do HTTPS, você pode usar esse endereço como principal.")}</li>
        </ol>}
        </section>
      )}
      </div>
      {state?.domains.map((d) => {
        return (
          <section key={d.id} className={cn(card, "p-5")}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate font-display text-[18px] font-semibold tracking-tight">
                  {d.hostname} {primary && primary.id === d.id && <Star className="h-4 w-4 fill-butter text-[#b38600]" aria-label={tr("Primary", "Principal")} />}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Chip ok={d.status === "verified"} label={tr("Ownership", "Propriedade")} pending={d.status === "pending"} />
                  <Chip ok={d.dnsOk} label={tr("Points to us", "Aponta para nós")} pending={d.status === "verified" && !d.dnsOk} />
                  <Chip ok={d.tlsOk} label="HTTPS" pending={d.dnsOk && !d.tlsOk} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={!!busy} onClick={() => void run(d.id, () => api(`/sites/${site}/domains/${d.id}/verify`, "POST", {}))} className={buttonClasses("paper", "sm")}>
                  <RefreshCw className={cn("h-3.5 w-3.5", busy === d.id && "animate-spin")} /> {tr("Check again", "Verificar de novo")}
                </button>
                {state.entitled && d.status === "verified" && d.dnsOk && d.tlsOk && !d.primary && (
                  <button type="button" disabled={!!busy} onClick={() => void run(d.id, () => api(`/sites/${site}/domains/${d.id}/primary`, "POST", {}))} className={buttonClasses("paper", "sm")}>
                    {tr("Make primary", "Tornar principal")}
                  </button>
                )}
                <button
                  type="button"
                  disabled={!!busy}
                  aria-label={tr("Remove", "Remover")}
                  onClick={() => {
                    if (confirm(tr("Remove this domain? Visitors will use your free address.", "Remover este domínio? Visitantes usarão o endereço gratuito.")))
                      void run(d.id, () => api(`/sites/${site}/domains/${d.id}`, "DELETE"));
                  }}
                  className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-ink/45 hover:border-coral hover:text-coral"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            {d.error && ERR[d.error] && <p className="mt-3 text-[12.5px] text-ink/60">{ERR[d.error][l === "en" ? 0 : 1]}</p>}
            {published && state.entitled && d.status === "verified" && d.dnsOk && d.tlsOk && (
              <p className="mt-3 text-[12.5px] text-[#2f6d55]">
                {tr("Live at", "No ar em")}{" "}
                <a href={"https://" + d.hostname} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">
                  https://{d.hostname}
                </a>
              </p>
            )}
            {!(d.dnsOk && d.status === "verified") && (
              <ol className="mt-4 space-y-3 rounded-xl bg-paper/70 p-4 text-[12.5px]">
                <li>
                  <p className="font-medium">1. {tr("Prove it's yours: add a TXT record at your DNS provider", "Prove que é seu: crie um registro TXT no seu provedor de DNS")}</p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
                    <span className="text-ink/50">{tr("Name / host", "Nome / host")}</span>
                    <Copyable l={l} value={d.instructions.txt.name} />
                    <span className="text-ink/50">{tr("Value", "Valor")}</span>
                    <Copyable l={l} value={d.instructions.txt.value} />
                  </div>
                </li>
                <li>
                  <p className="font-medium">2. {tr("Point the domain to us", "Aponte o domínio para nós")}</p>
                  {d.instructions.a && (

                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
                        <span className="text-ink/50">{tr("A (root or subdomain)", "A (raiz ou subdomínio)")}</span>
                        <Copyable l={l} value={d.instructions.a} />
                      </div>
                  )}
                  {d.instructions.cname && (
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
                      <span className="text-ink/50">{tr("CNAME (subdomain)", "CNAME (subdomínio)")}</span>
                      <Copyable l={l} value={d.instructions.cname} />
                    </div>
                  )}
                  {!d.instructions.a && !d.instructions.cname && (
                    <p className="mt-1 text-ink/55">{tr("The platform hasn't configured a routing target yet.", "A plataforma ainda não configurou um destino de roteamento.")}</p>
                  )}
                </li>
                <li className="text-ink/55">3. {tr("Come back and press “Check again”. HTTPS is confirmed after the hosting provider serves a valid certificate.", "Volte e clique em “Verificar de novo”. O HTTPS é confirmado quando a hospedagem apresenta um certificado válido.")}</li>
              </ol>
            )}
            <p className="mt-3 text-[11px] text-ink/40">
              {handle && tr("Serves the portfolio", "Serve o portfólio")} /{handle}
              {d.checkedAt && " · " + tr("last checked", "última verificação") + " " + new Date(d.checkedAt).toLocaleString(l)}
            </p>
          </section>
        );
      })}
      {primary && <section className={cn(card, "p-5")}>
        <h3 className="font-display text-[15px] font-semibold">{tr("Primary address", "Endereço principal")}</h3>
        <p className="mt-1 text-[12px] text-ink/60">{tr("Published pages identify this address as their canonical domain. Your platform address also serves your portfolio.",
          "As páginas publicadas indicam este endereço como domínio canônico. O endereço da plataforma também exibe seu portfólio.")}</p>
        <p className="mt-3 break-all font-mono text-[12px]">{primary.hostname}</p>
      </section>}
    </div>
  );
}
