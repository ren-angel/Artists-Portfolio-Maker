"use client";
import { studioIntent } from "../../shared/lib/studio-intent";
import { useEffect, useState, type FormEvent } from "react";
import { RotateCcw } from "lucide-react";
import { t, message, type Lang } from "../../shared/lib/copy";
import { api } from "../../shared/lib/client";
import { upload } from "../library/upload";
import { useCallback } from "react";
import { useDraft, type Artist, type Entitlement, type SiteData } from "./use-draft";
import dynamic from "next/dynamic";
import type { EditorProps } from "../editor/Editor";
const Editor = dynamic(()=>import("../editor/Editor").then(m=>m.Editor));
import { PublishDialog } from "../editor/PublishDialog";
import { DashLayout, type Tab } from "./DashLayout";
import { Overview } from "./Overview";
import { Library } from "../library/Library";
import { Galleries } from "../galleries/Galleries";
import { Pages } from "../creative/Pages";
import { ThemePage } from "../theme/ThemePage";
import { Settings } from "../account/Settings";
import { CreateSite, Setup } from "../onboarding/Onboarding";
import { Billing } from "../billing/Billing";
import { Domains } from "../domains/Domains";
import { Analytics } from "../analytics/Analytics";
import { Commissions } from "../commissions/Commissions";
import { planName } from "../billing/PlanCards";
import { Sparkle } from "../../shared/ui/bits";

/* Studio sections that manage one kind of specialist page. */
const CREATIVE_TABS = { comics: "comic", characters: "character", projects: "project", shop: "product" } as const;

const TITLES: Record<Tab, Parameters<typeof t>[1]> = {
  overview: "overview",
  editor: "editor",
  pages: "pages",
  galleries: "galleries",
  library: "library",
  theme: "theme",
  commissions: "commissions",
  comics: "comicsNav",
  characters: "charactersNav",
  projects: "projectsNav",
  shop: "shopNav",
  analytics: "analytics",
  domains: "domains",
  billing: "billing",
  settings: "settingsNav",
};

function Workspace({
  initial,
  user,
  ent,
  refreshEnt,
  l,
  name,
  domain,
  origin,
  refresh,
}: {
  initial: SiteData;
  user: Artist;
  ent: Entitlement;
  refreshEnt: () => Promise<void>;
  l: Lang;
  name: string;
  domain: string;
  origin: string;
  refresh: () => Promise<void>;
}) {
  const { data, update, status, flush, reload, current, error: saveError } = useDraft(initial);
  const d = data.draft;
  const limits = ent.limits;
  const [tab, setTab] = useState<Tab>(() =>
    {
      const params = new URLSearchParams(location.search);
      if (params.has("billing") || studioIntent(location.search).plan) return "billing";
      const tab = params.get("tab");
      return tab && Object.hasOwn(TITLES, tab) ? tab as Tab : "overview";
    },
  ),
    [startPage, setStartPage] = useState<string>(),
    // Returning from a payment page goes straight to billing, not setup.
    [setup, setSetup] = useState(
      () => tab === "overview" && (d.step < 7 || new URLSearchParams(location.search).get("setup") === "1"),
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [progress, setProgress] = useState<number | null>(null),
    [publishOpen, setPublishOpen] = useState(false);
  const act = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  // Dialogs report their own failures, so these paths rethrow.
  const transition = async (action: "publish" | "unpublish") => {
    await flush();
    await api("/sites/" + data.id + "/" + action, "POST", { version: current.current.version });
    await reload();
  };
  const uploadFiles = (files: File[], id?: string) =>
    act(async () => {
      await flush();
      try {
        for (const file of files) {
          if (file.size > limits.upload) throw Error("upload_size");
          setProgress(0);
          await upload(data.id, file, setProgress, id);
        }
      } finally {
        setProgress(null);
        await reload();
      }
    });
  const save = () => void act(flush);
  const publicHref = domain === "localhost" ? "/site/" + data.handle : "https://" + data.handle + "." + domain;
  const address = domain === "localhost" ? origin.replace(/^https?:\/\//, "") + "/site/" + data.handle : data.handle + "." + domain;
  const preview = (pageId: string) => {
    if (busy) return;
    const page = d.pages.find(p => p.id === pageId);
    if (!page) return;
    const href = "/preview" + (page.id === d.home ? "" : "/" + page.slug);
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    void act(async () => {
      try {
        await flush();
        if (tab) tab.location.replace(href);
        else location.assign(href);
      } catch (e) {
        tab?.close();
        throw e;
      }
    });
  };
  const editorProps: EditorProps = {
    d,
    update,
    l,
    site: data.id,
    brand: name,
    address,
    publicHref,
    status,
    saveError: saveError || error,
    published: Boolean(data.published),
    publishedAt: data.publishedAt,
    verified: user.verified,
    limits,
    progress,
    onPublish: () => transition("publish"),
    onResend: () => api("/auth/resend", "POST").then(() => undefined),
    onUpload: uploadFiles,
    onPreview: preview,
    features: ent.features,
    creativeEnabled: data.creativeEnabled,
    flush,
    onExit: (next) => {
      go(next ?? "overview");
    },
    startPage,
  };
  const go = (next: Tab) => {
    setStartPage(undefined);
    if (tab !== next) history.pushState(null, "", "?tab=" + next);
    setTab(next);
    scrollTo(0, 0);
  };

  useEffect(() => {
    const navigate = () => {
      const next = new URLSearchParams(location.search).get("tab");
      setTab(next && Object.hasOwn(TITLES, next) ? next as Tab : "overview");
      setSetup(false);
      setStartPage(undefined);
    };
    window.addEventListener("popstate", navigate);
    return () => window.removeEventListener("popstate", navigate);
  }, []);

  if (tab === "editor" && !setup) return <Editor {...editorProps} />;
  if (setup)
    return (
      <Setup
        d={d}
        update={update}
        l={l}
        brand={name}
        data={data}
        user={user}
        limits={limits}
        address={address}
        publicHref={publicHref}
        progress={progress}
        onFiles={uploadFiles}
        onSave={save}
        onPublish={() => transition("publish")}
        onResend={editorProps.onResend}
        onExit={() => {
          void flush().catch(() => {});
          if (new URLSearchParams(location.search).has("setup")) history.replaceState(null, "", "?tab=overview");
          setSetup(false);
        }}
      />
    );

  const problem = error || saveError;
  return (
    <DashLayout
      l={l}
      brand={name}
      tab={tab}
      setTab={go}
      title={t(l, TITLES[tab])}
      user={user}
      site={data.id}
      address={address}
      publicHref={publicHref}
      published={Boolean(data.published)}
      status={status}
      saveError={problem}
      artworks={d.artworks.length}
      storageUsed={data.storageUsed}
      limits={limits}
      planLabel={planName(l, ent.plan)}
      onPublish={() => setPublishOpen(true)}
      onLogout={() =>
        void act(async () => {
          await api("/auth/logout", "POST");
          location.assign("/");
        })
      }
    >
      {problem && (
        <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-[12.5px] text-[#8a2f25]">
          <span>{message(l, problem)}</span>
          <button
            type="button"
            onClick={() =>
              void act(async () => {
                if (problem === "conflict") {
                  if (confirm(t(l, "leave"))) await reload();
                } else await flush();
              })
            }
            className="inline-flex items-center gap-1.5 rounded-full border border-coral/50 bg-ivory px-3 py-1.5 text-[11.5px] font-medium text-ink hover:border-coral"
          >
            <RotateCcw className="h-3 w-3" /> {t(l, "retry")}
          </button>
        </div>
      )}
      {tab === "overview" && (
        <Overview
          d={d}
          l={l}
          data={data}
          user={user}
          limits={limits}
          ent={ent}
          brand={name}
          address={address}
          publicHref={publicHref}
          setTab={go}
          onResume={() => setSetup(true)}
        />
      )}
      {tab === "library" && (
        <Library d={d} update={update} l={l} site={data.id} limits={limits} storageUsed={data.storageUsed} progress={progress} onFiles={uploadFiles} onSave={save} />
      )}
      {tab === "galleries" && (
        <Galleries d={d} update={update} l={l} site={data.id} publicBase={data.published ? publicHref : null} onSave={save} />
      )}
      {(tab === "pages" || Object.hasOwn(CREATIVE_TABS, tab)) && (
        <Pages
          key={tab}
          only={CREATIVE_TABS[tab as keyof typeof CREATIVE_TABS]}
          privateDownloads={ent.features.privateDownloads} site={data.id} flush={flush} creativeEnabled={!!data.creativeEnabled} chapterLimit={limits.pages*(data.chaptersPerPage??2)}
          d={d}
          update={update}
          l={l}
          limits={limits}
          onEdit={(id) => {
            go("editor");
            setStartPage(id);
          }}
        />
      )}
      {tab === "theme" && <ThemePage d={d} update={update} l={l} site={data.id} brand={name} onSave={save} features={ent.features} onUpgrade={() => go("billing")} />}
      {tab === "commissions" && (
        <Commissions
          d={d}
          update={update}
          l={l}
          site={data.id}
          entitled={ent.features.commissions}
          limits={limits}
          onUpgrade={() => go("billing")}
          onPreview={preview}
          onEditPage={(id) => {
            go("editor");
            setStartPage(id);
          }}
        />
      )}
      {tab === "analytics" && <Analytics l={l} site={data.id} onUpgrade={() => go("billing")} />}
      {tab === "domains" && <Domains l={l} site={data.id} handle={data.handle} address={address} publicHref={publicHref} published={Boolean(data.published)} onUpgrade={() => go("billing")} />}
      {tab === "billing" && <Billing l={l} onChange={refreshEnt} />}
      {tab === "settings" && (
        <Settings
          d={d}
          update={update}
          l={l}
          site={data.id}
          user={user}
          handle={data.handle}
          address={address}
          published={Boolean(data.published)}
          refresh={refresh}
          onUnpublish={() => transition("unpublish")}
        />
      )}
      <PublishDialog {...editorProps} open={publishOpen} onClose={() => setPublishOpen(false)} />
    </DashLayout>
  );
}

export function Studio({ l, name, domain, origin }: { l: Lang; name: string; domain: string; origin: string }) {
  const [user, setUser] = useState<Artist | null>(null),
    [ent, setEnt] = useState<Entitlement | null>(null),
    [site, setSite] = useState<SiteData | null>(null),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  async function load() {
    try {
      const u = await api<Artist>("/me");
      setUser(u);
      const r = await api<{ sites: { id: string }[] } & Entitlement>("/sites");
      if (r.sites[0]) setSite(await api<SiteData>("/sites/" + r.sites[0].id));
      setEnt({ plan: r.plan, limits: r.limits, features: r.features });
    } catch (err) {
      if ((err as Error).message === "unauthorized") location.replace("/auth/login" + studioIntent(location.search).query);
      else setError((err as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const b = Object.fromEntries(new FormData(e.currentTarget));
      await api("/sites", "POST", { ...b, language: l, template: studioIntent(location.search).template });
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }
  const refreshEnt = useCallback(async () => {
    const r = await api<Entitlement>("/sites");
    setEnt({ plan: r.plan, limits: r.limits, features: r.features });
  }, []);
  if (user && ent && site)
    return (
      <Workspace
        initial={site}
        user={user}
        ent={ent}
        refreshEnt={refreshEnt}
        l={l}
        name={name}
        domain={domain}
        origin={origin}
        refresh={async () => setUser(await api<Artist>("/me"))}
      />
    );
  if (!ent)
    return (
      <div className="ui ui-page grid place-items-center px-6" role="status">
        <div className="text-center">
          <span className="mx-auto grid h-10 w-10 animate-pulse place-items-center rounded-xl bg-ink text-paper">
            <Sparkle size={14} />
          </span>
          <p className="mt-4 text-[12.5px] text-ink/50">{error ? message(l, error) : t(l, "loading")}</p>
        </div>
      </div>
    );
  return <CreateSite l={l} brand={name} domain={domain} user={user} error={error} saving={saving} onCreate={create} />;
}
