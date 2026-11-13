"use client";
import { useState, type ChangeEvent } from "react";
import { newBlock, type Draft } from "@studio/shared";
import { Choice, Toggle, Field, reorder, Shift } from "./Fields";
import { t, type Lang } from "../lib/copy";
import type { Update, Limits } from "../lib/use-draft";
import { api } from "../lib/client";
type Props = { d: Draft; update: Update; l: Lang };
export function Pages({ d, update, l, limits }: Props & { limits: Limits }) {
  const [chosen, setChosen] = useState(d.home);
  const p = d.pages.find((x) => x.id === chosen) ?? d.pages[0];
  const patch = (changes: Partial<typeof p>) =>
    update((x) =>
      Object.assign(
        x.pages.find((v) => v.id === p.id)!,
        changes,
      ),
    );
  return (
    <div className="manager">
      <section className="panel">
        <div className="section-title">
          <h3>{t(l, "pages")}</h3>
          <button
            disabled={d.pages.length - 1 >= limits.pages}
            onClick={() => {
              const id = crypto.randomUUID();
              update((x) =>
                x.pages.push({
                  id,
                  slug: "page-" + id.slice(0, 6),
                  title: t(l, "newPage"),
                  inNav: true,
                  blocks: [newBlock("heading")],
                }),
              );
              setChosen(id);
            }}
          >
            ＋ {t(l, "add")}
          </button>
        </div>
        {d.pages.map((v, i) => (
          <div className="list-row" key={v.id}>
            <button
              aria-pressed={p.id === v.id}
              onClick={() => setChosen(v.id)}
            >
              {v.title}
            </button>
            <Shift
              l={l}
              index={i}
              total={d.pages.length}
              move={(j) => update((x) => reorder(x.pages, i, j))}
            />
          </div>
        ))}
      </section>
      <section className="panel stack">
        <Field
          label={t(l, "title")}
          value={p.title}
          onChange={(title) => patch({ title })}
        />
        <Field
          label={t(l, "slug")}
          value={p.slug}
          max={50}
          onChange={(slug) => patch({ slug })}
        />
        <Toggle
          label={t(l, "nav")}
          value={p.inNav}
          onChange={(inNav) => patch({ inNav })}
        />
        <button
          disabled={p.id === d.home}
          onClick={() =>
            update((x) => {
              x.home = p.id;
            })
          }
        >
          {t(l, "homePage")} {p.id === d.home ? "✓" : ""}
        </button>
        <button
          disabled={p.id === d.home}
          onClick={() => {
            if (confirm(t(l, "deleteAsk")))
              update((x) => {
                x.pages = x.pages.filter((v) => v.id !== p.id);
              });
          }}
        >
          {t(l, "remove")}
        </button>
      </section>
    </div>
  );
}
export function Galleries({ d, update, l }: Props) {
  const [chosen, setChosen] = useState(""),
    [name, setName] = useState("");
  const g = d.galleries.find((x) => x.id === chosen) ?? d.galleries[0];
  const patch = (changes: Partial<typeof g>) =>
    update((x) =>
      Object.assign(
        x.galleries.find((v) => v.id === g.id)!,
        changes,
      ),
    );
  return (
    <div className="manager">
      <section className="panel">
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            const id = crypto.randomUUID();
            update((x) =>
              x.galleries.push({
                id,
                title: name.trim(),
                slug:
                  (name
                    .trim()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "")
                    .slice(0, 35) || "gallery") +
                  "-" +
                  id.slice(0, 5),
                visible: true,
                description: "",
                artIds: [],
                cover: null,
              }),
            );
            setChosen(id);
            setName("");
          }}
        >
          <label>
            {t(l, "custom")}
            <input
              required
              value={name}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button disabled={!name.trim()}>＋ {t(l, "add")}</button>
        </form>
        {d.galleries.map((v) => (
          <button
            className="list-row"
            key={v.id}
            aria-pressed={v.id === g.id}
            onClick={() => setChosen(v.id)}
          >
            {v.title} <small>{v.artIds.length}</small>
          </button>
        ))}
      </section>
      {g && (
        <section className="panel stack">
          <Field
            label={t(l, "title")}
            value={g.title}
            onChange={(title) => patch({ title })}
          />
          <Field
            label={t(l, "slug")}
            value={g.slug}
            max={50}
            onChange={(slug) => patch({ slug })}
          />
          <Field
            area
            label={t(l, "description")}
            value={g.description}
            max={2000}
            onChange={(description) => patch({ description })}
          />
          <Toggle
            label={t(l, "visible")}
            value={g.visible}
            onChange={(visible) => patch({ visible })}
          />
          <Choice
            label={t(l, "cover")}
            value={g.cover || ""}
            options={[
              ["", t(l, "none")],
              ...d.artworks.map((a) => [a.id, a.title] as const),
            ]}
            onChange={(id) => patch({ cover: id || null })}
          />
          {d.artworks.map((a) => (
            <Toggle
              key={a.id}
              label={a.title}
              value={g.artIds.includes(a.id)}
              onChange={(on) =>
                patch({
                  artIds: on
                    ? [...g.artIds, a.id]
                    : g.artIds.filter((id) => id !== a.id),
                })
              }
            />
          ))}
          {g.artIds.map((id, i) => (
            <div className="list-row" key={id}>
              {d.artworks.find((a) => a.id === id)?.title}
              <Shift
                l={l}
                index={i}
                total={g.artIds.length}
                move={(j) => {
                  const ids = [...g.artIds];
                  reorder(ids, i, j);
                  patch({ artIds: ids });
                }}
              />
            </div>
          ))}
          <button
            onClick={() => {
              if (confirm(t(l, "deleteAsk")))
                update((x) => {
                  x.galleries = x.galleries.filter((v) => v.id !== g.id);
                  for (const p of x.pages)
                    for (const b of p.blocks)
                      if (b.galleryId === g.id) b.galleryId = null;
                });
            }}
          >
            {t(l, "remove")}
          </button>
        </section>
      )}
    </div>
  );
}
export async function upload(
  site: string,
  file: File,
  progress: (n: number) => void,
  replacement?: string,
) {
  const path = "/sites/" + site + "/uploads";
  const { id, uploadUrl } = await api<{ id: string; uploadUrl: string | null }>(
    path,
    "POST",
    {
      bytes: file.size,
      replacement,
    },
  );
  try {
    await new Promise<void>((resolve, reject) => {
      const r = new XMLHttpRequest();
      r.open("PUT", uploadUrl || "/api" + path + "/" + id);
      r.setRequestHeader("content-type", "application/octet-stream");
      if (!uploadUrl) r.setRequestHeader("x-studio-request", "1");
      r.upload.onprogress = (e) => {
        if (e.lengthComputable) progress(Math.round((e.loaded / e.total) * 95));
      };
      r.onload = () =>
        r.status >= 200 && r.status < 300
          ? resolve()
          : reject(Error("request_failed"));
      r.onerror = () => reject(Error("request_failed"));
      r.send(file);
    });
    await api(path + "/" + id + "/finish", "POST", {
      title:
        file.name
          .replace(/\.[^.]+$/, "")
          .trim()
          .slice(0, 120) || "Artwork",
    });
    progress(100);
  } catch (err) {
    await api(path + "/" + id, "DELETE").catch(() => {});
    throw err;
  }
}
export function Library({
  d,
  update,
  l,
  site,
  onFiles,
  progress,
}: Props & {
  site: string;
  onFiles: (files: File[], id?: string) => void;
  progress: number | null;
}) {
  const [chosen, setChosen] = useState("");
  const a = d.artworks.find((v) => v.id === chosen);
  const patch = (changes: Partial<NonNullable<typeof a>>) =>
    update((x) =>
      Object.assign(
        x.artworks.find((v) => v.id === chosen)!,
        changes,
      ),
    );
  function files(e: ChangeEvent<HTMLInputElement>, id?: string) {
    onFiles(Array.from(e.target.files ?? []), id);
    e.target.value = "";
  }
  return (
    <div className="stack">
      <div
        className="drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length)
            onFiles(Array.from(e.dataTransfer.files));
        }}
      >
        <label>
          {t(l, "upload")}
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            onChange={(filesEvent) => files(filesEvent)}
          />
        </label>
        <small>{t(l, "noArt")}</small>
        {progress !== null && <progress value={progress} max={100} />}
      </div>
      <div className="art-cards">
        {d.artworks.map((v, i) => (
          <button
            key={v.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/art", v.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const j = d.artworks.findIndex(
                (k) => k.id === e.dataTransfer.getData("text/art"),
              );
              update((x) => reorder(x.artworks, j, i));
            }}
            onClick={() => setChosen(v.id)}
            aria-pressed={chosen === v.id}
          >
            <img
              alt={v.alt || v.title}
              src={"/api/media/" + site + "/" + v.assetId + "/thumb"}
            />
            <strong>
              {v.featured ? "✦ " : ""}
              {v.title}
            </strong>
          </button>
        ))}
      </div>
      {a && (
        <section className="panel stack">
          <Field
            label={t(l, "title")}
            value={a.title}
            onChange={(title) => patch({ title })}
          />
          <Field
            label={t(l, "alt")}
            value={a.alt}
            max={500}
            onChange={(alt) => patch({ alt })}
          />
          <Field
            label={t(l, "description")}
            value={a.description}
            max={2000}
            area
            onChange={(description) => patch({ description })}
          />
          <Toggle
            label={t(l, "featured")}
            value={a.featured}
            onChange={(featured) => patch({ featured })}
          />
          <Shift
            index={d.artworks.indexOf(a)}
            total={d.artworks.length}
            l={l}
            move={(j) =>
              update((x) => reorder(x.artworks, d.artworks.indexOf(a), j))
            }
          />
          <label>
            {t(l, "replace")}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => files(e, a.id)}
            />
          </label>
          <button
            onClick={() => {
              if (confirm(t(l, "deleteAsk"))) {
                update((x) => {
                  x.artworks = x.artworks.filter((v) => v.id !== a.id);
                  for (const g of x.galleries) {
                    g.artIds = g.artIds.filter((id) => id !== a.id);
                    if (g.cover === a.id) g.cover = null;
                  }
                  for (const p of x.pages)
                    for (const b of p.blocks)
                      if (b.artId === a.id) b.artId = null;
                });
                setChosen("");
              }
            }}
          >
            {t(l, "remove")}
          </button>
        </section>
      )}
    </div>
  );
}
