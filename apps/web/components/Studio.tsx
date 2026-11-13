"use client";
import { useState, useEffect, type FormEvent } from "react";
import {
  LayoutDashboard,
  PanelsTopLeft,
  Images,
  Palette,
  Settings,
  Layers,
  PanelTop,
  Eye,
  ArrowUpRight,
} from "lucide-react";
import type { Draft } from "@studio/shared";
import { t, message, type Lang, type Key } from "../lib/copy";
import { api } from "../lib/client";
import {
  useDraft,
  type Artist,
  type Limits,
  type SiteData,
  type Update,
} from "../lib/use-draft";
import { Language } from "./Language";
import { Brand } from "./Brand";
import { Portfolio } from "./Portfolio";
import { Editor, Theme, Templates } from "./Editor";
import { Library, Pages, Galleries, upload } from "./Collections";
import { Choice, Field } from "./Fields";
const sections = {
  overview: LayoutDashboard,
  editor: PanelsTopLeft,
  pages: PanelTop,
  galleries: Layers,
  library: Images,
  theme: Palette,
  settings: Settings,
};
type Tab = keyof typeof sections;
function Account({
  user,
  d,
  l,
  site,
  update,
  refresh,
  act,
}: {
  user: Artist;
  d: Draft;
  l: Lang;
  site: string;
  update: Update;
  refresh: () => Promise<void>;
  act: (fn: () => Promise<void>) => void;
}) {
  const [name, setName] = useState(user.displayName),
    [avatar, setAvatar] = useState(user.avatar || ""),
    [secret, setSecret] = useState("");
  return (
    <section className="panel stack">
      <p>
        {user.email} {user.verified ? "✓" : ""}
      </p>
      {!user.verified && (
        <button
          onClick={() =>
            act(async () => {
              await api("/auth/resend", "POST");
              alert(t(l, "sent"));
            })
          }
        >
          {t(l, "resend")}
        </button>
      )}
      <Field label={t(l, "name")} value={name} max={80} onChange={setName} />
      <Choice
        label={t(l, "avatar")}
        value={avatar}
        options={[
          ["", t(l, "none")],
          ...d.artworks.map((a) => [a.assetId, a.title] as const),
        ]}
        onChange={setAvatar}
      />
      {avatar && (
        <img
          className="avatar"
          src={"/api/media/" + site + "/" + avatar + "/thumb"}
          alt=""
        />
      )}
      <button
        onClick={() =>
          act(async () => {
            await api("/me", "PATCH", {
              displayName: name,
              avatar: avatar || null,
            });
            await refresh();
          })
        }
      >
        {t(l, "save")}
      </button>
      <Field
        area
        label={t(l, "social")}
        max={5000}
        value={d.social.join("\n")}
        onChange={(v) =>
          update((x) => {
            x.social = v ? v.split("\n") : [];
          })
        }
      />
      <hr />
      <button
        onClick={() =>
          act(async () => {
            await api("/auth/logout", "POST");
            location.assign("/");
          })
        }
      >
        {t(l, "logout")}
      </button>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (confirm(t(l, "deleteAsk")))
            act(async () => {
              await api("/me", "DELETE", { password: secret });
              location.assign("/");
            });
        }}
      >
        <label>
          {t(l, "password")}
          <input
            type="password"
            autoComplete="current-password"
            required
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
        </label>
        <button className="danger">{t(l, "deleteAccount")}</button>
      </form>
    </section>
  );
}
function Workspace({
  initial,
  user,
  limits,
  l,
  name,
  refresh,
}: {
  initial: SiteData;
  user: Artist;
  limits: Limits;
  l: Lang;
  name: string;
  refresh: () => Promise<void>;
}) {
  const {
    data,
    update,
    status,
    flush,
    reload,
    current,
    error: saveError,
  } = useDraft(initial);
  const d = data.draft;
  const [tab, setTab] = useState<Tab>("overview"),
    [setup, setSetup] = useState(d.step < 7),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [progress, setProgress] = useState<number | null>(null);
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
  const publish = (action: "publish" | "unpublish") =>
    act(async () => {
      await flush();
      await api("/sites/" + data.id + "/" + action, "POST", {
        version: current.current.version,
      });
      await reload();
    });
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
  const pageProps = { d, l, update };
  const library = (
    <Library
      {...pageProps}
      site={data.id}
      onFiles={uploadFiles}
      progress={progress}
    />
  );
  const publicLink = "/site/" + data.handle;
  const preview = (
    <div className="studio-preview">
      <Portfolio draft={d} site={data.id} base="/preview" />
    </div>
  );
  const publishBar = (
    <div className="actions">
      <button className="btn ink" onClick={() => publish("publish")}>
        {t(l, "publish")} ↗
      </button>
      {data.published && (
        <>
          <a
            className="btn ghost"
            href={publicLink}
            target="_blank"
            rel="noreferrer"
          >
            {t(l, "visit")}
          </a>
          <button
            onClick={() => {
              if (confirm(t(l, "unpublish") + "?")) publish("unpublish");
            }}
          >
            {t(l, "unpublish")}
          </button>
        </>
      )}
      {!user.verified && (
        <button
          onClick={() =>
            void act(async () => {
              await api("/auth/resend", "POST");
              alert(t(l, "sent"));
            })
          }
        >
          {t(l, "resend")}
        </button>
      )}
    </div>
  );
  const stepTitle: Key[] = [
    "setup",
    "setup",
    "templates",
    "galleries",
    "upload",
    "theme",
    "publish",
  ];
  const step = Math.min(6, d.step);
  return (
    <div
      className={"studio " + (tab === "editor" && !setup ? "full-editor" : "")}
    >
      <aside className="sidebar">
        <Brand name={name} />
        <div className="identity">
          {user.avatar ? (
            <img
              className="avatar"
              src={"/api/media/" + data.id + "/" + user.avatar + "/thumb"}
              alt=""
            />
          ) : (
            <b>{user.displayName.slice(0, 2)}</b>
          )}
          <div>
            {user.displayName}
            <small>/{data.handle}</small>
          </div>
        </div>
        <small>{t(l, "workspace")}</small>
        <nav>
          {(Object.keys(sections) as Tab[]).map((k) => {
            const Icon = sections[k];
            return (
              <button
                key={k}
                aria-current={!setup && tab === k ? "page" : undefined}
                onClick={() => {
                  setSetup(false);
                  setTab(k);
                }}
              >
                <Icon size={16} />
                {t(l, k)}
              </button>
            );
          })}
        </nav>
        <Language lang={l} />
      </aside>
      <main className="studio-main">
        <header className="studio-top">
          <span>
            {t(l, "studio")}　/　{t(l, setup ? "setup" : tab)}
          </span>
          <div className="actions">
            <span className="status" role="status">
              {t(l, status as Key)}
            </span>
            <button
              disabled={busy}
              onClick={() =>
                void act(async () => {
                  await flush();
                  location.assign("/preview");
                })
              }
            >
              <Eye size={15} />
              {t(l, "preview")}
            </button>
          </div>
        </header>
        {(error || saveError) && (
          <div className="error" role="alert">
            {message(l, error || saveError)}{" "}
            <button
              onClick={() =>
                void act(async () => {
                  if ((error || saveError) === "conflict") {
                    if (confirm(t(l, "leave"))) await reload();
                  } else await flush();
                })
              }
            >
              {t(l, "retry")}
            </button>
          </div>
        )}
        <fieldset className="work-area" disabled={busy}>
          <div className="section-title">
            <div>
              <small>
                {setup ? t(l, "step") + " " + step + " / 6" : data.handle}
              </small>
              <h1>{t(l, setup ? stepTitle[step] : tab)}</h1>
            </div>
            {!setup && tab === "overview" && publishBar}
          </div>
          {setup ? (
            <div className="setup-grid">
              <div className="panel stack">
                <progress max={6} value={step} />
                {step === 2 && <Templates {...pageProps} />}{" "}
                {step === 3 && <Galleries {...pageProps} />}{" "}
                {step === 4 && (
                  <>
                    {library}
                    <small>{t(l, "skipUpload")}</small>
                  </>
                )}
                {step === 5 && <Theme {...pageProps} />}{" "}
                {step === 6 && (
                  <>
                    <p>{t(l, "start")}</p>
                    {publishBar}
                  </>
                )}
                <div className="actions">
                  {step > 2 && (
                    <button
                      onClick={() =>
                        update((x) => {
                          x.step = step - 1;
                        })
                      }
                    >
                      {t(l, "back")}
                    </button>
                  )}
                  <button
                    className="btn ink"
                    onClick={() => {
                      update((x) => {
                        x.step = step + 1;
                      });
                      if (step === 6) setSetup(false);
                    }}
                  >
                    {t(l, step === 6 ? "finish" : "next")} →
                  </button>
                </div>
                <button onClick={() => setSetup(false)}>{t(l, "skip")}</button>
              </div>
              {preview}
            </div>
          ) : tab === "editor" ? (
            <Editor {...pageProps} site={data.id} />
          ) : tab === "theme" ? (
            <div className="setup-grid">
              <section className="panel">
                <Theme {...pageProps} />
              </section>
              {preview}
            </div>
          ) : tab === "pages" ? (
            <Pages {...pageProps} limits={limits} />
          ) : tab === "galleries" ? (
            <Galleries {...pageProps} />
          ) : tab === "library" ? (
            library
          ) : tab === "settings" ? (
            <Account
              {...pageProps}
              user={user}
              site={data.id}
              refresh={refresh}
              act={(fn) => void act(fn)}
            />
          ) : (
            <div className="stack">
              <div className="summary-cards">
                {(["pages", "galleries", "library"] as const).map((k, i) => (
                  <button onClick={() => setTab(k)} key={k}>
                    <strong>
                      {
                        [d.pages.length, d.galleries.length, d.artworks.length][
                          i
                        ]
                      }
                    </strong>
                    {t(l, k)} <ArrowUpRight size={15} />
                  </button>
                ))}
              </div>
              <div className="panel">
                <div className="section-title">
                  <div>
                    <small>{t(l, data.published ? "live" : "draft")}</small>
                    <h2>{d.title}</h2>
                  </div>
                  <button className="btn ink" onClick={() => setTab("editor")}>
                    {t(l, "editor")} →
                  </button>
                </div>
                {data.publishedAt && (
                  <p>
                    {t(l, "publishedAt")} ·{" "}
                    {new Date(data.publishedAt).toLocaleString(l)}
                  </p>
                )}
                {preview}
              </div>
              {d.step < 7 && (
                <button onClick={() => setSetup(true)}>{t(l, "resume")}</button>
              )}
            </div>
          )}
        </fieldset>
      </main>
    </div>
  );
}
export function Studio({ l, name }: { l: Lang; name: string }) {
  const [user, setUser] = useState<Artist | null>(null),
    [limits, setLimits] = useState<Limits | null>(null),
    [site, setSite] = useState<SiteData | null>(null),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  async function load() {
    try {
      const u = await api<Artist>("/me");
      setUser(u);
      const r = await api<{ sites: { id: string }[]; limits: Limits }>(
        "/sites",
      );
      if (r.sites[0]) setSite(await api<SiteData>("/sites/" + r.sites[0].id));
      setLimits(r.limits);
    } catch (err) {
      if ((err as Error).message === "unauthorized")
        location.replace("/auth/login");
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
  if (user && limits && site)
    return (
      <Workspace
        initial={site}
        user={user}
        limits={limits}
        l={l}
        name={name}
        refresh={async () => setUser(await api<Artist>("/me"))}
      />
    );
  return (
    <>
      <header className="marketing-head">
        <Brand name={name} />
        <Language lang={l} />
      </header>
      <main className="narrow panel">
        <h1>{t(l, "setup")}</h1>
        {error && (
          <p role="alert" className="error">
            {message(l, error)}
          </p>
        )}
        {!limits ? (
          <p role="status">{t(l, "loading")}</p>
        ) : (
          <form className="stack" onSubmit={create}>
            <small>{t(l, "step")} 1 / 6</small>
            <p>{t(l, "noSite")}</p>
            <label>
              {t(l, "username")}
              <input
                name="handle"
                autoComplete="username"
                minLength={3}
                maxLength={50}
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                placeholder="luna-mori"
              />
            </label>
            <label>
              {t(l, "title")}
              <input name="title" required maxLength={120} />
            </label>
            <button className="btn ink" disabled={saving}>
              {t(l, "continue")} →
            </button>
          </form>
        )}
      </main>
    </>
  );
}
