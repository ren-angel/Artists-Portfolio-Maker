"use client";
import { useState, type FormEvent } from "react";
import { api } from "../lib/client";
import { t, message, type Lang, type Key } from "../lib/copy";
import { Brand } from "./Brand";
import { Language } from "./Language";
export const modes = [
  "login",
  "register",
  "forgot",
  "reset",
  "verify",
] as const;
type Mode = (typeof modes)[number];
export function Auth({
  mode,
  lang: l,
  name,
}: {
  mode: Mode;
  lang: Lang;
  name: string;
}) {
  const [error, setError] = useState(""),
    [done, setDone] = useState(false),
    [busy, setBusy] = useState(false);
  const titles: Record<Mode, Key> = {
    login: "login",
    register: "register",
    forgot: "send",
    reset: "reset",
    verify: "verify",
  };
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (mode === "verify" || mode === "reset")
        values.token = location.hash.slice(1);
      await api("/auth/" + mode, "POST", values);
      if (mode === "login" || mode === "register") location.assign("/studio");
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
  return (
    <main className="auth-shell">
      <div className="auth-left">
        <header>
          <Brand name={name} />
          <Language lang={l} />
        </header>
        <section>
          <h1>{t(l, titles[mode])}</h1>
          {done ? (
            <>
              <p role="status">
                {t(
                  l,
                  mode === "forgot"
                    ? "mailSent"
                    : mode === "verify"
                      ? "verified"
                      : "resetDone",
                )}
              </p>
              <a
                href={mode === "verify" ? "/studio" : "/auth/login"}
                className="btn ink"
              >
                {t(l, mode === "verify" ? "open" : "login")}
              </a>
            </>
          ) : (
            <form onSubmit={submit}>
              {mode === "register" && (
                <label>
                  {t(l, "name")}
                  <input
                    required
                    maxLength={80}
                    name="displayName"
                    autoComplete="name"
                  />
                </label>
              )}
              {!["verify", "reset"].includes(mode) && (
                <label>
                  {t(l, "email")}
                  <input
                    required
                    name="email"
                    type="email"
                    autoComplete="email"
                  />
                </label>
              )}
              {["register", "login", "reset"].includes(mode) && (
                <label>
                  {t(l, "password")}
                  <input
                    type="password"
                    required
                    name="password"
                    minLength={12}
                    maxLength={256}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                  />
                </label>
              )}
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <button className="btn ink" disabled={busy}>
                {t(l, titles[mode])} →
              </button>
              <nav>
                {mode === "login" ? (
                  <>
                    <a href="/auth/forgot">{t(l, "forgot")}</a>
                    <a href="/auth/register">{t(l, "register")}</a>
                  </>
                ) : (
                  <a href="/auth/login">{t(l, "login")}</a>
                )}
              </nav>
            </form>
          )}
        </section>
      </div>
      <aside className="auth-art">
        <img alt="" src="/prints/creative.webp" />
        <em>
          {t(l, "hero")} {t(l, "hero2")} {t(l, "universe")}.
        </em>
      </aside>
    </main>
  );
}
