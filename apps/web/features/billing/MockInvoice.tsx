"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, FlaskConical, XCircle } from "lucide-react";
import { formatMoney } from "@studio/shared";
import { api } from "../../shared/lib/client";
import { message, type Lang } from "../../shared/lib/copy";
import { buttonClasses } from "../../shared/ui/Field";

type Invoice = { id: string; status: string; amount: number; currency: string; dueDate: string; method: string | null; cycle: string };

/** Local stand-in for the provider's hosted invoice (mock billing driver
    only). Buttons emit provider-shaped events through the normal pipeline. */
export function MockInvoice({ id, l }: { id: string; l: Lang }) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const [inv, setInv] = useState<Invoice | null>(null),
    [error, setError] = useState(""),
    [done, setDone] = useState("");
  useEffect(() => {
    api<Invoice>("/billing/mock/" + id).then(setInv, (e) => setError((e as Error).message));
  }, [id]);
  const act = (action: "confirm" | "fail") =>
    api("/billing/mock/" + id + "/" + action, "POST", {}).then(
      () => setDone(action),
      (e) => setError((e as Error).message),
    );
  return (
    <main className="ui ui-page grid min-h-screen place-items-center px-6 py-12">
      <div className="u-paper w-full max-w-[420px] rounded-[1.6rem] p-6 sm:p-8">
        <p className="flex items-center gap-2 rounded-full bg-butter/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
          <FlaskConical className="h-3.5 w-3.5" /> {tr("Test mode · no money moves", "Modo de teste · nenhum dinheiro é movimentado")}
        </p>
        <h1 className="mt-5 font-display text-[26px] font-semibold tracking-tight">{tr("Simulated invoice", "Fatura simulada")}</h1>
        {error && <p role="alert" className="mt-4 rounded-xl bg-coral/15 px-3 py-2.5 text-[12.5px] text-[#8a2f25]">{message(l, error)}</p>}
        {inv && (
          <dl className="mt-5 space-y-2 text-[13px]">
            <div className="flex justify-between"><dt className="text-ink/50">{tr("Amount", "Valor")}</dt><dd className="font-semibold">{formatMoney({ amount: inv.amount, currency: inv.currency }, l)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/50">{tr("Due", "Vencimento")}</dt><dd>{inv.dueDate}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/50">{tr("Method", "Forma")}</dt><dd>{inv.method === "PIX" ? "Pix" : tr("Card", "Cartão")}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/50">Status</dt><dd>{inv.status}</dd></div>
          </dl>
        )}
        {done ? (
          <div role="status" className="mt-6 flex items-center gap-2 rounded-xl bg-mint/40 px-3 py-3 text-[13px]">
            {done === "confirm" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {done === "confirm" ? tr("Payment confirmed by the simulator.", "Pagamento confirmado pelo simulador.") : tr("Payment failure simulated.", "Falha de pagamento simulada.")}
          </div>
        ) : (
          inv && (
            <div className="mt-6 grid gap-2">
              <button type="button" onClick={() => act("confirm")} className={buttonClasses("primary", "md")}>
                {tr("Simulate approved payment", "Simular pagamento aprovado")}
              </button>
              <button type="button" onClick={() => act("fail")} className={buttonClasses("paper", "md")}>
                {tr("Simulate failed payment", "Simular falha no pagamento")}
              </button>
            </div>
          )
        )}
        <a href="/studio?billing=return" className="mt-5 block text-center text-[12.5px] text-ink/55 underline underline-offset-4 hover:text-ink">
          {tr("Back to the studio", "Voltar ao ateliê")}
        </a>
      </div>
    </main>
  );
}
