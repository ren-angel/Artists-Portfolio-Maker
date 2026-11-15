"use client";
import { useEffect, useState, type FormEvent } from "react";
import { RotateCcw } from "lucide-react";
import { t, message, type Lang } from "../lib/copy";
import { api } from "../lib/client";
import { upload } from "../lib/upload";
import { useCallback } from "react";
import { useDraft, type Artist, type Entitlement, type SiteData } from "../lib/use-draft";
import { Editor, type EditorProps } from "./studio/editor/Editor";
import { PublishDialog } from "./studio/editor/PublishDialog";
import { DashLayout, type Tab } from "./studio/DashLayout";
import { Overview } from "./studio/Overview";
import { Library } from "./studio/Library";
import { Galleries } from "./studio/Galleries";
import { Pages } from "./studio/Pages";
import { ThemePage } from "./studio/ThemePage";
import { Settings } from "./studio/Settings";
import { CreateSite, Setup } from "./studio/Onboarding";
import { Billing } from "./studio/Billing";
import { Domains } from "./studio/Domains";
import { Analytics } from "./studio/Analytics";
import { Commissions } from "./studio/Commissions";
import { planName } from "./studio/PlanCards";
import { Sparkle } from "./home/bits";

const TITLES: Record<Tab, Parameters<typeof t>[1]> = {
  overview: "overview",
  editor: "editor",
  pages: "pages",
  galleries: "galleries",
  library: "library",
  theme: "theme",
  commissions: "commissions",
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
    typeof location !== "undefined" && new URLSearchParams(location.search).has("billing") ? "billing" : "overview",
  ),
    [startPage, setStartPage] = useState<string>(),
    // Returning from a payment page goes straight to billing, not setup.
    [setup, setSetup] = useState(
      () => d.step < 7 && !(typeof location !== "undefined" && new URLSearchParams(location.search).has("billing")),
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
    onPreview: () =>
      void act(async () => {
        await flush();
        window.open("/preview", "_blank", "noopener");
      }),
    features: ent.features,
    onExit: (next) => {
      setStartPage(undefined);
      setTab(next ?? "overview");
    },
    startPage,
  };
  const go = (next: Tab) => {
    setStartPage(undefined);
    setTab(next);
    scrollTo(0, 0);
  };

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
      {tab === "pages" && (
        <Pages
          d={d}
          update={update}
          l={l}
          limits={limits}
          onEdit={(id) => {
            setStartPage(id);
            setTab("editor");
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
          onEditPage={(id) => {
            setStartPage(id);
            setTab("editor");
          }}
        />
      )}
      {tab === "analytics" && <Analytics l={l} site={data.id} onUpgrade={() => go("billing")} />}
      {tab === "domains" && <Domains l={l} site={data.id} handle={data.handle} address={address} onUpgrade={() => go("billing")} />}
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
      if ((err as Error).message === "unauthorized") location.replace("/auth/login");
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
      await api("/sites", "POST", { ...b, language: l });
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
