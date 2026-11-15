"use client";
import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import type { Lang } from "../../lib/copy";
import { api } from "../../lib/client";
import { card } from "./parts";

const labels: Record<string, [string, string]> = {
  publish: ["Portfolio published", "Portfólio publicado"], unpublish: ["Portfolio unpublished", "Portfólio despublicado"],
  verify: ["Email verified", "E-mail confirmado"], reset: ["Password reset", "Senha redefinida"],
  domain_added: ["Custom domain added", "Domínio próprio adicionado"],
  subscription_active: ["Subscription activated", "Assinatura ativada"], subscription_past_due: ["Payment overdue", "Pagamento em atraso"],
  subscription_canceling: ["Subscription ending", "Assinatura em encerramento"], subscription_canceled: ["Subscription ended", "Assinatura encerrada"],
  subscription_cancel_requested: ["Cancellation requested", "Cancelamento solicitado"], subscription_expired: ["Subscription expired", "Assinatura expirada"],
};
export function ActivityFeed({ l }: { l: Lang }) {
  const [items, setItems] = useState<{id: string; event: string; at: string}[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    api<NonNullable<typeof items>>("/me/activity").then(setItems, () => setFailed(true));
  }, []);
  return <section className={card + " p-5"}>
    <h3 className="flex items-center justify-between font-display text-[15px] font-semibold">
      {l === "en" ? "Recent activity" : "Atividade recente"}<Activity aria-hidden className="h-4 w-4 text-ink/30" />
    </h3>
    {!items?.length && <p role="status" className="mt-4 text-[12px] text-ink/60">{failed ? (l === "en" ? "Activity unavailable." : "Atividade indisponível.") :
      !items ? "…" : (l === "en" ? "No account activity yet." : "Nenhuma atividade na conta ainda.")}</p>}
    <ul className="mt-4 space-y-3.5">{items?.map((e,i) =>
      <li className="flex gap-3" key={e.id}>
        <span className={"mt-1.5 h-2 w-2 shrink-0 rounded-full " + ["bg-coral","bg-mint","bg-lilac","bg-butter"][i % 4]} />
        <div><p className="text-[12.5px]">{(labels[e.event] ?? ["Account updated", "Conta atualizada"])[l === "en" ? 0 : 1]}</p>
          <time dateTime={e.at} className="text-[11px] text-ink/55">{new Date(e.at).toLocaleString(l)}</time></div>
      </li>)}</ul>
  </section>;
}
