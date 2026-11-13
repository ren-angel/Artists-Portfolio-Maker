"use client";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  ExternalLink,
  FileText,
  HardDrive,
  Images,
  Layers,
  PenLine,
  Sparkles,
} from "lucide-react";
import type { Draft } from "@studio/shared";
import { t, type Lang } from "../../lib/copy";
import type { Artist, Limits, SiteData } from "../../lib/use-draft";
import { Sparkle, Sticker } from "../home/bits";
import { cn } from "../home/types";
import { card, EmptyStudio, inkPill, PageHeader } from "./parts";
import { ScaledPortfolio } from "./ScaledPortfolio";
import type { Tab } from "./DashLayout";

/* Port of Design/src/routes/dashboard.index.jsx with PortfolioPreviewCard,
   StatRow and StudioChecklist driven by the real draft. Visitor analytics and
   the activity log are not collected, so a live preview and recent artwork
   take their places instead of placeholder numbers. */

type Props = {
  d: Draft;
  l: Lang;
  data: SiteData;
  user: Artist;
  limits: Limits;
  brand: string;
  address: string;
  publicHref: string;
  setTab: (t: Tab) => void;
  onResume?: () => void;
};

export function Overview({ d, l, data, user, limits, brand, address, publicHref, setTab, onResume }: Props) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const thumb = (assetId: string) => "/api/media/" + data.id + "/" + assetId + "/thumb";
  const cover = d.artworks.find((a) => a.featured) ?? d.artworks[0];
  const published = Boolean(data.published);
  const template = d.theme.template[0].toUpperCase() + d.theme.template.slice(1);
  const first = user.displayName.split(/\s+/)[0];
  const hidden = d.galleries.filter((g) => !g.visible).length;
  const hasAbout = d.pages.some((p) => p.blocks.some((b) => b.type === "about" && b.visible && b.text.trim()));
  const tasks = [
    { done: d.artworks.length > 0, label: tr("Add your first artworks", "Adicione suas primeiras obras"), tab: "library" as Tab },
    { done: d.galleries.length > 0, label: tr("Create a gallery", "Crie uma galeria"), tab: "galleries" as Tab },
    { done: hasAbout, label: tr("Write your about section", "Escreva sua seção sobre"), tab: "editor" as Tab },
    { done: user.verified, label: tr("Confirm your email", "Confirme seu e-mail"), tab: "settings" as Tab },
    { done: published, label: tr("Publish your portfolio", "Publique seu portfólio"), tab: "editor" as Tab },
  ];
  const progress = Math.round((tasks.filter((x) => x.done).length / tasks.length) * 100);
  const idea = !d.artworks.length
    ? {
        text: tr("“An empty wall is a lovely place to start. Upload a few pieces you are proud of — you can arrange them later.”", "“Uma parede vazia é um ótimo começo. Envie algumas peças de que você se orgulha — dá para organizar depois.”"),
        cta: tr("Open the artwork library", "Abrir a biblioteca de obras"),
        tab: "library" as Tab,
      }
    : !d.artworks.some((a) => a.featured)
      ? {
          text: tr("“Pick a few favourites. Featured works fill the highlight sections of every template.”", "“Escolha algumas favoritas. Obras em destaque preenchem as seções principais de todos os modelos.”"),
          cta: tr("Choose featured works", "Escolher obras em destaque"),
          tab: "library" as Tab,
        }
      : !d.galleries.length
        ? {
            text: tr("“Group your work into galleries — visitors love wandering through a series.”", "“Agrupe suas obras em galerias — visitantes adoram percorrer uma série.”"),
            cta: tr("Create a gallery", "Criar uma galeria"),
            tab: "galleries" as Tab,
          }
        : {
            text: tr("“Try your work in another template. Your pages, galleries and artworks stay exactly where they are.”", "“Experimente suas obras em outro modelo. Páginas, galerias e obras continuam onde estão.”"),
            cta: tr("Explore the appearance", "Explorar a aparência"),
            tab: "theme" as Tab,
          };
  const stats = [
    { label: t(l, "library"), value: d.artworks.length, note: tr(`of ${limits.artworks} included`, `de ${limits.artworks} incluídas`), icon: Images, tab: "library" as Tab, tone: "bg-coral/15" },
    { label: t(l, "galleries"), value: d.galleries.length, note: hidden ? tr(`${hidden} hidden`, `${hidden} ocultas`) : tr("all visible", "todas visíveis"), icon: Layers, tab: "galleries" as Tab, tone: "bg-lilac/20" },
    { label: t(l, "pages"), value: d.pages.length, note: tr(`${d.pages.filter((p) => p.inNav).length} in navigation`, `${d.pages.filter((p) => p.inNav).length} na navegação`), icon: FileText, tab: "pages" as Tab, tone: "bg-mint/25" },
    {
      label: tr("Storage", "Armazenamento"),
      value: data.storageUsed !== undefined ? (data.storageUsed / 1024 ** 2).toFixed(1) + " MB" : "—",
      note: tr(`of ${Math.round(limits.storage / 1024 ** 2)} MB`, `de ${Math.round(limits.storage / 1024 ** 2)} MB`),
      icon: HardDrive,
      tab: "library" as Tab,
      tone: "bg-butter/40",
    },
  ];
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={new Date().toLocaleDateString(l, { weekday: "long", day: "numeric", month: "long" })}
        title={
          <>
            {tr("Welcome back", "Que bom te ver")}, {first} <span className="text-coral">✦</span>
          </>
        }
        subtitle={
          published
            ? tr("Your little corner of the internet is live. Edits stay private until you publish again.", "Seu cantinho na internet está no ar. As edições ficam privadas até você publicar de novo.")
            : tr("Your portfolio is still a private draft. Shape it in the editor and publish when it feels right.", "Seu portfólio ainda é um rascunho privado. Ajuste no editor e publique quando estiver pronto.")
        }
        actions={
          <button type="button" onClick={() => setTab("editor")} className={inkPill}>
            {tr("Open editor", "Abrir editor")} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="relative overflow-hidden rounded-[1.4rem] border border-ink/10 bg-ink">
          {cover && (
            <div className="absolute inset-0">
              <img src={thumb(cover.assetId)} alt="" className="h-full w-full object-cover opacity-45" />
              <div className="absolute inset-0 bg-gradient-to-tr from-ink via-ink/70 to-transparent" />
            </div>
          )}
          <div className="relative p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-ink", published ? "bg-mint/90" : "bg-butter/90")}>
                  <span className="h-1.5 w-1.5 rounded-full bg-ink/50" /> {t(l, published ? "live" : "draft")}
                </span>
                <h2 className="mt-3 truncate font-display text-[24px] font-semibold leading-none tracking-tight text-paper">{address}</h2>
                <p className="mt-2 text-[12.5px] text-paper/55">
                  {data.publishedAt
                    ? t(l, "publishedAt") + " " + new Date(data.publishedAt).toLocaleDateString(l, { day: "numeric", month: "short" })
                    : tr("Not published yet", "Ainda não publicado")}{" "}
                  · {template} {tr("template", "modelo")}
                </p>
              </div>
              <Sticker tone="butter" className="hidden shrink-0 sm:inline-flex [transform:rotate(3deg)]">
                {tr("your universe ✦", "seu universo ✦")}
              </Sticker>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTab("editor")}
                className="inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2.5 text-[12.5px] font-medium text-ink transition-transform hover:-translate-y-0.5"
              >
                <PenLine className="h-3.5 w-3.5" /> {tr("Edit portfolio", "Editar portfólio")}
              </button>
              <a
                href={published ? publicHref : "/preview"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-paper/30 px-4 py-2.5 text-[12.5px] font-medium text-paper transition-colors hover:bg-paper/10"
              >
                <ExternalLink className="h-3.5 w-3.5" /> {published ? tr("View published site", "Ver site publicado") : tr("Preview draft", "Ver rascunho")}
              </a>
            </div>
            <div className="mt-6 flex items-center gap-2 text-[10.5px] uppercase tracking-[0.16em] text-paper/35">
              <Sparkle size={10} className="text-coral" /> {d.artworks.length} {t(l, "works")} · {d.galleries.length} {t(l, "galleries").toLowerCase()} ·{" "}
              {d.pages.length} {t(l, "pages").toLowerCase()}
            </div>
          </div>
        </div>
        <div className={cn(card, "p-5")}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-coral" />
            <h3 className="font-display text-[15px] font-semibold tracking-tight">{tr("A little idea", "Uma pequena ideia")}</h3>
          </div>
          <p className="mt-3 font-serif text-[19px] italic leading-snug text-ink/75">{idea.text}</p>
          <div className="mt-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-ink/35">
            <Sparkle size={9} /> {tr("Based on your draft", "Com base no seu rascunho")}
          </div>
          <button
            type="button"
            onClick={() => setTab(idea.tab)}
            className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-ink underline decoration-coral decoration-2 underline-offset-4"
          >
            {idea.cta}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setTab(s.tab)}
            className="group rounded-xl border border-ink/10 bg-ivory p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/25"
          >
            <div className="flex items-center justify-between">
              <span className={cn("grid h-8 w-8 place-items-center rounded-lg", s.tone)}>
                <s.icon className="h-3.5 w-3.5 text-ink/65" />
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-ink/20 transition-colors group-hover:text-ink/50" />
            </div>
            <p className="mt-3 font-display text-[24px] font-semibold leading-none tracking-tight">{s.value}</p>
            <p className="mt-1.5 text-[11px] uppercase tracking-[0.12em] text-ink/40">{s.label}</p>
            <p className="mt-1 text-[11px] text-ink/45">{s.note}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className={cn(card, "p-5")}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-[15px] font-semibold tracking-tight">{tr("Your portfolio, right now", "Seu portfólio, agora")}</h3>
                <p className="mt-0.5 text-[11.5px] text-ink/45">{tr("A live view of the private draft.", "Uma visão ao vivo do rascunho privado.")}</p>
              </div>
              <button type="button" onClick={() => setTab("editor")} className="inline-flex items-center gap-1 text-[11.5px] font-medium text-ink/60 hover:text-ink">
                {t(l, "edit")} <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl bg-[#E7E0D3] p-3 sm:p-4">
              <ScaledPortfolio
                draft={d}
                site={data.id}
                brand={brand}
                className="max-h-[360px] overflow-hidden rounded-lg bg-ivory shadow-[0_30px_70px_-40px_hsl(var(--ink)/0.7)]"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: user.verified ? tr("Your email is confirmed", "Seu e-mail está confirmado") : tr("Confirm your email", "Confirme seu e-mail"),
                body: user.verified
                  ? tr("You can publish whenever you like. Changes go live only when you publish.", "Você pode publicar quando quiser. As mudanças vão ao ar só quando você publica.")
                  : tr("Publishing unlocks once your address is confirmed. Check your inbox for the link.", "A publicação é liberada depois que o endereço é confirmado. Procure o link na sua caixa de entrada."),
                cta: user.verified ? tr("Open editor", "Abrir editor") : t(l, "settingsNav"),
                tab: (user.verified ? "editor" : "settings") as Tab,
                tone: "bg-lilac/20",
              },
              {
                title: tr("Make it yours", "Deixe com a sua cara"),
                body: tr(`You're using the ${template} template. Accent, surfaces, type and navigation can all change without touching your content.`, `Você está usando o modelo ${template}. Destaque, superfícies, tipografia e navegação mudam sem mexer no conteúdo.`),
                cta: tr("Theme & appearance", "Tema e aparência"),
                tab: "theme" as Tab,
                tone: "bg-mint/20",
              },
            ].map((s) => (
              <div key={s.title} className={cn("rounded-[1.2rem] border border-ink/10 p-5", s.tone)}>
                <h4 className="font-display text-[14.5px] font-semibold tracking-tight">{s.title}</h4>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink/60">{s.body}</p>
                <button type="button" onClick={() => setTab(s.tab)} className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium text-ink/70 hover:text-ink">
                  {s.cta} <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.2rem] border border-ink/10 bg-butter/25 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[15px] font-semibold tracking-tight">{tr("Finish your studio", "Complete seu ateliê")}</h3>
              <span className="text-[11px] text-ink/45">{progress}%</span>
            </div>
            <div className="mt-2 h-1 w-full rounded-full bg-ink/10">
              <div className="h-1 rounded-full bg-ink/60 transition-all duration-500" style={{ width: progress + "%" }} />
            </div>
            <ul className="mt-4 space-y-1.5">
              {tasks.map((task) => (
                <li key={task.label}>
                  <button type="button" onClick={() => setTab(task.tab)} className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1.5 text-left hover:bg-ink/[0.03]">
                    <span
                      className={cn(
                        "grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors",
                        task.done ? "border-ink bg-ink text-paper" : "border-ink/25",
                      )}
                      aria-hidden="true"
                    >
                      {task.done && <Check className="h-2.5 w-2.5" />}
                    </span>
                    <span className={cn("flex-1 text-[12.5px]", task.done ? "text-ink/35 line-through" : "text-ink/70")}>
                      {task.label}
                      <span className="sr-only">{task.done ? tr(" (done)", " (feito)") : ""}</span>
                    </span>
                    <ChevronRight className="h-3 w-3 text-ink/25" />
                  </button>
                </li>
              ))}
            </ul>
            {onResume && d.step < 7 && (
              <button type="button" onClick={onResume} className="mt-3 text-[11.5px] font-medium text-ink/60 underline decoration-coral decoration-2 underline-offset-4 hover:text-ink">
                {t(l, "resume")}
              </button>
            )}
          </div>

          <div className={cn(card, "p-5")}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[15px] font-semibold tracking-tight">{tr("From your library", "Da sua biblioteca")}</h3>
              <Images className="h-4 w-4 text-ink/25" />
            </div>
            {d.artworks.length ? (
              <ul className="mt-4 space-y-3">
                {d.artworks
                  .slice(-4)
                  .reverse()
                  .map((a) => (
                    <li key={a.id} className="flex items-center gap-3">
                      <img src={thumb(a.assetId)} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] leading-snug text-ink/75">{a.title}</p>
                        <p className="mt-0.5 text-[10.5px] text-ink/35">
                          {a.featured ? "✦ " + t(l, "featured") : d.galleries.filter((g) => g.artIds.includes(a.id)).map((g) => g.title).join(", ") || tr("Not in a gallery", "Fora de galerias")}
                        </p>
                      </div>
                    </li>
                  ))}
              </ul>
            ) : (
              <EmptyStudio compact tone="butter" className="mt-4" title={t(l, "noArtYet")} body={t(l, "noArt")} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
