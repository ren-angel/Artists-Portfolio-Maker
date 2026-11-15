"use client";
import { useState, type ReactNode } from "react";
import {
  BookOpen, Users, FolderKanban, ShoppingBag,
  ChevronLeft,
  ExternalLink,
  FileText,
  Images,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  Palette,
  PenLine,
  Rocket,
  Receipt,
  LineChart,
  Globe,
  CreditCard,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { t, message, type Key, type Lang } from "../../lib/copy";
import type { Artist, Limits } from "../../lib/use-draft";
import { Language } from "../Language";
import { Sparkle } from "../home/bits";
import { cn } from "../home/types";

/* Navigation follows the reference workspace and uses the signed-in site. */

export type Tab =
  | "overview"
  | "editor"
  | "pages"
  | "galleries"
  | "library"
  | "theme"
  | "commissions"
  | "analytics"
  | "domains"
  | "billing"
  | "settings";
const STUDIO: { id: Tab; icon: typeof LayoutDashboard; key: Key }[] = [
  { id: "overview", icon: LayoutDashboard, key: "overview" },
  { id: "editor", icon: PenLine, key: "editor" },
  { id: "pages", icon: FileText, key: "pages" },
  { id: "galleries", icon: Layers, key: "galleries" },
  { id: "library", icon: Images, key: "library" },
  { id: "theme", icon: Palette, key: "theme" },
  { id: "commissions", icon: Receipt, key: "commissions" },
];
const GROWTH: typeof STUDIO = [
  { id: "analytics", icon: LineChart, key: "analytics" },
  { id: "domains", icon: Globe, key: "domains" },
  { id: "billing", icon: CreditCard, key: "billing" },
];
const ACCOUNT: typeof STUDIO = [{ id: "settings", icon: Settings, key: "settingsNav" }];

type Props = {
  l: Lang;
  brand: string;
  tab: Tab;
  setTab: (t: Tab) => void;
  title: string;
  user: Artist;
  site: string;
  address: string;
  publicHref: string;
  published: boolean;
  status: string;
  saveError: string;
  artworks: number;
  storageUsed?: number;
  limits: Limits;
  planLabel: string;
  onPublish: () => void;
  onLogout: () => void;
  children: ReactNode;
};

const mb = (n: number) => (n / 1024 ** 2).toFixed(n < 10 * 1024 ** 2 ? 1 : 0);

function NavItem({
  item,
  l,
  active,
  collapsed,
  onClick,
}: {
  item: (typeof STUDIO)[number];
  l: Lang;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      title={collapsed ? t(l, item.key) : undefined}
      className={cn(
        "group relative flex w-full items-center gap-2.5 rounded-lg py-2 text-left text-[13px] transition-colors",
        collapsed ? "justify-center px-0" : "px-2.5",
        active ? "bg-ink text-paper" : "text-ink/60 hover:bg-ink/[0.05] hover:text-ink",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-coral" : "text-ink/40 group-hover:text-ink/70")} />
      {!collapsed && <span className="truncate">{t(l, item.key)}</span>}
    </button>
  );
}

function Sidebar(p: Props & { collapsed: boolean; onNavigate?: () => void }) {
  const { l, collapsed, user } = p;
  const go = (id: Tab) => {
    p.setTab(id);
    p.onNavigate?.();
  };
  const avatar = user.avatar ? "/api/media/" + p.site + "/" + user.avatar + "/thumb" : null;
  const initials = user.displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const share = p.storageUsed !== undefined ? Math.min(100, (p.storageUsed / p.limits.storage) * 100) : null;
  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center gap-2.5 px-4 py-4", collapsed && "justify-center px-2")}>
        <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-ink text-paper">
          <Sparkle size={13} />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-coral ring-2 ring-ivory" />
        </span>
        {!collapsed && <span className="truncate font-display text-[17px] font-semibold tracking-tight">{p.brand}</span>}
      </div>

      {!collapsed && (
        <div className="mx-3 mt-1 rounded-xl border border-ink/10 bg-paper/70 p-2.5">
          <div className="flex items-center gap-2">
            {avatar ? (
              <img src={avatar} alt="" className="h-7 w-7 rounded-lg object-cover" />
            ) : (
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-coral text-[10px] font-bold text-white">{initials}</span>
            )}
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate text-[12px] font-medium leading-none">
                {user.displayName}
                <button type="button" onClick={() => go("billing")} className="rounded-full bg-ink/[0.07] px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-wider text-ink/55 hover:bg-ink hover:text-paper">
                  {p.planLabel}
                </button>
              </p>
              <p className="mt-1 truncate font-mono text-[9.5px] text-ink/40">{p.address}</p>
            </div>
          </div>
          <a
            href={p.published ? p.publicHref : "/preview"}
            target="_blank"
            rel="noreferrer"
            className="mt-2.5 flex items-center justify-center gap-1 rounded-lg border border-ink/10 bg-ivory py-1.5 text-[10.5px] text-ink/60 transition-colors hover:border-ink/30 hover:text-ink"
          >
            {p.published ? t(l, "visit") : t(l, "preview")} <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      )}

      <nav className="mt-4 flex-1 overflow-y-auto px-2.5 pb-4" aria-label={t(l, "studio")}>
        {!collapsed && <p className="px-2 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-ink/30">{t(l, "studio")}</p>}
        <div className="space-y-0.5">
          {STUDIO.map((item) => (
            <NavItem key={item.id} item={item} l={l} active={p.tab === item.id} collapsed={collapsed} onClick={() => go(item.id)} />
          ))}
        </div>
        {!collapsed && <p className="mt-5 px-2 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-ink/30">{l === "en" ? "Growth" : "Crescimento"}</p>}
        <div className={cn("space-y-0.5", collapsed && "mt-3")}>
          {GROWTH.map((item) => (
            <NavItem key={item.id} item={item} l={l} active={p.tab === item.id} collapsed={collapsed} onClick={() => go(item.id)} />
          ))}
        </div>
        {!collapsed && <p className="mt-5 px-2 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-ink/30">{t(l, "settings")}</p>}
        <div className={cn("space-y-0.5", collapsed && "mt-3")}>
          {ACCOUNT.map((item) => (
            <NavItem key={item.id} item={item} l={l} active={p.tab === item.id} collapsed={collapsed} onClick={() => go(item.id)} />
          ))}
        </div>
        {!collapsed && (
          <details className="mt-4 px-2 text-ink/55">
            <summary className="cursor-pointer py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em]">
              {l === "en" ? "Coming soon" : "Em breve"}
            </summary>
            <ul className="mt-1 space-y-1.5 text-[12px]">
              {([[BookOpen, "Comics", "Quadrinhos"], [Users, "Characters", "Personagens"],
                [FolderKanban, "Projects", "Projetos"], [ShoppingBag, "Shop", "Loja"]] as const).map(([Icon, en, pt]) =>
                <li key={en} className="flex items-center gap-2 py-1"><Icon aria-hidden className="h-4 w-4" />{l === "en" ? en : pt}</li>)}
            </ul>
          </details>
        )}
      </nav>

      {!collapsed && (
        <div className="mx-3 mb-3 rounded-xl bg-lilac/20 p-3">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-ink/50">
            <span>{l === "en" ? "Storage" : "Armazenamento"}</span>
            {share !== null && (
              <span className="font-medium text-ink/70">
                {mb(p.storageUsed!)} / {mb(p.limits.storage)} MB
              </span>
            )}
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-ink/10">
            <div className="h-1.5 rounded-full bg-ink/60" style={{ width: (share ?? (p.artworks / p.limits.artworks) * 100) + "%" }} />
          </div>
          <p className="mt-2 text-[10.5px] leading-snug text-ink/50">
            {p.artworks} / {p.limits.artworks} {t(l, "works")}
          </p>
        </div>
      )}
    </div>
  );
}

export function DashLayout(p: Props) {
  const { l } = p;
  const [collapsed, setCollapsed] = useState(false),
    [mobileOpen, setMobileOpen] = useState(false);
  const state = p.saveError ? "error" : p.status;
  return (
    <div className="ui flex min-h-screen bg-[#FBF7F0]">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-ink/10 bg-ivory transition-all duration-300 lg:block",
          collapsed ? "w-[72px]" : "w-[244px]",
        )}
      >
        <Sidebar {...p} collapsed={collapsed} />
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? (l === "en" ? "Expand sidebar" : "Expandir menu") : l === "en" ? "Collapse sidebar" : "Recolher menu"}
          className="absolute -right-3 top-16 hidden h-6 w-6 place-items-center rounded-full border border-ink/12 bg-ivory text-ink/50 shadow-sm hover:text-ink lg:grid"
        >
          <ChevronLeft className={cn("h-3 w-3 transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button type="button" aria-label={t(l, "cancel")} className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="u-pop absolute inset-y-0 left-0 w-[260px] border-r border-ink/10 bg-ivory">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label={t(l, "cancel")}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-ink/12"
            >
              <X className="h-4 w-4" />
            </button>
            <Sidebar {...p} collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-ink/10 bg-[#FBF7F0]/90 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink/12 lg:hidden"
              aria-label={l === "en" ? "Open menu" : "Abrir menu"}
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="hidden items-center gap-2 text-[12px] text-ink/40 sm:flex">
              <span>{t(l, "studio")}</span>
              <span className="text-ink/20">/</span>
              <span className="font-medium text-ink">{p.title}</span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="hidden items-center gap-1.5 text-[11px] text-ink/40 md:flex" role="status">
                <span className={cn("h-1.5 w-1.5 rounded-full", state === "saved" ? "bg-mint" : state === "error" ? "bg-coral" : "bg-butter")} />
                {state === "error" ? message(l, p.saveError) : t(l, state === "saved" ? "allSaved" : state === "saving" ? "saving" : "dirty")}
              </span>
              <Language
                lang={l}
                className="grid h-9 w-9 place-items-center rounded-full border border-ink/12 bg-ivory text-[10.5px] font-semibold tracking-[0.06em] text-ink/55 hover:text-ink"
              />
              <a
                href={p.published ? p.publicHref : "/preview"}
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-1.5 rounded-full border border-ink/15 bg-ivory px-3.5 py-2 text-[12px] font-medium text-ink/70 hover:border-ink/40 hover:text-ink sm:flex"
              >
                <ExternalLink className="h-3.5 w-3.5" /> {p.published ? t(l, "visit") : t(l, "preview")}
              </a>
              <button
                type="button"
                onClick={p.onPublish}
                className="inline-flex items-center gap-1.5 rounded-full bg-coral px-4 py-2 text-[12px] font-medium text-ink shadow-[0_2px_0_0_hsl(var(--ink)/0.12)] transition-transform hover:-translate-y-0.5"
              >
                <Rocket className="h-3.5 w-3.5" /> {t(l, "publish")}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-14 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1180px]">{p.children}</div>
        </main>

        <footer className="border-t border-ink/10 px-6 py-4">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-2 text-[11px] text-ink/35">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-coral" /> {p.brand} · {t(l, "studio").toLowerCase()}
            </span>
            <div className="flex gap-4">
              <button type="button" onClick={() => p.setTab("settings")} className="hover:text-ink">
                {t(l, "settingsNav")}
              </button>
              <button type="button" onClick={p.onLogout} className="inline-flex items-center gap-1 hover:text-ink">
                <LogOut className="h-3 w-3" /> {t(l, "logout")}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
