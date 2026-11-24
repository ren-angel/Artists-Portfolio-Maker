"use client";
import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Check, Download, Globe, LifeBuoy, Lock, Shield, User } from "lucide-react";
import { artCategories, type DirectoryProfile, type Draft, type Visibility } from "@doodallery/shared";
import { t, message, type Lang } from "../../shared/lib/copy";
import { api } from "../../shared/lib/client";
import type { Artist, Update } from "../studio/use-draft";
import { cn } from "../../shared/lib/cn";
import { PageHeader } from "../../shared/ui/studio-kit";

const SECTIONS = [
  { id: "profile", icon: User, label: ["Profile", "Perfil"] },
  { id: "account", icon: Lock, label: ["Account details", "Dados da conta"] },
  { id: "language", icon: Globe, label: ["Language", "Idioma"] },
  { id: "privacy", icon: Shield, label: ["Privacy & discovery", "Privacidade e descoberta"] },
  { id: "data", icon: Shield, label: ["Your data", "Seus dados"] },
  { id: "support", icon: LifeBuoy, label: ["Help & support", "Ajuda e suporte"] },
  { id: "danger", icon: AlertTriangle, label: ["Account management", "Gerenciar conta"] },
] as const;
const inputCls = "w-full rounded-lg border border-ink/12 bg-paper px-3 py-2 text-[12.5px] focus:border-ink/40 focus:outline-none";
const small = "mb-1 block text-[9.5px] uppercase tracking-[0.14em] text-ink/35";

function Row({ title, body, children }: { title: string; body?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-ink/[0.07] py-3.5 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div>
        <p className="text-[12.5px] font-medium">{title}</p>
        {body && <p className="mt-0.5 max-w-[380px] text-[11px] leading-relaxed text-ink/40">{body}</p>}
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  );
}

export function Settings({
  d,
  update,
  l,
  site,
  user,
  handle,
  address,
  published,
  refresh,
  onUnpublish,
}: {
  d: Draft;
  update: Update;
  l: Lang;
  site: string;
  user: Artist;
  handle: string;
  address: string;
  published: boolean;
  refresh: () => Promise<void>;
  onUnpublish: () => Promise<void>;
}) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const [section, setSection] = useState<(typeof SECTIONS)[number]["id"]>("profile"),
    [name, setName] = useState(user.displayName),
    [avatar, setAvatar] = useState(user.avatar || ""),
    [secret, setSecret] = useState(""),
    [busy, setBusy] = useState(false),
    [note, setNote] = useState(""),
    [error, setError] = useState("");
  const [profile,setProfile]=useState<DirectoryProfile|null>(null);
  const [visibility, setVisibility] = useState<Visibility | null>(null);
  useEffect(() => {
    if (section !== "privacy") return;
    let active = true;
    api<DirectoryProfile>("/sites/"+site+"/directory").then(p=>{if(active)setProfile(p)},e=>{if(active)setError(e.message)});
    api<Visibility>("/sites/" + site + "/visibility").then(v => { if (active) setVisibility(v); },
      e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [section, site]);
  const run = async (fn: () => Promise<void>, done = "") => {
    setBusy(true);
    setError("");
    setNote("");
    try {
      await fn();
      setNote(done);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const pill = "rounded-full border border-ink/15 px-3 py-1.5 text-[11px] font-medium hover:border-ink/40 disabled:opacity-50";
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={tr("Your account", "Sua conta")}
        title={t(l, "settingsNav")}
        subtitle={tr("The practical bits, your details, your language and your account.", "O lado prático, seus dados, seu idioma e sua conta.")}
      />

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto rounded-xl border border-ink/10 bg-ivory p-1.5 lg:flex-col lg:self-start lg:overflow-visible">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-current={section === s.id ? "page" : undefined}
              onClick={() => {
                setSection(s.id);
                setNote("");
                setError("");
              }}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] transition-colors",
                section === s.id ? "bg-ink text-paper" : "text-ink/55 hover:bg-ink/[0.05] hover:text-ink",
              )}
            >
              <s.icon className={cn("h-3.5 w-3.5", section === s.id ? "text-coral" : "text-ink/35")} />
              {s.label[l === "en" ? 0 : 1]}
            </button>
          ))}
        </nav>

        <div className="rounded-[1.1rem] border border-ink/10 bg-ivory p-5">
          {(note || error) && (
            <p role={error ? "alert" : "status"} className={cn("mb-4 rounded-xl px-3 py-2 text-[12px]", error ? "bg-coral/15 text-[#8a2f25]" : "bg-mint/40 text-ink/70")}>
              {error ? message(l, error) : note}
            </p>
          )}

          {section === "privacy" && (
            <section>
              <h2 className="font-display text-[16px] font-semibold">
                {tr("Privacy & discovery", "Privacidade e descoberta")}
              </h2>
              {profile && (
                <form
                  className="my-3 space-y-2 rounded-xl border border-ink/10 p-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void run(
                      async () => setProfile(await api("/sites/" + site + "/directory", "PUT", profile)),
                      tr("Saved.", "Salvo."),
                    );
                  }}
                >
                  <label className="block">
                    <input
                      type="checkbox"
                      checked={profile.listed}
                      onChange={(e) => setProfile({ ...profile, listed: e.target.checked })}
                    />{" "}
                    {tr(
                      "List my published portfolio in the artist directory",
                      "Listar meu portfólio publicado no diretório de artistas",
                    )}
                  </label>
                  <label>
                    {tr("Art category", "Categoria de arte")}
                    <select
                      className={inputCls}
                      value={profile.category}
                      onChange={(e) =>
                        setProfile({ ...profile, category: e.target.value as DirectoryProfile["category"] })
                      }
                    >
                      <option value="">-</option>
                      {Object.entries(artCategories).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v[l === "en" ? 0 : 1]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {tr("Public tags", "Tags públicas")}
                    <input
                      className={inputCls}
                      maxLength={240}
                      value={profile.tags}
                      onChange={(e) => setProfile({ ...profile, tags: e.target.value })}
                    />
                  </label>
                  <button disabled={busy} className={pill}>
                    {t(l, "save")}
                  </button>
                </form>
              )}
              {!visibility && !error && <p role="status">{t(l, "loading")}</p>}
              {visibility &&
                (
                  [
                    [
                      "discoverable",
                      tr("Show my work in Discover", "Exibir minhas obras na descoberta"),
                      tr(
                        "Include artwork from your published portfolio in the public exhibition.",
                        "Inclui obras do portfólio publicado na exposição pública.",
                      ),
                    ],
                    [
                      "indexable",
                      tr("Search engine indexing", "Indexação em buscadores"),
                      tr(
                        "Allow search engines to list your published pages.",
                        "Permite que buscadores listem suas páginas publicadas.",
                      ),
                    ],
                  ] as const
                ).map(([key, title, body]) => (
                  <Row key={key} title={title} body={body}>
                    <input
                      aria-label={title}
                      type="checkbox"
                      role="switch"
                      checked={visibility[key]}
                      disabled={busy}
                      onChange={(e) => {
                        const next = { ...visibility, [key]: e.target.checked };
                        void run(
                          async () =>
                            setVisibility(
                              await api<Visibility>("/sites/" + site + "/visibility", "PUT", next),
                            ),
                          tr("Saved.", "Salvo."),
                        );
                      }}
                    />
                  </Row>
                ))}
            </section>
          )}
          {section === "profile" && (
            <div>
              <h2 className="font-display text-[16px] font-semibold tracking-tight">{tr("Public profile", "Perfil público")}</h2>
              <p className="mt-1 text-[11.5px] text-ink/45">{tr("How you appear in your studio.", "Como você aparece no ateliê.")}</p>
              <div className="mt-5 flex items-center gap-4">
                {avatar ? (
                  <img src={"/api/media/" + site + "/" + avatar + "/thumb"} alt="" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-coral text-[18px] font-semibold text-white">{initials}</span>
                )}
                <label className="block">
                  <span className={small}>{t(l, "avatar")}</span>
                  <select value={avatar} onChange={(e) => setAvatar(e.target.value)} className={cn(inputCls, "w-[220px]")}>
                    <option value="">{t(l, "none")}</option>
                    {d.artworks.map((a) => (
                      <option key={a.id} value={a.assetId}>
                        {a.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className={small}>{t(l, "name")}</span>
                  <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className={inputCls} />
                </label>
                <div>
                  <span className={small}>{t(l, "username")}</span>
                  <p className={cn(inputCls, "truncate font-mono text-ink/50")}>{handle}</p>
                </div>
                <label className="block sm:col-span-2">
                  <span className={small}>{tr("Portfolio bio", "Biografia do portfólio")}</span>
                  <textarea rows={3} maxLength={320} value={d.description} onChange={e => update(x => { x.description = e.target.value; })}
                    className={inputCls} />
                </label>
                <label className="block sm:col-span-2">
                  <span className={small}>{t(l, "social")}</span>
                  <textarea
                    rows={3}
                    value={d.social.join("\n")}
                    maxLength={5000}
                    placeholder="https://instagram.com/…"
                    onChange={(e) => update((x) => void (x.social = e.target.value ? e.target.value.split("\n") : []))}
                    className={cn(inputCls, "resize-y font-mono text-[11.5px] leading-relaxed")}
                  />
                  <span className="mt-1 block text-[10.5px] text-ink/35">{tr("One link per line. Saved with your portfolio draft.", "Um link por linha. Salvo com o rascunho do portfólio.")}</span>
                </label>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await api("/me", "PATCH", { displayName: name, avatar: avatar || null });
                      await refresh();
                    }, tr("Profile saved.", "Perfil salvo."))
                  }
                  className="rounded-full bg-ink px-4 py-2 text-[11.5px] font-medium text-paper disabled:opacity-50"
                >
                  {tr("Save profile", "Salvar perfil")}
                </button>
              </div>
            </div>
          )}

          {section === "account" && (
            <div>
              <h2 className="font-display text-[16px] font-semibold tracking-tight">{tr("Account details", "Dados da conta")}</h2>
              <div className="mt-4">
                <Row title={t(l, "email")} body={tr("Used for sign-in and account messages.", "Usado para entrar e para mensagens da conta.")}>
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[12px] text-ink/60">{user.email}</span>
                    {user.verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-mint/50 px-2.5 py-1 text-[10px] font-medium">
                        <Check className="h-3 w-3" /> {tr("Confirmed", "Confirmado")}
                      </span>
                    ) : (
                      <span className="rounded-full bg-butter/60 px-2.5 py-1 text-[10px] font-medium">{tr("Not confirmed", "Não confirmado")}</span>
                    )}
                  </span>
                </Row>
                {!user.verified && (
                  <Row title={t(l, "verify")} body={t(l, "unverified")}>
                    <button type="button" disabled={busy} onClick={() => run(() => api("/auth/resend", "POST").then(() => undefined), t(l, "sent"))} className={pill}>
                      {t(l, "resend")}
                    </button>
                  </Row>
                )}
                <Row title={t(l, "password").split(" (")[0]} body={tr("Reset it by email. Resetting signs out every session.", "Redefina por e-mail. Isso encerra todas as sessões.")}>
                  <a href="/auth/forgot" className={pill}>
                    {tr("Change", "Alterar")}
                  </a>
                </Row>
                <Row title={t(l, "publicAddress")} body={tr("Your address is fixed once chosen.", "O endereço fica fixo depois de escolhido.")}>
                  <span className="font-mono text-[12px] text-ink/60">{address}</span>
                </Row>
              </div>
            </div>
          )}

          {section === "language" && (
            <div>
              <h2 className="font-display text-[16px] font-semibold tracking-tight">{tr("Language", "Idioma")}</h2>
              <div className="mt-4">
                <Row title={tr("Studio language", "Idioma do ateliê")} body={tr("Your portfolio keeps its own language.", "Seu portfólio tem o próprio idioma.")}>
                  <select
                    value={l}
                    onChange={(e) => {
                      document.cookie = "doodallery_lang=" + e.target.value + "; Path=/; SameSite=Lax; Max-Age=31536000";
                      location.reload();
                    }}
                    className={cn(inputCls, "w-[170px]")}
                  >
                    <option value="pt-BR">Português (BR)</option>
                    <option value="en">English</option>
                  </select>
                </Row>
                <Row title={t(l, "publicLang")} body={tr("Labels such as navigation and captions on your public site.", "Rótulos como navegação e legendas no site público.")}>
                  <select value={d.language} onChange={(e) => update((x) => void (x.language = e.target.value as Draft["language"]))} className={cn(inputCls, "w-[170px]")}>
                    <option value="pt-BR">Português (BR)</option>
                    <option value="en">English</option>
                  </select>
                </Row>
              </div>
            </div>
          )}

          {section === "data" && (
            <div>
              <h2 className="font-display text-[16px] font-semibold tracking-tight">{tr("Your data", "Seus dados")}</h2>
              <div className="mt-4">
                <Row
                  title={tr("Download your data", "Baixar seus dados")}
                  body={tr("Account details, portfolio content, billing history and consents as a JSON file.", "Dados da conta, conteúdo do portfólio, histórico de cobrança e aceites em um arquivo JSON.")}
                >
                  <a href="/api/me/export" download className={pill + " inline-flex items-center gap-1.5"}>
                    <Download className="h-3.5 w-3.5" /> {tr("Export", "Exportar")}
                  </a>
                </Row>
                <Row title={tr("Your artwork is yours", "Suas obras são suas")} body={tr("We never claim ownership of what you upload.", "Nunca reivindicamos a propriedade do que você envia.")}>
                  <a href="/legal/content" target="_blank" className={pill}>
                    {tr("Read policy", "Ler política")}
                  </a>
                </Row>
                <Row title={tr("Privacy policy", "Política de privacidade")} body={tr("How analytics, billing and storage handle personal data.", "Como estatísticas, cobrança e armazenamento tratam dados pessoais.")}>
                  <a href="/legal/privacy" target="_blank" className={pill}>
                    {tr("Read", "Ler")}
                  </a>
                </Row>
              </div>
            </div>
          )}

          {section === "support" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
                const form = e.currentTarget;
                void run(async () => {
                  await api("/support", "POST", { topic: f.topic, message: f.message });
                  form.reset();
                }, tr("Sent. We'll reply to " + user.email + ".", "Enviado. Responderemos para " + user.email + "."));
              }}
            >
              <h2 className="font-display text-[16px] font-semibold tracking-tight">{tr("Help & support", "Ajuda e suporte")}</h2>
              <p className="mt-1 text-[11.5px] text-ink/45">{tr("Real people read every message.", "Pessoas de verdade leem cada mensagem.")}</p>
              <label className="mt-4 block max-w-[260px]">
                <span className={small}>{tr("Topic", "Assunto")}</span>
                <select name="topic" className={inputCls}>
                  <option value="billing">{tr("Billing", "Cobrança")}</option>
                  <option value="domain">{tr("Custom domain", "Domínio próprio")}</option>
                  <option value="account">{tr("Account", "Conta")}</option>
                  <option value="bug">{tr("Something isn't working", "Algo não funciona")}</option>
                  <option value="other">{tr("Other", "Outro")}</option>
                </select>
              </label>
              <label className="mt-3 block">
                <span className={small}>{tr("Message", "Mensagem")}</span>
                <textarea name="message" required minLength={10} maxLength={5000} rows={5} className={cn(inputCls, "resize-y leading-relaxed")} />
              </label>
              <button disabled={busy} className="mt-3 rounded-full bg-ink px-4 py-2 text-[11.5px] font-medium text-paper disabled:opacity-50">
                {tr("Send", "Enviar")}
              </button>
            </form>
          )}

          {section === "danger" && (
            <div>
              <h2 className="font-display text-[16px] font-semibold tracking-tight">{tr("Account management", "Gerenciar conta")}</h2>
              <div className="mt-4 rounded-xl border border-ink/12 bg-paper p-4">
                <p className="text-[12.5px] font-medium">{tr("Take a break", "Dar um tempo")}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink/45">
                  {tr("Unpublish your portfolio and keep everything saved. You can come back whenever.", "Despublique o portfólio e mantenha tudo salvo. Volte quando quiser.")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy || !published}
                    onClick={() => {
                      if (confirm(t(l, "unpublish") + "?")) void run(onUnpublish, tr("Portfolio unpublished.", "Portfólio despublicado."));
                    }}
                    className={pill}
                  >
                    {t(l, "unpublish")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        await api("/auth/logout", "POST");
                        location.assign("/");
                      })
                    }
                    className={pill}
                  >
                    {t(l, "logout")}
                  </button>
                </div>
              </div>
              <form
                className="mt-3 rounded-xl border border-coral/40 bg-coral/10 p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (confirm(t(l, "deleteAsk")))
                    void run(async () => {
                      await api("/me", "DELETE", { password: secret });
                      location.assign("/");
                    });
                }}
              >
                <p className="text-[12.5px] font-medium">{t(l, "deleteAccount")}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink/50">
                  {tr("Permanently removes your portfolio, artworks and galleries. This can't be undone.", "Remove de vez seu portfólio, obras e galerias. Não dá para desfazer.")}
                </p>
                <label className="mt-3 block max-w-[280px]">
                  <span className={small}>{t(l, "password").split(" (")[0]}</span>
                  <input type="password" autoComplete="current-password" required value={secret} onChange={(e) => setSecret(e.target.value)} className={inputCls} />
                </label>
                <button type="submit" disabled={busy} className="mt-3 rounded-full bg-ink px-3.5 py-1.5 text-[11px] font-medium text-paper disabled:opacity-50">
                  {tr("Delete account", "Excluir conta")}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
