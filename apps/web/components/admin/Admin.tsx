"use client";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Search, ShieldAlert } from "lucide-react";
import { api } from "../../lib/client";
import { message, type Lang } from "../../lib/copy";
import { cn } from "../home/types";
import Logo from "../home/Logo";
import { card, PageHeader } from "../studio/parts";

/* Operator console. Every call is authorized on the server (non-admins get
   404) and mutations are written to the admin audit log there. */

type Row = Record<string, unknown>;
const TABS = ["overview", "users", "billing", "domains", "reports", "support", "audit"] as const;
type Tab = (typeof TABS)[number];
const LABEL: Record<Tab, [string, string]> = {
  overview: ["Overview", "Visão geral"],
  users: ["Users", "Usuários"],
  billing: ["Billing reconciliation", "Conciliação"],
  domains: ["Domain problems", "Problemas de domínio"],
  reports: ["Abuse reports", "Denúncias"],
  support: ["Support", "Suporte"],
  audit: ["Audit log", "Auditoria"],
};
const when = (v: unknown, l: Lang) => (v ? new Date(String(v)).toLocaleString(l) : "—");
const mb = (v: unknown) => (Number(v ?? 0) / 1024 ** 2).toFixed(1) + " MB";

function Table({ rows, cols, l }: { rows: Row[]; cols: [string, string, ((r: Row) => React.ReactNode)?][]; l: Lang }) {
  if (!rows.length) return <p className="px-5 py-6 text-[12.5px] text-ink/45">{l === "en" ? "Nothing here." : "Nada por aqui."}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[12px]">
        <thead className="text-[9.5px] uppercase tracking-[0.14em] text-ink/40">
          <tr>{cols.map(([, h]) => <th key={h} className="whitespace-nowrap px-4 py-2.5 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={String(r.id ?? i)} className="border-t border-ink/[0.07] align-top">
              {cols.map(([k, h, f]) => <td key={h} className="max-w-[320px] px-4 py-2.5">{f ? f(r) : String(r[k] ?? "—")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Admin({ l, name }: { l: Lang; name: string }) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const [tab, setTab] = useState<Tab>("overview"),
    [data, setData] = useState<unknown>(null),
    [q, setQ] = useState(""),
    [error, setError] = useState(""),
    [denied, setDenied] = useState(false);
  const load = useCallback(async () => {
    setError("");
    try {
      const path = { overview: "/admin/overview", users: "/admin/users?q=" + encodeURIComponent(q), billing: "/admin/billing", domains: "/admin/domains", reports: "/admin/reports", support: "/admin/support", audit: "/admin/audit" }[tab];
      setData(await api(path));
    } catch (e) {
      const m = (e as Error).message;
      if (m === "not_found" || m === "unauthorized") setDenied(true);
      else setError(m);
    }
  }, [tab, q]);
  useEffect(() => {
    void load();
  }, [load]);
  const act = async (path: string, body: object) => {
    try {
      await api(path, "POST", body);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  if (denied)
    return (
      <main className="ui ui-page grid min-h-screen place-items-center px-6 text-center">
        <div>
          <ShieldAlert className="mx-auto h-8 w-8 text-ink/40" />
          <h1 className="mt-4 font-display text-[24px] font-semibold">{tr("Page not found", "Página não encontrada")}</h1>
        </div>
      </main>
    );
  const rows = (data ?? []) as Row[];
  const status = (url: string, current: string, options: string[]) => (
    <select defaultValue={current} onChange={(e) => void act(url, { status: e.target.value })} className="rounded-md border border-ink/15 bg-paper px-1.5 py-1 text-[11.5px]">
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
  return (
    <div className="ui ui-page">
      <header className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
        <Logo name={name} />
        <span className="rounded-full bg-ink px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-paper">{tr("Administration", "Administração")}</span>
      </header>
      <div className="mx-auto max-w-[1240px] px-6 py-8">
        <PageHeader eyebrow={tr("Operators only", "Somente operadores")} title={LABEL[tab][l === "en" ? 0 : 1]} actions={<button type="button" onClick={() => void load()} className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-ivory px-3.5 py-2 text-[12px]"><RefreshCw className="h-3.5 w-3.5" /> {tr("Refresh", "Atualizar")}</button>} />
        <nav className="mt-5 flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button key={t} type="button" onClick={() => { setData(null); setTab(t); }} aria-current={tab === t ? "page" : undefined} className={cn("rounded-full border px-3 py-1.5 text-[12px]", tab === t ? "border-ink bg-ink text-paper" : "border-ink/12 bg-ivory text-ink/60 hover:text-ink")}>
              {LABEL[t][l === "en" ? 0 : 1]}
            </button>
          ))}
        </nav>
        {error && <p role="alert" className="mt-4 rounded-xl bg-coral/15 px-4 py-3 text-[12.5px] text-[#8a2f25]">{message(l, error)}</p>}
        <section className={cn(card, "mt-5 overflow-hidden")}>
          {tab === "overview" && data !== null && (
            <dl className="grid gap-px bg-ink/10 sm:grid-cols-3 lg:grid-cols-5">
              {Object.entries(data as Row).map(([k, v]) => (
                <div key={k} className="bg-ivory p-4">
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-ink/40">{k}</dt>
                  <dd className="mt-1 font-display text-[22px] font-semibold">{k === "storageBytes" ? mb(v) : typeof v === "object" && v ? Object.entries(v as Row).map(([a, b]) => a + ": " + b).join(" · ") : String(v ?? 0)}</dd>
                </div>
              ))}
            </dl>
          )}
          {tab === "users" && (
            <>
              <form onSubmit={(e) => { e.preventDefault(); void load(); }} className="flex gap-2 border-b border-ink/10 p-4">
                <label className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/35" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("Email, name or handle", "E-mail, nome ou endereço")} aria-label={tr("Search users", "Buscar usuários")} className="h-9 w-full rounded-full border border-ink/15 bg-paper pl-8 pr-3 text-[12.5px]" />
                </label>
              </form>
              <Table l={l} rows={rows} cols={[
                ["email", tr("Email", "E-mail")],
                ["handle", tr("Handle", "Endereço")],
                ["plan", tr("Plan", "Plano")],
                ["subscription", tr("Subscription", "Assinatura")],
                ["storageBytes", tr("Storage", "Armazenamento"), (r) => mb(r.storageBytes)],
                ["verified", tr("Verified", "Verificado"), (r) => (r.verified ? "✓" : "—")],
                ["restrictedAt", tr("Restriction", "Restrição"), (r) => (
                  <button type="button" onClick={() => {
                    const restricted = !r.restrictedAt;
                    const reason = restricted ? prompt(tr("Reason (recorded in the audit log)", "Motivo (registrado na auditoria)")) : "";
                    if (restricted && reason === null) return;
                    void act(`/admin/users/${r.id}/restriction`, { restricted, reason: reason ?? "" });
                  }} className={cn("rounded-full px-2.5 py-1 text-[11px]", r.restrictedAt ? "bg-coral/20" : "border border-ink/15")}>
                    {r.restrictedAt ? tr("Restricted · lift", "Restrito · liberar") : tr("Restrict", "Restringir")}
                  </button>
                )],
              ]} />
            </>
          )}
          {tab === "billing" && data !== null && (
            <>
              <h3 className="px-5 pt-4 text-[12px] font-semibold">{tr("Subscriptions needing attention", "Assinaturas com pendências")}</h3>
              <Table l={l} rows={((data as Row).subscriptions as Row[]) ?? []} cols={[
                ["email", tr("Email", "E-mail")], ["plan", tr("Plan", "Plano")], ["status", "Status"], ["periodEnd", tr("Paid through", "Pago até"), (r) => when(r.periodEnd, l)],
                ["syncError", tr("Last error", "Último erro")], ["syncedAt", tr("Synced", "Sincronizado"), (r) => when(r.syncedAt, l)],
                ["id", "", (r) => <button type="button" onClick={() => void act(`/admin/billing/${r.id}/sync`, {})} className="rounded-full border border-ink/15 px-2.5 py-1 text-[11px]">{tr("Re-sync", "Sincronizar")}</button>],
              ]} />
              <h3 className="border-t border-ink/10 px-5 pt-4 text-[12px] font-semibold">{tr("Provider events not processed", "Eventos não processados")}</h3>
              <Table l={l} rows={((data as Row).events as Row[]) ?? []} cols={[["type", tr("Event", "Evento")], ["objectId", tr("Object", "Objeto")], ["attempts", tr("Attempts", "Tentativas")], ["lastError", tr("Error", "Erro")], ["receivedAt", tr("Received", "Recebido"), (r) => when(r.receivedAt, l)]]} />
            </>
          )}
          {tab === "domains" && <Table l={l} rows={rows} cols={[["hostname", tr("Domain", "Domínio")], ["handle", tr("Portfolio", "Portfólio")], ["status", "Status"], ["dnsOk", "DNS", (r) => (r.dnsOk ? "✓" : "✗")], ["tlsOk", "HTTPS", (r) => (r.tlsOk ? "✓" : "✗")], ["error", tr("Problem", "Problema")], ["checkedAt", tr("Checked", "Verificado"), (r) => when(r.checkedAt, l)]]} />}
          {tab === "reports" && <Table l={l} rows={rows} cols={[["handle", tr("Portfolio", "Portfólio"), (r) => r.handle ? <a className="underline" href={"/site/" + r.handle} target="_blank" rel="noreferrer">{String(r.handle)}</a> : "—"], ["reason", tr("Reason", "Motivo")], ["createdAt", tr("Received", "Recebida"), (r) => when(r.createdAt, l)], ["status", "Status", (r) => status(`/admin/reports/${r.id}`, String(r.status), ["open", "reviewed", "actioned", "dismissed"])]]} />}
          {tab === "support" && <Table l={l} rows={rows} cols={[["email", tr("From", "De")], ["topic", tr("Topic", "Assunto")], ["message", tr("Message", "Mensagem"), (r) => <span className="whitespace-pre-wrap">{String(r.message)}</span>], ["createdAt", tr("Received", "Recebido"), (r) => when(r.createdAt, l)], ["status", "Status", (r) => status(`/admin/support/${r.id}`, String(r.status), ["open", "answered", "closed"])]]} />}
          {tab === "audit" && <Table l={l} rows={rows} cols={[["createdAt", tr("When", "Quando"), (r) => when(r.createdAt, l)], ["admin", tr("Admin", "Admin")], ["action", tr("Action", "Ação")], ["target", tr("Target", "Alvo")], ["detail", tr("Detail", "Detalhe"), (r) => JSON.stringify(r.detail)]]} />}
        </section>
      </div>
    </div>
  );
}
