"use client";
import { studioIntent } from "../../shared/lib/studio-intent";
import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Check, MailCheck } from "lucide-react";
import { api } from "../../shared/lib/client";
import { t, message, type Lang } from "../../shared/lib/copy";
import { placeholderArt } from "../../shared/lib/placeholder";
import { Language } from "../../shared/ui/Language";
import Logo from "../../shared/ui/Logo";
import { Sparkle, Squiggle, Sticker } from "../../shared/ui/bits";
import { buttonClasses, Field, inputClasses } from "../../shared/ui/Field";

/* Port of Design/src/components/auth-art/AuthShell.jsx with the login,
   register, forgot-password and reset-password routes. Requests go to the real
   account API; reset and verification tokens are read from the URL fragment. */

export const modes = ["login", "register", "forgot", "reset", "verify"] as const;
type Mode = (typeof modes)[number];

type Text = [string, string];
const COPY: Record<Mode, { title: [Text, Text]; subtitle: Text; quote: Text }> = {
  login: {
    title: [
      ["Welcome back to\nyour ", "Que bom te ver\nno seu "],
      ["little universe.", "pequeno universo."],
    ],
    subtitle: ["Your portfolio is exactly where you left it.", "Seu portfólio está exatamente onde você deixou."],
    quote: ["“Make a little corner of the internet your own.”", "“Faça de um cantinho da internet o seu lugar.”"],
  },
  register: {
    title: [
      ["Let's build you\na ", "Vamos criar\num "],
      ["home for your art.", "lar para sua arte."],
    ],
    subtitle: ["One minute to set up. No card, no technical anything.", "Um minuto para começar. Sem cartão, sem complicação técnica."],
    quote: ["“Your imagination deserves more than a template.”", "“Sua imaginação merece mais do que um modelo.”"],
  },
  forgot: {
    title: [
      ["It happens.\nLet's get you ", "Acontece.\nVamos te "],
      ["back in.", "trazer de volta."],
    ],
    subtitle: ["Tell us your email and we'll send a link to choose a new password.", "Informe seu e-mail e enviaremos um link para escolher uma nova senha."],
    quote: ["“A home for everything you create.”", "“Um lar para tudo o que você cria.”"],
  },
  reset: {
    title: [
      ["A fresh\n", "Um novo\n"],
      ["start.", "começo."],
    ],
    subtitle: ["Choose something long and memorable. Every other session will be signed out.", "Escolha algo longo e fácil de lembrar. As outras sessões serão encerradas."],
    quote: ["“Your style. Your space.”", "“Seu estilo. Seu espaço.”"],
  },
  verify: {
    title: [
      ["One last\n", "Só mais um\n"],
      ["little step.", "passinho."],
    ],
    subtitle: ["Confirm your email address so you can publish your portfolio.", "Confirme seu e-mail para poder publicar seu portfólio."],
    quote: ["“Your art. Your style. Your space.”", "“Sua arte. Seu estilo. Seu espaço.”"],
  },
};

function Shell({ l, name, mode, footer, children }: { l: Lang; name: string; mode: Mode; footer?: ReactNode; children: ReactNode }) {
  const pick = ([en, pt]: Text) => (l === "en" ? en : pt);
  const c = COPY[mode];
  return (
    <div className="ui ui-page grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="relative flex flex-col px-6 py-8 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between gap-3">
          <Logo name={name} />
          <span className="flex items-center gap-3">
            <Language lang={l} className="grid h-8 w-8 place-items-center rounded-full border border-ink/12 text-[10px] font-semibold text-ink/55 hover:text-ink" />
            <a href="/" className="text-[12.5px] text-ink/50 transition-colors hover:text-ink">
              ← {l === "en" ? "Back to site" : "Voltar ao site"}
            </a>
          </span>
        </div>

        <main className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">
          <h1 className="whitespace-pre-line font-display text-[32px] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[38px]">
            {pick(c.title[0])}
            <span className="font-serif font-normal italic text-coral">{pick(c.title[1])}</span>
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-ink/55">{pick(c.subtitle)}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-7 text-[13px] text-ink/55">{footer}</div>}
        </main>

        <p className="text-[10.5px] uppercase tracking-[0.18em] text-ink/30">
          © {new Date().getFullYear()} {name} · {l === "en" ? "your art stays yours" : "sua arte continua sua"}
        </p>
      </div>

      <div className="relative hidden overflow-hidden bg-ink lg:block" aria-hidden="true">
        <img src={placeholderArt(l)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-95" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-coral/25 via-transparent to-lilac/30" />
        <div className="absolute inset-x-10 top-10 flex justify-end">
          <Sticker tone="butter" className="[transform:rotate(3deg)]">
            {l === "en" ? "a home for your work" : "um lar para suas obras"}
          </Sticker>
        </div>
        <div className="absolute inset-x-10 bottom-12 text-paper">
          <Sparkle size={20} className="text-coral" />
          <p className="mt-4 max-w-[380px] font-serif text-[26px] italic leading-[1.25]">{pick(c.quote)}</p>
          <Squiggle className="mt-4 text-coral/70" width={140} />
          <p className="mt-6 text-[11px] uppercase tracking-[0.22em] text-paper/45">
            {name} · {l === "en" ? "small universes, built by artists" : "pequenos universos, feitos por artistas"}
          </p>
        </div>
      </div>
    </div>
  );
}

function Done({ icon, title, body, children }: { icon: ReactNode; title: string; body: string; children: ReactNode }) {
  return (
    <div className="u-pop rounded-[1.3rem] border border-ink/12 bg-ivory p-6 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-mint">{icon}</span>
      <p className="mt-4 font-display text-[18px] font-semibold">{title}</p>
      <p role="status" className="mt-2 text-[13px] leading-relaxed text-ink/55">
        {body}
      </p>
      {children}
    </div>
  );
}

const link = "font-medium text-ink underline decoration-coral decoration-2 underline-offset-4";

export function Auth({ mode, lang: l, name, query = "" }: { mode: Mode; lang: Lang; name: string; query?: string }) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const [error, setError] = useState(""),
    [done, setDone] = useState(false),
    [busy, setBusy] = useState(false),
    [password, setPassword] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const values: Record<string, unknown> = Object.fromEntries(new FormData(e.currentTarget));
    if (mode === "login") values.remember = values.remember === "on";
    if (mode === "reset" && values.confirm !== values.password) {
      setError(tr("The passwords do not match.", "As senhas não coincidem."));
      setBusy(false);
      return;
    }
    delete values.confirm;
    if (mode === "register") values.accept = values.accept === "on";
    try {
      if (mode === "verify" || mode === "reset") values.token = location.hash.slice(1);
      await api("/auth/" + mode, "POST", values);
      if (mode === "login" || mode === "register") location.assign("/studio" + studioIntent(location.search).query);
      else {
        setDone(true);
        history.replaceState(null, "", location.pathname);
      }
    } catch (err) {
      setError(message(l, (err as Error).message));
    } finally {
      setBusy(false);
    }
  }
  const footer =
    mode === "login" ? (
      <>
        {tr("New here?", "Primeira vez por aqui?")}{" "}
        <a href={"/auth/register" + query} className={link}>
          {t(l, "register")}
        </a>
      </>
    ) : mode === "register" ? (
      <>
        {tr("Already have an account?", "Já tem uma conta?")}{" "}
        <a href={"/auth/login" + query} className={link}>
          {t(l, "login")}
        </a>
      </>
    ) : (
      <>
        {tr("Remembered it?", "Lembrou?")}{" "}
        <a href={"/auth/login" + query} className={link}>
          {tr("Back to sign in", "Voltar para entrar")}
        </a>
      </>
    );

  if (done)
    return (
      <Shell l={l} name={name} mode={mode} footer={mode === "forgot" ? footer : undefined}>
        {mode === "forgot" ? (
          <Done icon={<MailCheck className="h-5 w-5 text-ink/70" />} title={tr("Check your inbox", "Confira sua caixa de entrada")} body={t(l, "mailSent")}>
            <a href="/auth/login" className={buttonClasses("paper", "md", "mt-5 w-full")}>
              {t(l, "login")}
            </a>
          </Done>
        ) : (
          <Done
            icon={<Check className="h-5 w-5 text-ink/70" />}
            title={mode === "verify" ? tr("All set", "Tudo certo") : tr("Password updated", "Senha atualizada")}
            body={t(l, mode === "verify" ? "verified" : "resetDone")}
          >
            <a href={mode === "verify" ? "/studio" : "/auth/login"} className={buttonClasses("ink", "md", "mt-5 w-full")}>
              {t(l, mode === "verify" ? "open" : "login")} <ArrowRight className="h-4 w-4" />
            </a>
          </Done>
        )}
      </Shell>
    );

  return (
    <Shell l={l} name={name} mode={mode} footer={footer}>
      <form onSubmit={submit} className="space-y-4">
        {mode === "register" && (
          <Field label={t(l, "name")}>
            <input required maxLength={80} name="displayName" autoComplete="name" placeholder={tr("How should we call you?", "Como devemos te chamar?")} className={inputClasses()} />
          </Field>
        )}
        {(mode === "login" || mode === "register" || mode === "forgot") && (
          <Field label={t(l, "email")}>
            <input required name="email" type="email" autoComplete="email" placeholder={tr("you@studio.com", "voce@estudio.com")} className={inputClasses()} />
          </Field>
        )}
        {(mode === "login" || mode === "register" || mode === "reset") && (
          <Field
            label={mode === "reset" ? tr("New password", "Nova senha") : tr("Password", "Senha")}
            hint={mode === "login" ? undefined : tr("12 or more characters. Something you'd actually remember.", "12 caracteres ou mais. Algo que você vá lembrar.")}
          >
            <input
              type="password"
              required
              name="password"
              minLength={12}
              maxLength={256}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className={inputClasses()}
            />
          </Field>
        )}
        {mode === "reset" && <Field label={tr("Confirm password", "Confirmar senha")}>
          <input required type="password" name="confirm" autoComplete="new-password" maxLength={256} className={inputClasses()} />
        </Field>}
        {mode !== "login" && mode !== "forgot" && mode !== "verify" && (
          <div className="flex gap-1.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i} className={"h-1 flex-1 rounded-full transition-colors " + (password.length >= 6 + i * 6 ? "bg-coral" : "bg-ink/12")} />
            ))}
          </div>
        )}
        {mode === "register" && (
          <label className="flex items-start gap-2.5 pt-1 text-[12.5px] leading-relaxed text-ink/60">
            <input type="checkbox" name="accept" required className="mt-0.5 h-4 w-4 shrink-0 accent-coral" />
            <span>
              {tr("I accept the ", "Aceito os ")}
              <a href="/legal/terms" target="_blank" className="underline underline-offset-2 hover:text-ink">
                {tr("Terms of service", "Termos de uso")}
              </a>{" "}
              {tr("and the ", "e a ")}
              <a href="/legal/privacy" target="_blank" className="underline underline-offset-2 hover:text-ink">
                {tr("Privacy policy", "Política de privacidade")}
              </a>
              . {tr("Your artwork always remains yours.", "Suas obras continuam sempre suas.")}
            </span>
          </label>
        )}
        {mode === "login" && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="flex items-center gap-2 text-[12.5px] text-ink/65">
              <input type="checkbox" defaultChecked name="remember" className="accent-coral" />
              {tr("Keep me signed in", "Manter sessão iniciada")}
            </label>
            <a href="/auth/forgot" className="text-[12.5px] text-ink/55 underline decoration-ink/25 underline-offset-4 hover:text-ink">
              {t(l, "forgot")}
            </a>
          </div>
        )}
        {error && (
          <p role="alert" className="rounded-xl bg-coral/15 px-3 py-2.5 text-[12.5px] text-[#8a2f25]">
            {error}
          </p>
        )}
        <button className={buttonClasses("primary", "lg", "w-full")} disabled={busy}>
          {busy
            ? mode === "register"
              ? tr("Setting up your studio…", "Preparando seu ateliê…")
              : mode === "login"
                ? tr("Opening your studio…", "Abrindo seu ateliê…")
                : t(l, "loading")
            : t(l, mode === "forgot" ? "send" : mode === "reset" ? "reset" : mode === "verify" ? "verify" : mode)}
          {!busy && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
        </button>
        {mode === "register" && (
          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-1">
            {[tr("Free to start", "Grátis para começar"), tr("Four templates", "Quatro modelos"), tr("Publish in an afternoon", "Publique em uma tarde")].map((p) => (
              <li key={p} className="flex items-center gap-1.5 text-[11.5px] text-ink/45">
                <Check className="h-3 w-3 text-coral" /> {p}
              </li>
            ))}
          </ul>
        )}
      </form>
    </Shell>
  );
}
