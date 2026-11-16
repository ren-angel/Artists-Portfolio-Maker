"use client";
import { studioIntent } from "../../shared/lib/studio-intent";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, Check, CreditCard, ExternalLink, FlaskConical, QrCode, RefreshCw, X } from "lucide-react";
import { formatMoney, plans, type Cycle, type Features, type Limits, type Method, type PlanId } from "@studio/shared";
import { api } from "../../shared/lib/client";
import { message, type Lang } from "../../shared/lib/copy";
import { cn } from "../../shared/lib/cn";
import { buttonClasses, Field, inputClasses } from "../../shared/ui/Field";
import { card, EmptyStudio, PageHeader } from "../../shared/ui/studio-kit";
import { CompareTable } from "./CompareTable";
import { Sticker } from "../../shared/ui/bits";
import { PlanCards, featureRows, planName, size, type Catalog } from "./PlanCards";

type Sub = {
  id: string;
  plan: Exclude<PlanId, "free">;
  cycle: Cycle;
  method: Method;
  amount: number;
  currency: string;
  status: "pending" | "active" | "past_due" | "canceling" | "canceled" | "expired";
  periodEnd: string | null;
  graceUntil: string | null;
  startsAt: string;
};
type Payment = { id: string; subscriptionId: string; status: string; amount: number; currency: string; dueDate: string; paidAt: string | null; invoiceUrl: string | null; plan: string };
export type BillingState = {
  plan: PlanId;
  limits: Limits;
  features: Features;
  usage: { artworks: number; storage: number; pages: number };
  subscriptions: Sub[];
  payments: Payment[];
  provider: string;
  live: boolean;
};

const STATUS: Record<Sub["status"], [string, string, string]> = {
  pending: ["Awaiting payment", "Aguardando pagamento", "bg-butter"],
  active: ["Active", "Ativo", "bg-mint"],
  past_due: ["Payment overdue", "Pagamento atrasado", "bg-coral/40"],
  canceling: ["Ends at period end", "Termina no fim do período", "bg-lilac/50"],
  canceled: ["Canceled", "Cancelado", "bg-ink/10"],
  expired: ["Expired", "Expirado", "bg-ink/10"],
};

export function usageWarnings(l: Lang, b: Pick<BillingState, "limits" | "usage">) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const rows: [string, number, number, string][] = [
    [tr("Storage", "Armazenamento"), b.usage.storage, b.limits.storage, size(b.usage.storage) + " / " + size(b.limits.storage)],
    [tr("Artworks", "Obras"), b.usage.artworks, b.limits.artworks, b.usage.artworks + " / " + b.limits.artworks],
    [tr("Custom pages", "Páginas"), b.usage.pages, b.limits.pages, b.usage.pages + " / " + b.limits.pages],
  ];
  return rows.map(([label, used, max, text]) => ({ label, share: max ? used / max : 0, text, over: used > max }));
}

export function Usage({ l, b }: { l: Lang; b: Pick<BillingState, "limits" | "usage"> }) {
  return (
    <div className="space-y-3">
      {usageWarnings(l, b).map((u) => (
        <div key={u.label}>
          <div className="flex items-center justify-between text-[11.5px]">
            <span className="text-ink/60">{u.label}</span>
            <span className={cn("font-medium", u.over ? "text-[#a3392c]" : u.share >= 0.8 ? "text-[#8a6100]" : "text-ink/55")}>{u.text}</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-ink/10">
            <div
              className={cn("h-1.5 rounded-full", u.over ? "bg-[#c4483a]" : u.share >= 0.8 ? "bg-[#d9a400]" : "bg-ink/60")}
              style={{ width: Math.min(100, u.share * 100) + "%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Billing({ l, onChange }: { l: Lang; onChange: () => Promise<void> }) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const [b, setB] = useState<BillingState | null>(null),
    [catalog, setCatalog] = useState<Catalog | null>(null),
    [choice, setChoice] = useState<{ plan: Exclude<PlanId, "free">; cycle: Cycle } | null>(null),
    [method, setMethod] = useState<Method>("card"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [note, setNote] = useState("");
  const load = useCallback(async () => {
    const [state, cat] = await Promise.all([api<BillingState>("/billing"), api<Catalog>("/billing/plans")]);
    setB(state);
    setCatalog(cat);
  }, []);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setNote("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    // Returning from the hosted invoice: re-read the provider, never trust the redirect.
    const back = new URLSearchParams(location.search).has("billing");
    void run(async () => {
      if (back) {
        await api("/billing/sync", "POST", {});
        history.replaceState(null, "", location.pathname);
        await onChange();
      }
      await load();
      const intent = studioIntent(location.search);
      if (intent.plan) {
        setChoice({ plan: intent.plan, cycle: intent.cycle });
        history.replaceState(null, "", location.pathname + "?tab=billing");
      }
    });
  }, [load, onChange]);
  if (!b || !catalog)
    return (
      <div className="space-y-5">
        <PageHeader eyebrow={tr("Account", "Conta")} title={tr("Plan & billing", "Plano e cobrança")} />
        {error ? <p role="alert" className="text-[13px] text-[#8a2f25]">{message(l, error)}</p> : <p role="status" className="text-[13px] text-ink/50">…</p>}
      </div>
    );
  const open = b.subscriptions.filter((s) => ["pending", "active", "past_due", "canceling"].includes(s.status));
  const current = open.find((s) => s.status !== "pending");
  const pending = open.filter((s) => s.status === "pending");
  const due = (id: string) => b.payments.find((p) => p.subscriptionId === id && ["pending", "overdue"].includes(p.status) && p.invoiceUrl);
  const date = (d: string | null) => (d ? new Date(d).toLocaleDateString(l, { day: "numeric", month: "long", year: "numeric" }) : "—");
  const target = choice ? plans[choice.plan] : null;
  const exceeds =
    target &&
    [
      [b.usage.pages > target.limits.pages, tr(`${b.usage.pages} pages (limit ${target.limits.pages})`, `${b.usage.pages} páginas (limite ${target.limits.pages})`)],
      [b.usage.artworks > target.limits.artworks, tr(`${b.usage.artworks} artworks (limit ${target.limits.artworks})`, `${b.usage.artworks} obras (limite ${target.limits.artworks})`)],
      [b.usage.storage > target.limits.storage, tr(`${size(b.usage.storage)} stored (limit ${size(target.limits.storage)})`, `${size(b.usage.storage)} armazenados (limite ${size(target.limits.storage)})`)],
    ].filter(([over]) => over);
  const scheduled = Boolean(choice && current && (plans[choice.plan].rank < plans[current.plan].rank || current.status === "canceling" || choice.plan === current.plan));

  const checkout = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    void run(async () => {
      const r = await api<{ invoiceUrl: string | null; subscriptionId: string }>("/billing/checkout", "POST", {
        ...choice,
        method,
        taxId: form.taxId || undefined,
        name: form.name || undefined,
      });
      await load();
      setChoice(null);
      if (r.invoiceUrl) location.assign(r.invoiceUrl);
      else setNote(tr("Your new plan is scheduled. You'll receive its first invoice when it starts.", "Seu novo plano foi agendado. A primeira fatura chega quando ele começar."));
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={tr("Account", "Conta")}
        title={tr("Plan & billing", "Plano e cobrança")}
        subtitle={tr(
          "Affordable plans for artists. Paid features switch on only after the payment provider confirms your payment.",
          "Planos acessíveis para artistas. Os recursos pagos só são liberados depois que o provedor confirma o pagamento.",
        )}
        actions={
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(async () => (await api("/billing/sync", "POST", {}), await onChange(), await load()))}
            className={buttonClasses("paper", "sm")}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", busy && "animate-spin")} /> {tr("Check payment status", "Verificar pagamento")}
          </button>
        }
      />
      {!b.live && (
        <p className="flex items-start gap-2 rounded-xl border border-dashed border-ink/25 bg-butter/30 px-4 py-3 text-[12.5px] text-ink/70">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" />
          {b.provider === "mock"
            ? tr("Test mode: invoices open a local simulator and no money moves.", "Modo de teste: as faturas abrem um simulador local e nenhum dinheiro é movimentado.")
            : tr("Sandbox mode: invoices use the payment provider's test environment.", "Modo sandbox: as faturas usam o ambiente de testes do provedor.")}
        </p>
      )}
      {(error || note) && (
        <p role={error ? "alert" : "status"} className={cn("rounded-xl px-4 py-3 text-[12.5px]", error ? "bg-coral/15 text-[#8a2f25]" : "bg-mint/40 text-ink/70")}>
          {error ? message(l, error) : note}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="relative isolate overflow-hidden rounded-[1.2rem] border border-ink bg-ink p-5 text-paper">
          <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 -z-10 h-40 w-40 rounded-full bg-coral/25 blur-3xl" />
          <Sticker tone="coral" className="float-right rotate-3 text-ink">{tr("Your plan", "Seu plano")}</Sticker>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-paper/65">{tr("Current plan", "Plano atual")}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="font-display text-[26px] font-semibold tracking-tight">{planName(l, b.plan)}</h2>
            {current && <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink", STATUS[current.status][2])}>{STATUS[current.status][l === "en" ? 0 : 1]}</span>}
          </div>
          {current ? (
            <dl className="mt-4 grid gap-3 text-[12.5px] sm:grid-cols-2">
              <div>
                <dt className="text-paper/65">{tr("Price", "Valor")}</dt>
                <dd className="font-medium">
                  {formatMoney({ amount: current.amount, currency: current.currency }, l)} / {current.cycle === "monthly" ? tr("month", "mês") : tr("year", "ano")}
                </dd>
              </div>
              <div>
                <dt className="text-paper/65">{tr("Payment", "Pagamento")}</dt>
                <dd className="font-medium">
                  {current.method === "card" ? tr("Card · renews automatically", "Cartão · renova automaticamente") : tr("Pix · you pay each invoice", "Pix · você paga cada fatura")}
                </dd>
              </div>
              <div>
                <dt className="text-paper/65">
                  {current.status === "canceling" ? tr("Access until", "Acesso até") : current.status === "past_due" ? tr("Grace period until", "Carência até") : tr("Paid through", "Pago até")}
                </dt>
                <dd className="font-medium">{date(current.status === "past_due" ? current.graceUntil : current.periodEnd)}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-[13px] text-paper/70">{tr("You're on the free plan. Upgrade whenever you need more room.", "Você está no plano grátis. Faça upgrade quando precisar de mais espaço.")}</p>
          )}
          <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
            {featureRows(l, { id: b.plan, limits: b.limits, features: b.features, prices: null })
              .filter(([, included]) => included).map(([label]) =>
                <li key={label} className="flex items-center gap-2 text-[11.5px] text-paper/80"><Check aria-hidden className="h-3 w-3 shrink-0 text-mint" />{label}</li>)}
          </ul>
          <a href="#plan-comparison" className="mr-4 mt-5 inline-flex rounded-full border border-paper/30 px-4 py-2 text-[12px] hover:bg-paper/10">
            {tr("Compare plans", "Comparar planos")}
          </a>
          {current?.status === "past_due" && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-coral/15 px-3 py-2.5 text-[12.5px] text-paper">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {tr(
                "We couldn't confirm your renewal. Your plan stays active during the grace period; after that the site keeps working on the free plan and nothing is deleted.",
                "Não confirmamos a renovação. O plano segue ativo durante a carência; depois disso o site continua no plano grátis e nada é apagado.",
              )}
            </p>
          )}
          {pending.map((s) => {
            const p = due(s.id);
            return (
              <div key={s.id} className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-paper/35 px-3 py-2.5 text-[12.5px]">
                <span>
                  {planName(l, s.plan)} · {s.method === "card" ? tr("card", "cartão") : "Pix"} ·{" "}
                  {new Date(s.startsAt) > new Date() ? tr("starts", "começa em") + " " + date(s.startsAt) : tr("awaiting payment", "aguardando pagamento")}
                </span>
                <span className="flex gap-2">
                  {p?.invoiceUrl && (
                    <a href={p.invoiceUrl} className={buttonClasses("primary", "sm")}>
                      {tr("Pay invoice", "Pagar fatura")} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void run(async () => (await api("/billing/cancel", "POST", { subscriptionId: s.id }), await load()))}
                    className={buttonClasses("paper", "sm")}
                  >
                    {tr("Discard", "Descartar")}
                  </button>
                </span>
              </div>
            );
          })}
          {current && current.status !== "canceling" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (
                  confirm(
                    tr(
                      `Cancel ${planName(l, current.plan)}? You keep paid features until ${date(current.periodEnd)}. No further charges will be made, and your content is never deleted.`,
                      `Cancelar ${planName(l, current.plan)}? Você mantém os recursos pagos até ${date(current.periodEnd)}. Não haverá novas cobranças e seu conteúdo nunca é apagado.`,
                    ),
                  )
                )
                  void run(async () => (await api("/billing/cancel", "POST", { subscriptionId: current.id }), await onChange(), await load()));
              }}
              className="mt-5 text-[12px] text-paper/75 underline decoration-paper/40 underline-offset-4 hover:text-coral"
            >
              {tr("Cancel subscription", "Cancelar assinatura")}
            </button>
          )}
        </section>
        <section className={cn(card, "p-5")}>
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/40">{tr("Usage", "Uso")}</p>
          <Usage l={l} b={b} />
        </section>
      </div>

      {choice && (
        <form onSubmit={checkout} className="u-pop rounded-[1.4rem] border border-ink bg-ivory p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/40">{tr("Checkout", "Assinatura")}</p>
              <h3 className="mt-1 font-display text-[22px] font-semibold tracking-tight">
                {planName(l, choice.plan)} · {formatMoney(catalog.plans.find((p) => p.id === choice.plan)!.prices![choice.cycle], l)} /{" "}
                {choice.cycle === "monthly" ? tr("month", "mês") : tr("year", "ano")}
              </h3>
            </div>
            <button type="button" onClick={() => setChoice(null)} aria-label={tr("Close", "Fechar")} className="grid h-8 w-8 place-items-center rounded-full text-ink/50 hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </div>
          {scheduled && current && (
            <p className="mt-4 rounded-xl bg-lilac/25 px-3 py-2.5 text-[12.5px] text-ink/75">
              {tr(
                `This change starts on ${date(current.periodEnd)}, when your paid ${planName(l, current.plan)} period ends. There is no partial refund; you keep everything you paid for until then.`,
                `A mudança começa em ${date(current.periodEnd)}, quando termina o período pago do plano ${planName(l, current.plan)}. Não há reembolso parcial; você mantém tudo o que pagou até lá.`,
              )}
            </p>
          )}
          {current && !scheduled && (
            <p className="mt-4 rounded-xl bg-mint/30 px-3 py-2.5 text-[12.5px] text-ink/75">
              {tr(
                "Upgrades apply as soon as the first payment is confirmed. Your previous plan then stops renewing; there is no proration of the remaining days.",
                "Upgrades valem assim que o primeiro pagamento é confirmado. O plano anterior para de renovar; não há proporcionalidade dos dias restantes.",
              )}
            </p>
          )}
          {exceeds && exceeds.length > 0 && (
            <div className="mt-4 rounded-xl border border-coral/40 bg-coral/10 px-3 py-2.5 text-[12.5px] text-ink/75">
              <p className="font-medium">{tr("Your current content is above this plan's limits:", "Seu conteúdo atual passa dos limites deste plano:")}</p>
              <ul className="mt-1 list-disc pl-5">
                {exceeds.map(([, text]) => (
                  <li key={text as string}>{text as string}</li>
                ))}
              </ul>
              <p className="mt-1">
                {tr(
                  "Nothing is deleted. You can keep editing, but you'll need to remove some content before adding more.",
                  "Nada é apagado. Você continua editando, mas precisará remover algum conteúdo antes de adicionar mais.",
                )}
              </p>
            </div>
          )}
          <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={tr("Payment method", "Forma de pagamento")}>
            {(
              [
                ["card", CreditCard, tr("Credit card", "Cartão de crédito"), tr("Renews automatically each cycle.", "Renova automaticamente a cada ciclo.")],
                ["pix", QrCode, "Pix", tr("We send an invoice each cycle. It does not renew by itself.", "Enviamos uma fatura a cada ciclo. Não renova sozinho.")],
              ] as const
            ).map(([id, Icon, name, hint]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={method === id}
                onClick={() => setMethod(id)}
                className={cn("flex items-start gap-3 rounded-xl border p-3 text-left", method === id ? "border-ink bg-paper ring-1 ring-ink" : "border-ink/15 hover:border-ink/40")}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-ink/60" />
                <span>
                  <span className="block text-[13px] font-medium">{name}</span>
                  <span className="mt-0.5 block text-[11.5px] text-ink/55">{hint}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label={tr("Name on the invoice", "Nome na cobrança")}>
              <input name="name" maxLength={120} autoComplete="name" className={inputClasses("h-11")} />
            </Field>
            <Field label="CPF / CNPJ" hint={tr("Required by the payment provider the first time. We don't store it.", "Exigido pelo provedor na primeira vez. Não guardamos esse dado.")}>
              <input name="taxId" inputMode="numeric" maxLength={20} autoComplete="off" className={inputClasses("h-11")} />
            </Field>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-[460px] text-[11.5px] text-ink/45">
              {tr("You'll pay on the provider's secure page. We never see or store card details.", "Você paga na página segura do provedor. Nunca vemos nem guardamos dados de cartão.")}{" "}
              <a href="/legal/refunds" className="underline underline-offset-2">
                {tr("Refund & cancellation policy", "Política de reembolso e cancelamento")}
              </a>
            </p>
            <button disabled={busy} className={buttonClasses("primary", "md")}>
              {scheduled ? tr("Schedule change", "Agendar mudança") : tr("Continue to payment", "Ir para o pagamento")}
            </button>
          </div>
        </form>
      )}

      <PlanCards l={l} catalog={catalog} current={current ? current.plan : b.plan} currentCycle={current?.cycle} onChoose={(plan, cycle) => plan !== "free" && setChoice({ plan, cycle })} />
      <CompareTable l={l} catalog={catalog} />

      <section className={cn(card, "overflow-hidden")}>
        <h3 className="border-b border-ink/10 px-5 py-3 font-display text-[15px] font-semibold tracking-tight">{tr("Payment history", "Histórico de pagamentos")}</h3>
        {b.payments.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead className="text-[10px] uppercase tracking-[0.14em] text-ink/40">
                <tr>
                  {[tr("Due", "Vencimento"), tr("Plan", "Plano"), tr("Amount", "Valor"), "Status", ""].map((h) => (
                    <th key={h} className="px-5 py-2.5 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.payments.map((p) => (
                  <tr key={p.id} className="border-t border-ink/[0.07]">
                    <td className="px-5 py-2.5">{new Date(p.dueDate + "T12:00:00Z").toLocaleDateString(l)}</td>
                    <td className="px-5 py-2.5">{planName(l, p.plan as PlanId)}</td>
                    <td className="px-5 py-2.5">{formatMoney({ amount: p.amount, currency: p.currency }, l)}</td>
                    <td className="px-5 py-2.5">
                      {
                        {
                          confirmed: tr("Paid", "Pago"),
                          pending: tr("Open", "Em aberto"),
                          overdue: tr("Overdue", "Vencido"),
                          refunded: tr("Refunded", "Reembolsado"),
                          failed: tr("Failed", "Falhou"),
                          deleted: tr("Canceled", "Cancelado"),
                        }[p.status]
                      }
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      {p.invoiceUrl && (
                        <a href={p.invoiceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink/55 hover:text-ink">
                          {tr("Invoice", "Fatura")} <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyStudio compact title={tr("No payments yet", "Nenhum pagamento ainda")} className="m-4" />
        )}
      </section>
    </div>
  );
}
