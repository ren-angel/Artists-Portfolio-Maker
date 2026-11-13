"use client";
import { useState } from "react";
import {
  blockTypes,
  newBlock,
  templateNames,
  type Block,
  type Draft,
} from "@studio/shared";
import type { Update } from "../lib/use-draft";
import { t, type Lang, type Key } from "../lib/copy";
import { Choice, Field, Toggle, Shift, reorder, translated } from "./Fields";
import { Portfolio } from "./Portfolio";
import { print } from "../lib/demo";
type Props = { d: Draft; update: Update; l: Lang };
const key = (type: Block["type"]): Key =>
  type === "hero" ? "heroBlock" : type;
export function Templates({ d, update }: { d: Draft; update: Update }) {
  return (
    <div className="templates theme-options">
      {templateNames.map((v) => (
        <button
          aria-pressed={d.theme.template === v}
          key={v}
          onClick={() =>
            update((x) => {
              x.theme.template = v;
            })
          }
        >
          <img alt="" src={print(v)} />
          <strong>{v}</strong>
        </button>
      ))}
    </div>
  );
}
export function Theme({ d, update, l }: { d: Draft; update: Update; l: Lang }) {
  return (
    <div className="stack">
      <Templates d={d} update={update} />
      <Field
        label={t(l, "title")}
        value={d.title}
        onChange={(v) =>
          update((x) => {
            x.title = v;
          })
        }
      />
      <Field
        label={t(l, "description")}
        value={d.description}
        max={320}
        area
        onChange={(v) =>
          update((x) => {
            x.description = v;
          })
        }
      />
      <Choice
        label={t(l, "palette")}
        value={d.theme.palette}
        options={translated(l, ["original", "warm", "cool", "noir"])}
        onChange={(v) =>
          update((x) => {
            x.theme.palette = v;
          })
        }
      />
      <label>
        {t(l, "accent")}
        <input
          type="color"
          value={d.theme.accent}
          onChange={(e) =>
            update((x) => {
              x.theme.accent = e.target.value;
            })
          }
        />
      </label>
      <Choice
        label={t(l, "font")}
        value={d.theme.font}
        options={translated(l, ["template", "serif", "sans", "mono"])}
        onChange={(v) =>
          update((x) => {
            x.theme.font = v;
          })
        }
      />
      <Choice
        label={t(l, "nav")}
        value={d.theme.nav}
        options={translated(l, ["split", "center", "stack"])}
        onChange={(v) =>
          update((x) => {
            x.theme.nav = v;
          })
        }
      />
      <Choice
        label={t(l, "publicLang")}
        value={d.language}
        options={[
          ["pt-BR", "Português"],
          ["en", "English"],
        ]}
        onChange={(v) =>
          update((x) => {
            x.language = v;
          })
        }
      />
    </div>
  );
}
export function Editor({ d, update, l, site }: { site: string } & Props) {
  const [pageId, setPage] = useState(d.home),
    [blockId, setId] = useState(""),
    [type, setType] = useState<Block["type"]>("heading"),
    [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const page = d.pages.find((p) => p.id === pageId) ?? d.pages[0];
  const b = page.blocks.find((b) => b.id === blockId) ?? page.blocks[0];
  const editPage = (fn: (p: Draft["pages"][number]) => void) =>
    update((x) => fn(x.pages.find((p) => p.id === page.id)!));
  const patch = (v: Partial<Block>) =>
    editPage((p) =>
      Object.assign(
        p.blocks.find((k) => k.id === b.id)!,
        v,
      ),
    );
  return (
    <div className="editor">
      <div className="editor-bar">
        <Choice
          label={t(l, "choosePage")}
          value={page.id}
          options={d.pages.map((p) => [p.id, p.title])}
          onChange={setPage}
        />
        <Choice
          label={t(l, "device")}
          value={device}
          options={translated(l, ["desktop", "tablet", "mobile"])}
          onChange={setDevice}
        />
      </div>
      <div className="editor-grid">
        <aside className="rail">
          <h3>{t(l, "blocks")}</h3>
          {page.blocks.map((v, i) => (
            <div
              className={"block-row " + (v.id === b?.id ? "active" : "")}
              key={v.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/block", v.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const from = page.blocks.findIndex(
                  (k) => k.id === e.dataTransfer.getData("text/block"),
                );
                editPage((p) => reorder(p.blocks, from, i));
              }}
            >
              <button onClick={() => setId(v.id)}>
                ⠿　{t(l, key(v.type))}
              </button>
              <Shift
                index={i}
                total={page.blocks.length}
                l={l}
                move={(j) => editPage((p) => reorder(p.blocks, i, j))}
              />
            </div>
          ))}
          <Choice
            label={t(l, "add")}
            options={blockTypes.map((type) => [type, t(l, key(type))])}
            value={type}
            onChange={setType}
          />
          <button
            onClick={() => {
              const added = newBlock(type);
              editPage((p) => p.blocks.push(added));
              setId(added.id);
            }}
          >
            ＋ {t(l, "add")}
          </button>
        </aside>
        <div className="canvas">
          <div className={"screen device-" + device}>
            <Portfolio
              draft={d}
              site={site}
              base="/preview"
              path={page.id === d.home ? [] : [page.slug]}
              selectBlock={setId}
              selected={b?.id}
            />
          </div>
        </div>
        <aside className="inspector">
          <h3>{t(l, "properties")}</h3>
          {b && (
            <div className="stack">
              <strong>{t(l, key(b.type))}</strong>
              <Toggle
                label={t(l, "visible")}
                value={b.visible}
                onChange={(visible) => patch({ visible })}
              />
              {b.type !== "divider" && (
                <Field
                  label={t(l, "title")}
                  value={b.heading}
                  max={160}
                  onChange={(heading) => patch({ heading })}
                />
              )}
              {["hero", "richText", "about", "contact", "image"].includes(
                b.type,
              ) && (
                <>
                  <Field
                    area
                    label={t(l, "text")}
                    value={b.text}
                    max={10000}
                    onChange={(text) => patch({ text })}
                  />
                  {b.type === "richText" && <small>{t(l, "tip")}</small>}
                </>
              )}
              {["image", "hero"].includes(b.type) && (
                <Choice
                  label={t(l, "art")}
                  value={b.artId || ""}
                  options={[
                    ["", t(l, "none")],
                    ...d.artworks.map((a) => [a.id, a.title] as const),
                  ]}
                  onChange={(id) => patch({ artId: id || null })}
                />
              )}
              {["galleryPreview", "galleryGrid"].includes(b.type) && (
                <Choice
                  label={t(l, "galleries")}
                  value={b.galleryId || ""}
                  options={[
                    ["", t(l, "none")],
                    ...d.galleries.map((a) => [a.id, a.title] as const),
                  ]}
                  onChange={(id) => patch({ galleryId: id || null })}
                />
              )}
              {["cta", "contact"].includes(b.type) && (
                <Field
                  label={t(l, "link")}
                  max={500}
                  value={b.url}
                  onChange={(url) => patch({ url })}
                />
              )}
              <Choice
                label={t(l, "layout")}
                value={b.layout}
                options={translated(l, ["left", "center", "right"])}
                onChange={(layout) => patch({ layout })}
              />
              <Choice
                label={t(l, "background")}
                value={b.background}
                options={translated(l, ["none", "tint", "paper"])}
                onChange={(background) => patch({ background })}
              />
              <Choice
                label={t(l, "spacing")}
                value={b.spacing}
                options={translated(l, ["compact", "normal", "roomy"])}
                onChange={(spacing) => patch({ spacing })}
              />
              <button
                onClick={() => {
                  if (confirm(t(l, "deleteAsk")))
                    editPage((p) => {
                      p.blocks = p.blocks.filter((k) => k.id !== b.id);
                    });
                }}
              >
                {t(l, "remove")}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
