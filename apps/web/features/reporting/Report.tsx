"use client";
import { useState } from "react";
import { Check, Flag } from "lucide-react";
import { api } from "../../shared/lib/client";
import { t, message, type Lang } from "../../shared/lib/copy";
import Logo from "../../shared/ui/Logo";
import { buttonClasses, Field, inputClasses } from "../../shared/ui/Field";

/** Abuse report form, styled like the authentication screens. */
export function Report({ handle, l, name }: { handle: string; l: Lang; name: string }) {
  const [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  return (
    <div className="ui ui-page flex min-h-screen flex-col px-6 py-8 sm:px-10">
      <div className="flex items-center justify-between gap-3">
        <Logo name={name} />
        <a href="/" className="text-[12.5px] text-ink/50 transition-colors hover:text-ink">
          ← {l === "en" ? "Back to site" : "Voltar ao site"}
        </a>
      </div>
      <main className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center py-12">
        <div className="u-paper rounded-[1.6rem] p-6 sm:p-8">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-coral/15">
            <Flag className="h-4 w-4 text-coral" />
          </span>
          <h1 className="mt-4 font-display text-[26px] font-semibold leading-tight tracking-[-0.03em]">{t(l, "report")}</h1>
          {handle && (
            <p className="mt-2 inline-block rounded-full bg-ink/[0.06] px-2.5 py-1 font-mono text-[12px] text-ink/60">{handle}</p>
          )}
          <a className="mt-3 block text-sm underline" href="/legal/copyright">{l==="en"?"Copyright notices and appeals":"Denúncias de direitos autorais e recursos"}</a>
          {done ? (
            <p role="status" className="u-pop mt-6 flex items-center gap-2 rounded-xl bg-mint/40 px-3 py-3 text-[13px]">
              <Check className="h-4 w-4 shrink-0" /> {t(l, "received")}
            </p>
          ) : (
            <form
              className="mt-6 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setStatus("");
                const reason = new FormData(e.currentTarget).get("reason");
                try {
                  await api("/reports", "POST", { handle, reason });
                  setDone(true);
                } catch (err) {
                  setStatus(message(l, (err as Error).message));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Field label={t(l, "reason")}>
                <textarea name="reason" minLength={5} maxLength={2000} required rows={5} className={inputClasses("h-auto resize-y py-3 leading-relaxed")} />
              </Field>
              {status && (
                <p role="alert" className="rounded-xl bg-coral/15 px-3 py-2.5 text-[12.5px] text-[#8a2f25]">
                  {status}
                </p>
              )}
              <button disabled={busy} className={buttonClasses("ink", "md", "w-full")}>
                {t(l, "reportSend")}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
