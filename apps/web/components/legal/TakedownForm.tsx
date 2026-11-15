"use client";
import { useState } from "react";
import { api } from "../../lib/client";
import { message, type Lang } from "../../lib/copy";
import { buttonClasses, Field, inputClasses } from "../auth/Field";

export function TakedownForm({ l }: { l: Lang }) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const [state, setState] = useState<"idle" | "busy" | "done">("idle"),
    [error, setError] = useState("");
  return state === "done" ? (
    <p role="status" className="mt-10 rounded-xl bg-mint/40 px-4 py-3 text-[13px]">
      {tr("Received. We'll review it and reply by email.", "Recebido. Vamos analisar e responder por e-mail.")}
    </p>
  ) : (
    <form
      className="u-paper mt-10 space-y-4 rounded-[1.4rem] p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
        setState("busy");
        setError("");
        try {
          await api("/support/public", "POST", { email: f.email, topic: "copyright", message: f.message, ...(f.website ? { website: f.website } : {}) });
          setState("done");
        } catch (err) {
          setError((err as Error).message);
          setState("idle");
        }
      }}
    >
      <h2 className="font-display text-[19px] font-semibold">{tr("Send a takedown request", "Enviar pedido de remoção")}</h2>
      <Field label={tr("Your email", "Seu e-mail")}>
        <input name="email" type="email" required maxLength={254} className={inputClasses("h-11")} />
      </Field>
      <Field label={tr("Details", "Detalhes")}>
        <textarea name="message" required minLength={20} maxLength={5000} rows={6} className={inputClasses("h-auto py-3 leading-relaxed")} />
      </Field>
      {/* Spam trap, hidden from people and assistive technology. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />
      {error && <p role="alert" className="text-[12.5px] text-[#8a2f25]">{message(l, error)}</p>}
      <button disabled={state === "busy"} className={buttonClasses("ink", "md")}>
        {tr("Send request", "Enviar pedido")}
      </button>
    </form>
  );
}
