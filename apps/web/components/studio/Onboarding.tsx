"use client";
import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Plus, Rocket, Sparkles } from "lucide-react";
import { removeGallery, templateNames, type Draft } from "@studio/shared";
import { t, message, type Lang } from "../../lib/copy";
import type { Artist, Limits, SiteData, Update } from "../../lib/use-draft";
import { templatePreview } from "../../lib/demo";
import { templateAccent } from "../templates/kit";
import { designs, fonts } from "../Portfolio";
import { Eyebrow, Sparkle } from "../home/bits";
import { Language } from "../Language";
import { cn } from "../home/types";
import { buttonClasses, Field, inputClasses } from "../auth/Field";
import { Library } from "./Library";
import { ScaledPortfolio } from "./ScaledPortfolio";

/* Port of Design/src/components/onboarding/OnboardingWizard.jsx and
   OnboardingPreview.jsx. Step one creates the site (name and address); the
   remaining steps edit the saved draft, so progress survives between visits. */

const ORDINAL = [
  ["Step one", "Etapa um"],
  ["Step two", "Etapa dois"],
  ["Step three", "Etapa três"],
  ["Step four", "Etapa quatro"],
  ["Step five", "Etapa cinco"],
  ["Step six", "Etapa seis"],
];
const MOODS: Record<Draft["theme"]["template"], [string, string]> = {
  gallery: ["Minimal · editorial", "Minimal · editorial"],
  creative: ["Playful · expressive", "Lúdico · expressivo"],
  showcase: ["Dramatic · premium", "Dramático · premium"],
  story: ["Dreamy · intimate", "Sonhador · intimista"],
};
const CATEGORIES: [string, string][] = [
  ["Fanart", "Fanart"],
  ["Original Art", "Arte original"],
  ["Character Designs", "Personagens"],
  ["Sketchbook", "Caderno de esboços"],
  ["Comics", "Quadrinhos"],
  ["Photography", "Fotografia"],
  ["3D", "3D"],
  ["Crafts", "Artesanato"],
];
const ACCENTS = ["#ff7868", "#b6a0f6", "#a6e5cb", "#ffe5a0"];
const h1 = "mt-3 font-display text-[28px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[34px]";
const lead = "mt-2 max-w-[440px] text-[14px] leading-relaxed text-ink/55";
const slugify = (name: string, id: string) =>
  (name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 35) || "gallery") +
  "-" +
  id.slice(0, 5);

function Frame({
  l,
  brand,
  step,
  onExit,
  preview,
  children,
}: {
  l: Lang;
  brand: string;
  step: number;
  onExit?: () => void;
  preview: ReactNode;
  children: ReactNode;
}) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  return (
    <div className="ui ui-page">
      <header className="border-b border-ink/10">
        <div className="mx-auto flex h-[68px] max-w-[1120px] items-center justify-between gap-3 px-5">
          <a href="/" className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-ink text-paper">
              <Sparkle size={13} />
            </span>
            <span className="hidden font-display text-[17px] font-semibold tracking-tight sm:inline">{brand}</span>
          </a>
          <span className="text-[11px] uppercase tracking-[0.18em] text-ink/40">
            {tr("Studio setup", "Configuração")} · {step} / 6
          </span>
          <span className="flex items-center gap-3">
            <Language lang={l} className="grid h-8 w-8 place-items-center rounded-full border border-ink/12 text-[10px] font-semibold text-ink/55 hover:text-ink" />
            {onExit && (
              <button type="button" onClick={onExit} className="text-[12.5px] text-ink/50 hover:text-ink">
                {tr("Save & exit", "Salvar e sair")}
              </button>
            )}
          </span>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1120px] gap-10 px-5 py-10 lg:grid-cols-[1fr_320px] lg:py-14">
        <div className="min-w-0">
          <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={6} aria-valuenow={step}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <span key={i} className={cn("h-1 flex-1 rounded-full transition-colors duration-500", i <= step ? "bg-coral" : "bg-ink/12")} />
            ))}
          </div>
          <div className="u-paper mt-6 rounded-[1.6rem] p-6 sm:p-8">{children}</div>
        </div>
        <aside className="lg:sticky lg:top-10 lg:self-start">
          <p className="mb-3 flex items-center gap-2 text-[10.5px] uppercase tracking-[0.18em] text-ink/40">
            <Sparkle size={10} className="text-coral" /> {tr("Live preview", "Prévia ao vivo")}
          </p>
          {preview}
          <p className="mt-4 text-[12px] leading-relaxed text-ink/40">
            {tr(
              "This is a real preview of your template. Colours, type and layout update as you choose.",
              "Esta é uma prévia real do seu modelo. Cores, tipografia e layout mudam conforme você escolhe.",
            )}
          </p>
        </aside>
      </div>
    </div>
  );
}

function Browser({ address, live, children }: { address: string; live?: boolean; children: ReactNode }) {
  return (
    <div className="rounded-[1.3rem] border border-ink/12 bg-ivory p-2.5 shadow-[0_30px_60px_-40px_hsl(var(--ink)/0.6)]">
      <div className="flex items-center gap-1.5 px-1 pb-2">
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-ink/20" />
          ))}
        </span>
        <span className="ml-1 truncate font-mono text-[9px] text-ink/35">{address}</span>
        {live && <span className="ml-auto rounded-full bg-mint px-1.5 py-[1px] text-[8px] font-semibold uppercase tracking-wider">live</span>}
      </div>
      {children}
    </div>
  );
}

/** Step one: the site's name and permanent address. */
export function CreateSite({
  template = "gallery",
  l,
  brand,
  domain,
  user,
  error,
  saving,
  onCreate,
}: {
  l: Lang;
  brand: string;
  domain: string;
  user: Artist | null;
  error: string;
  saving: boolean;
  template?: Draft["theme"]["template"];
  onCreate: (e: FormEvent<HTMLFormElement>) => void;
}) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const [title, setTitle] = useState(""),
    [handle, setHandle] = useState("");
  const suffix = domain === "localhost" ? "/site/" : "." + domain;
  const address = domain === "localhost" ? "localhost/site/" + (handle || tr("yourname", "seunome")) : (handle || tr("yourname", "seunome")) + suffix;
  const first = (title || user?.displayName || "").split(" ")[0];
  return (
    <Frame
      l={l}
      brand={brand}
      step={1}
      preview={
        <Browser address={address}>
          <div className="rounded-[1rem] bg-[#FFFDF8] p-4 text-[#1F1E1C]">
            <div className="flex items-center justify-between">
              <span className="font-editorial text-[13px] uppercase tracking-[0.18em]">{title || tr("Your studio", "Seu ateliê")}</span>
              <span className="text-[6.5px] uppercase tracking-[0.18em] opacity-50">{tr("work · about", "obras · sobre")}</span>
            </div>
            <div className="mt-3 overflow-hidden rounded-lg">
              <img src={templatePreview[template]} alt="" className="h-[132px] w-full object-cover" />
            </div>
            <p className="mt-3 font-editorial text-[18px] leading-tight">
              {first || tr("Your", "Seu")} <span className="italic opacity-80">{tr("portfolio", "portfólio")}</span>
            </p>
            <div className="mt-3 h-[3px] w-10 rounded-full bg-coral" />
          </div>
        </Browser>
      }
    >
      <form onSubmit={onCreate}>
        <Eyebrow>{ORDINAL[0][l === "en" ? 0 : 1]}</Eyebrow>
        <h1 className={h1}>
          {tr("Welcome", "Boas-vindas")}, {first || tr("artist", "artista")} ✦
        </h1>
        <p className={lead}>{t(l, "noSite")}</p>
        {error && (
          <p role="alert" className="mt-5 rounded-xl bg-coral/15 px-3 py-2.5 text-[12.5px] text-[#8a2f25]">
            {message(l, error)}
          </p>
        )}
        <div className="mt-7 space-y-5">
          <Field label={t(l, "title")} hint={tr("This appears on your portfolio and in your page titles.", "Aparece no portfólio e nos títulos das páginas.")}>
            <input name="title" required maxLength={120} value={title} placeholder={user?.displayName} onChange={(e) => setTitle(e.target.value)} className={inputClasses()} />
          </Field>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-ink/45">{t(l, "username")}</span>
            <span className="flex items-center overflow-hidden rounded-xl border border-ink/15 bg-ivory focus-within:border-ink/50 focus-within:ring-4 focus-within:ring-coral/15">
              {domain === "localhost" && <span className="shrink-0 border-r border-ink/12 px-3 font-mono text-[12px] text-ink/45">/site/</span>}
              <input
                name="handle"
                aria-describedby="handle-hint"
                autoComplete="username"
                minLength={3}
                maxLength={50}
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                placeholder="luna-mori"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="h-12 min-w-0 flex-1 bg-transparent px-4 text-[14px] outline-none"
              />
              {domain !== "localhost" && <span className="shrink-0 border-l border-ink/12 px-4 font-mono text-[12.5px] text-ink/45">{suffix}</span>}
            </span>
          </label>
          <span id="handle-hint" className="-mt-3 block text-[11.5px] text-ink/40">
            {tr("Lowercase letters, numbers and single hyphens. This address cannot be changed later.", "Letras minúsculas, números e hífens simples. O endereço não muda depois.")}
          </span>
        </div>
        <div className="mt-8 flex items-center justify-between border-t border-ink/10 pt-5">
          <span className="text-[12px] text-ink/40">{tr("Nothing goes live yet.", "Nada vai ao ar ainda.")}</span>
          <button className={buttonClasses("ink", "md")} disabled={saving}>
            {t(l, "continue")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </form>
    </Frame>
  );
}

/** Steps two to six over the saved draft. */
export function Setup({
  d,
  update,
  l,
  brand,
  data,
  user,
  limits,
  address,
  publicHref,
  progress,
  onFiles,
  onSave,
  onPublish,
  onResend,
  onExit,
}: {
  d: Draft;
  update: Update;
  l: Lang;
  brand: string;
  data: SiteData;
  user: Artist;
  limits: Limits;
  address: string;
  publicHref: string;
  progress: number | null;
  onFiles: (files: File[], replace?: string) => void;
  onSave: () => void;
  onPublish: () => Promise<void>;
  onResend: () => Promise<void>;
  onExit: () => void;
}) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const [custom, setCustom] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [sent, setSent] = useState(false);
  const step = Math.min(6, Math.max(2, d.step));
  const go = (n: number) => update((x) => void (x.step = n));
  const T = designs[d.theme.template];
  const addGallery = (title: string) => {
    const id = crypto.randomUUID();
    update((x) => x.galleries.push({ id, title, slug: slugify(title, id), visible: true, description: "", artIds: [], cover: null }));
  };
  const publish = async () => {
    setBusy(true);
    setError("");
    try {
      await onPublish();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const swatches = [...new Set([templateAccent[d.theme.template], ...ACCENTS])];
  return (
    <Frame
      l={l}
      brand={brand}
      step={step}
      onExit={onExit}
      preview={
        <Browser address={address} live={Boolean(data.published)}>
          <ScaledPortfolio draft={d} site={data.id} brand={brand} width={390} className="max-h-[440px] overflow-hidden rounded-[1rem]" />
        </Browser>
      }
    >
      <Eyebrow>{ORDINAL[step - 1][l === "en" ? 0 : 1]}</Eyebrow>
      {step === 2 && (
        <div>
          <h1 className={h1}>{tr("Pick a starting point", "Escolha um ponto de partida")}</h1>
          <p className={lead}>{tr("You can swap this any time — your work stays exactly where it is.", "Dá para trocar quando quiser — suas obras ficam onde estão.")}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {templateNames.map((v) => (
              <button
                key={v}
                type="button"
                aria-label={v}
                aria-pressed={d.theme.template === v}
                onClick={() =>
                  update((x) => {
                    x.theme.template = v;
                    x.theme.accent = templateAccent[v];
                  })
                }
                className={cn(
                  "overflow-hidden rounded-xl border p-1.5 text-left transition-all duration-300",
                  d.theme.template === v ? "border-ink bg-lilac/15 ring-2 ring-ink" : "border-ink/12 bg-paper hover:border-ink/35",
                )}
              >
                <div className="overflow-hidden rounded-lg">
                  <img src={templatePreview[v]} alt="" className="h-[92px] w-full object-cover" />
                </div>
                <div className="flex items-center justify-between px-1.5 py-2">
                  <span className="text-[13px] font-medium capitalize">{v}</span>
                  <span className="text-[9.5px] uppercase tracking-wider text-ink/40">{MOODS[v][l === "en" ? 0 : 1]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h1 className={h1}>{tr("How should we sort your work?", "Como vamos organizar suas obras?")}</h1>
          <p className={lead}>{tr("Pick a few galleries to start. Rename them, add more, or delete them whenever you like.", "Escolha algumas galerias para começar. Renomeie, crie mais ou apague quando quiser.")}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const name = c[l === "en" ? 0 : 1];
              const g = d.galleries.find((v) => v.title === name);
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={Boolean(g)}
                  disabled={Boolean(g?.artIds.length)}
                  onClick={() => (g ? update((x) => removeGallery(x, g.id)) : addGallery(name))}
                  className={cn(
                    "rounded-full border px-4 py-2.5 text-[13px] transition-all duration-300",
                    g ? "border-ink bg-ink text-paper" : "border-ink/20 text-ink/60 hover:border-ink/50 hover:text-ink",
                  )}
                >
                  {g && <Check className="mr-1.5 inline h-3 w-3" />}
                  {name}
                </button>
              );
            })}
            {d.galleries
              .filter((g) => !CATEGORIES.some((c) => c.includes(g.title)))
              .map((g) => (
                <span key={g.id} className="inline-flex items-center rounded-full border border-ink bg-ink px-4 py-2.5 text-[13px] text-paper">
                  <Check className="mr-1.5 h-3 w-3" />
                  {g.title}
                </span>
              ))}
          </div>
          <form
            className="mt-5 flex max-w-[420px] gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (custom.trim()) addGallery(custom.trim());
              setCustom("");
            }}
          >
            <label className="flex-1">
              <span className="sr-only">{t(l, "custom")}</span>
              <input
                aria-label={t(l, "custom")}
                value={custom}
                maxLength={120}
                onChange={(e) => setCustom(e.target.value)}
                placeholder={tr("Or name your own…", "Ou dê seu próprio nome…")}
                className={inputClasses("h-11")}
              />
            </label>
            <button disabled={!custom.trim()} className={buttonClasses("paper", "md")}>
              <Plus className="h-4 w-4" /> {t(l, "add")}
            </button>
          </form>
          <p className="mt-5 text-[12px] text-ink/40">
            {d.galleries.length} {tr("selected · you can add galleries later from the studio.", "selecionadas · dá para criar mais depois no ateliê.")}
          </p>
        </div>
      )}

      {step === 4 && (
        <div>
          <h1 className={h1}>{tr("Add a first piece", "Adicione uma primeira obra")}</h1>
          <p className={lead}>{tr("It doesn't have to be your best work — just something to fill the walls.", "Não precisa ser sua melhor obra — só algo para preencher as paredes.")}</p>
          <div className="mt-6">
            <Library d={d} update={update} l={l} site={data.id} limits={limits} storageUsed={data.storageUsed} progress={progress} onFiles={onFiles} onSave={onSave} embedded />
          </div>
          <p className="mt-4 text-[12px] text-ink/40">{t(l, "skipUpload")}</p>
        </div>
      )}

      {step === 5 && (
        <div>
          <h1 className={h1}>{tr("A few last touches", "Últimos retoques")}</h1>
          <p className={lead}>{tr("Choose an accent colour. You can fine-tune everything in the theme editor later.", "Escolha uma cor de destaque. Dá para ajustar tudo depois no tema.")}</p>
          <p className="mt-7 text-[10px] uppercase tracking-[0.2em] text-ink/40">{t(l, "accent")}</p>
          <div className="mt-2.5 flex flex-wrap gap-2.5" role="radiogroup" aria-label={t(l, "accent")}>
            {swatches.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={d.theme.accent.toLowerCase() === c}
                aria-label={c}
                onClick={() => update((x) => void (x.theme.accent = c))}
                className={cn("h-10 w-10 rounded-full border-2 transition-transform hover:scale-105", d.theme.accent.toLowerCase() === c ? "border-ink" : "border-transparent")}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <p className="mt-6 text-[10px] uppercase tracking-[0.2em] text-ink/40">{tr("Type pairing", "Tipografia")}</p>
          <div className="mt-2.5 space-y-2" role="radiogroup" aria-label={t(l, "font")}>
            {(["template", "serif", "sans", "mono"] as const).map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={d.theme.font === f}
                onClick={() => update((x) => void (x.theme.font = f))}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left",
                  d.theme.font === f ? "border-ink/45 bg-paper" : "border-ink/12 bg-paper/50 hover:border-ink/30",
                )}
              >
                <span className="text-[15px]" style={{ fontFamily: f === "template" ? T.display : fonts[f] }}>
                  {f === "template" ? t(l, "template") : t(l, f)}
                </span>
                {d.theme.font === f && <Check className="h-4 w-4 text-coral" />}
              </button>
            ))}
          </div>
          <Field label={t(l, "description")} className="mt-6" hint={tr("A sentence or two for search engines and link previews.", "Uma ou duas frases para buscadores e prévias de links.")}>
            <textarea
              value={d.description}
              maxLength={320}
              rows={3}
              onChange={(e) => update((x) => void (x.description = e.target.value))}
              className={inputClasses("h-auto py-3 leading-relaxed")}
            />
          </Field>
        </div>
      )}

      {step === 6 && (
        <div className="text-center">
          <span className="mx-auto mt-2 grid h-14 w-14 place-items-center rounded-full bg-butter">
            <Sparkles className="h-6 w-6 text-ink/70" />
          </span>
          <h1 className="mt-5 font-display text-[30px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[36px]">
            {tr("Your little universe", "Seu pequeno universo")}
            <br />
            {tr("is", "está")} <span className="font-serif italic text-coral">{tr("ready.", "pronto.")}</span>
          </h1>
          <p className="mx-auto mt-3 max-w-[380px] text-[14px] leading-relaxed text-ink/55">{t(l, "start")}</p>
          <dl className="mx-auto mt-7 max-w-[380px] divide-y divide-ink/10 rounded-xl border border-ink/12 bg-paper/60 text-left">
            {[
              [tr("Artist", "Artista"), d.title],
              [tr("Address", "Endereço"), address],
              [t(l, "template_"), d.theme.template[0].toUpperCase() + d.theme.template.slice(1)],
              [t(l, "galleries"), String(d.galleries.length)],
              [t(l, "library"), String(d.artworks.length)],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 px-4 py-2.5">
                <dt className="text-[11px] uppercase tracking-[0.14em] text-ink/40">{k}</dt>
                <dd className="truncate text-[13px] font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          {error && (
            <p role="alert" className="mx-auto mt-5 max-w-[380px] rounded-xl bg-coral/15 px-3 py-2.5 text-[12.5px] text-[#8a2f25]">
              {message(l, error)}
            </p>
          )}
          {!user.verified && (
            <p className="mx-auto mt-5 max-w-[380px] text-[12.5px] text-ink/55">
              {t(l, "unverified")}{" "}
              <button
                type="button"
                disabled={sent}
                onClick={() => onResend().then(() => setSent(true), () => setSent(false))}
                className="font-medium underline decoration-coral decoration-2 underline-offset-4 disabled:no-underline"
              >
                {sent ? t(l, "sent") : t(l, "resend")}
              </button>
            </p>
          )}
          <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <button type="button" onClick={publish} disabled={busy} className={buttonClasses("primary", "lg", "w-full sm:w-auto")}>
              <Rocket className="h-4 w-4" /> {busy ? t(l, "publishing") : t(l, "publish")}
            </button>
            {data.published && (
              <a href={publicHref} target="_blank" rel="noreferrer" className={buttonClasses("paper", "lg", "w-full sm:w-auto")}>
                {t(l, "visit")} <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          <p className="mt-3 text-[11.5px] text-ink/40">{tr("You can publish whenever you're ready — nothing goes live until you do.", "Publique quando estiver pronto — nada vai ao ar antes disso.")}</p>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-ink/10 pt-5">
        <button
          type="button"
          onClick={() => go(step - 1)}
          disabled={step === 2}
          className="inline-flex items-center gap-1.5 text-[13px] text-ink/50 transition-colors hover:text-ink disabled:opacity-30"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {t(l, "back")}
        </button>
        {step < 6 ? (
          <button type="button" onClick={() => go(step + 1)} className={buttonClasses("ink", "md")}>
            {t(l, "continue")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              go(7);
              onExit();
            }}
            className={buttonClasses("ink", "md")}
          >
            {tr("Enter my studio", "Entrar no ateliê")} <Sparkles className="h-4 w-4" />
          </button>
        )}
      </div>
    </Frame>
  );
}
