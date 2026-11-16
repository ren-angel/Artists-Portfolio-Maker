"use client";
import { useState } from "react";
import type { Art, Chapter, Creative, Draft } from "@studio/shared";
import type { Update } from "../studio/use-draft";
import { reorder } from "../../shared/lib/reorder";
import { input, ghostPill } from "../../shared/ui/studio-kit";

type Tr = (en: string, pt: string) => string;
export function ArtSequence({
  art,
  ids,
  change,
  tr,
}: {
  art: Art[];
  ids: string[];
  change: (ids: string[]) => void;
  tr: Tr;
}) {
  const [drag, setDrag] = useState<number | null>(null);
  function move(from: number, to: number) {
    const next = [...ids];
    reorder(next, from, to);
    change(next);
  }
  return (
    <div>
      <label>
        {tr("Add artwork from library", "Adicionar obra da biblioteca")}
        <select
          className={input}
          value=""
          onChange={(e) => change([...ids, e.target.value])}
        >
          <option value="">{tr("Choose artwork", "Escolher obra")}</option>
          {art
            .filter((a) => !ids.includes(a.id))
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
        </select>
      </label>
      <ol>
        {ids.map((id, i) => (
          <li
            key={id}
            draggable
            onDragStart={() => setDrag(i)}
            onDragEnd={() => setDrag(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (drag !== null) move(drag, i);
              setDrag(null);
            }}
            className="flex items-center gap-2 border-b border-ink/10 py-1"
          >
            <span className="flex-1">
              {i + 1}. {art.find((a) => a.id === id)?.title}
            </span>
            <button
              aria-label={tr("Move up", "Mover para cima")}
              disabled={i === 0}
              onClick={() => move(i, i - 1)}
            >
              ↑
            </button>
            <button
              aria-label={tr("Move down", "Mover para baixo")}
              disabled={i === ids.length - 1}
              onClick={() => move(i, i + 1)}
            >
              ↓
            </button>
            <button
              aria-label={tr("Remove artwork", "Remover obra")}
              onClick={() => change(ids.filter((a) => a !== id))}
            >
              ×
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
export function CreativeFields({
  d,
  page,
  update,
  tr,
  chapterLimit,
}: {
  d: Draft;
  page: Draft["pages"][number];
  update: Update;
  tr: Tr;
  chapterLimit: number;
}) {
  const c = page.creative!;
  const edit = (change: (c: Creative) => void) =>
    update((x) => change(x.pages.find((p) => p.id === page.id)!.creative!));
  const patch = (v: Partial<Creative>) => edit((c) => Object.assign(c, v));
  const chapter = (id: string, v: Partial<Chapter>) =>
    edit((c) =>
      Object.assign(
        c.chapters.find((h) => h.id === id)!,
        v,
      ),
    );
  const cover = (id: string | null, change: (id: string | null) => void) => (
    <label>
      {tr("Cover artwork", "Arte de capa")}
      <select
        className={input}
        value={id ?? ""}
        onChange={(e) => change(e.target.value || null)}
      >
        <option value="">{tr("None", "Nenhuma")}</option>
        {d.artworks.map((a) => (
          <option key={a.id} value={a.id}>
            {a.title}
          </option>
        ))}
      </select>
    </label>
  );
  const sale = c.sale;
  return (
    <div className="space-y-4 bg-paper/50 px-4 py-4 text-sm">
      <div className="flex flex-wrap gap-5">
        <label>
          <input
            type="checkbox"
            checked={c.visible}
            disabled={page.id === d.home}
            onChange={(e) => patch({ visible: e.target.checked })}
          />{" "}
          {tr("Include in next publication", "Incluir na próxima publicação")}
        </label>
        <label>
          <input
            type="checkbox"
            checked={c.featured}
            onChange={(e) => patch({ featured: e.target.checked })}
          />{" "}
          {tr("Featured", "Em destaque")}
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          {tr("Description", "Descrição")}
          <textarea
            className={input}
            value={c.description}
            maxLength={4000}
            onChange={(e) => patch({ description: e.target.value })}
          />
        </label>
        {cover(c.cover, (cover) => patch({ cover }))}
        <label>
          {tr("Status", "Status")}
          <input
            className={input}
            value={c.status}
            maxLength={80}
            onChange={(e) => patch({ status: e.target.value })}
          />
        </label>
        <label>
          {tr(
            "Categories and tags (comma separated)",
            "Categorias e tags (separadas por vírgula)",
          )}
          <input
            className={input}
            defaultValue={c.tags.join(", ")}
            maxLength={700}
            onBlur={(e) =>
              patch({
                tags: e.target.value
                  .split(",")
                  .map((s) => s.trim().slice(0, 60))
                  .filter(Boolean)
                  .slice(0, 16),
              })
            }
          />
        </label>
        <label>
          {tr("External link", "Link externo")}
          <input
            className={input}
            type="url"
            placeholder="https://"
            maxLength={500}
            value={c.link}
            onChange={(e) => patch({ link: e.target.value })}
          />
        </label>
      </div>
      {sale && (
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend>{tr("Seller checkout", "Checkout do artista")}</legend>
          <label>
            {tr("Listed price", "Preço anunciado")}
            <input
              type="number"
              min="0"
              max="1000000"
              step="any"
              className={input}
              value={sale.price}
              onChange={(e) =>
                patch({ sale: { ...sale, price: Number(e.target.value) } })
              }
            />
          </label>
          <label>
            {tr("Currency", "Moeda")}
            <input
              className={input}
              value={sale.currency}
              maxLength={3}
              onChange={(e) =>
                patch({
                  sale: { ...sale, currency: e.target.value.toUpperCase() },
                })
              }
            />
          </label>
          <label>
            {tr("Your external store URL", "URL da sua loja externa")}
            <input
              className={input}
              type="url"
              placeholder="https://"
              value={sale.checkout}
              onChange={(e) =>
                patch({ sale: { ...sale, checkout: e.target.value } })
              }
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={sale.available}
              disabled={!sale.checkout}
              onChange={(e) =>
                patch({ sale: { ...sale, available: e.target.checked } })
              }
            />{" "}
            {tr("Available for purchase", "Disponível para compra")}
          </label>
          <p>
            {tr(
              "Your store handles payment and buyer delivery.",
              "Sua loja cuida do pagamento e da entrega ao comprador.",
            )}
          </p>
        </fieldset>
      )}
      <details>
        <summary>
          {tr(
            "Custom sections and attributes",
            "Seções e atributos personalizados",
          )}
        </summary>
        {c.fields.map((f, i) => (
          <div key={i} className="grid gap-2 py-2 sm:grid-cols-[1fr_2fr_auto]">
            <input
              className={input}
              aria-label={tr("Section name", "Nome da seção")}
              maxLength={100}
              value={f.label}
              onChange={(e) =>
                edit((c) => {
                  c.fields[i].label = e.target.value;
                })
              }
            />
            <textarea
              className={input}
              aria-label={tr("Section content", "Conteúdo da seção")}
              maxLength={4000}
              value={f.text}
              onChange={(e) =>
                edit((c) => {
                  c.fields[i].text = e.target.value;
                })
              }
            />
            <button
              onClick={() =>
                edit((c) => {
                  c.fields.splice(i, 1);
                })
              }
            >
              {tr("Remove", "Remover")}
            </button>
          </div>
        ))}
        <button
          className={ghostPill}
          disabled={c.fields.length >= 24}
          onClick={() => edit((c) => c.fields.push({ label: "", text: "" }))}
        >
          {tr("Add section", "Adicionar seção")}
        </button>
      </details>
      <details>
        <summary>
          {tr(
            "Illustrations and reference sheets",
            "Ilustrações e folhas de referência",
          )}
        </summary>
        <ArtSequence
          art={d.artworks}
          ids={c.artIds}
          change={(artIds) => patch({ artIds })}
          tr={tr}
        />
      </details>
      <details>
        <summary>{tr("Related pages", "Páginas relacionadas")}</summary>
        {d.pages
          .filter((p) => p.id !== page.id)
          .map((p) => (
            <label key={p.id} className="block">
              <input
                type="checkbox"
                checked={c.related.includes(p.id)}
                onChange={(e) =>
                  patch({
                    related: e.target.checked
                      ? [...c.related, p.id]
                      : c.related.filter((id) => id !== p.id),
                  })
                }
              />{" "}
              {p.title}
            </label>
          ))}
      </details>
      {c.kind === "comic" && (
        <section>
          <h3>{tr("Chapters", "Capítulos")}</h3>
          {c.chapters.map((h, i) => (
            <details
              key={h.id}
              className="my-2 rounded-lg border border-ink/15 p-3"
            >
              <summary>
                {i + 1}. {h.title}
              </summary>
              <div className="grid gap-3 py-3 sm:grid-cols-2">
                <label>
                  {tr("Chapter title", "Título do capítulo")}
                  <input
                    className={input}
                    value={h.title}
                    maxLength={120}
                    onChange={(e) => chapter(h.id, { title: e.target.value })}
                  />
                </label>
                <label>
                  {tr("Publication date", "Data de publicação")}
                  <input
                    className={input}
                    type="date"
                    value={h.date ?? ""}
                    onChange={(e) =>
                      chapter(h.id, { date: e.target.value || null })
                    }
                  />
                </label>
                {cover(h.cover, (cover) => chapter(h.id, { cover }))}
                <label>
                  <input
                    type="checkbox"
                    checked={h.visible}
                    onChange={(e) =>
                      chapter(h.id, { visible: e.target.checked })
                    }
                  />{" "}
                  {tr(
                    "Include chapter in publication",
                    "Incluir capítulo na publicação",
                  )}
                </label>
              </div>
              <ArtSequence
                art={d.artworks}
                ids={h.artIds}
                change={(artIds) => chapter(h.id, { artIds })}
                tr={tr}
              />
              <div className="flex gap-4 pt-3">
                <button
                  disabled={!i}
                  onClick={() => edit((c) => reorder(c.chapters, i, i - 1))}
                >
                  {tr("Move up", "Mover para cima")}
                </button>
                <button
                  disabled={i === c.chapters.length - 1}
                  onClick={() => edit((c) => reorder(c.chapters, i, i + 1))}
                >
                  {tr("Move down", "Mover para baixo")}
                </button>
                <button
                  onClick={() => {
                    if (confirm(tr("Delete chapter?", "Excluir capítulo?")))
                      edit((c) => {
                        c.chapters.splice(i, 1);
                      });
                  }}
                >
                  {tr("Delete chapter", "Excluir capítulo")}
                </button>
              </div>
            </details>
          ))}
          <button
            className={ghostPill}
            disabled={
              c.chapters.length >= 150 ||
              d.pages.reduce(
                (n, p) => n + (p.creative?.chapters.length ?? 0),
                0,
              ) >= chapterLimit
            }
            onClick={() =>
              edit((c) =>
                c.chapters.push({
                  id: crypto.randomUUID(),
                  title: tr("New chapter", "Novo capítulo"),
                  visible: false,
                  date: null,
                  cover: null,
                  artIds: [],
                }),
              )
            }
          >
            {tr("Add chapter", "Adicionar capítulo")}
          </button>
        </section>
      )}
    </div>
  );
}
