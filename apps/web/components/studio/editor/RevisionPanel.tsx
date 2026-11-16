"use client";
import { useState } from "react";
import {
  cleanPageReferences,
  cloneSection,
  draftSchema,
  type Block,
  type Draft,
} from "@studio/shared";
import { api } from "../../../lib/client";
import { message } from "../../../lib/copy";
import type { EditorProps } from "./Editor";

export function RevisionPanel({
  site,
  page,
  block,
  l,
  edit,
  flush,
  d,
}: Pick<EditorProps, "site" | "l" | "flush" | "d"> & {
  page: Draft["pages"][number];
  block: Block | null;
  edit: EditorProps["update"];
}) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt);
  const [versions, setVersions] = useState<
    { version: number; createdAt: string; title: string }[]
  >([]);
  const [sections, setSections] = useState<{ id: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [name, setName] = useState("");
  const base = "/sites/" + site,
    history = base + "/pages/" + page.id + "/history";
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setStatus("");
    try {
      await flush();
      await fn();
    } catch (e) {
      setStatus(message(l, (e as Error).message));
    } finally {
      setBusy(false);
    }
  }
  const load = async () => {
    setVersions(await api(history));
    setSections(await api(base + "/sections"));
  };
  function apply(change: (draft: Draft) => void) {
    const next = structuredClone(d);
    change(next);
    cleanPageReferences(next);
    if (!draftSchema.safeParse(next).success) throw Error("restore_conflict");
    edit((x) => {
      change(x);
      cleanPageReferences(x);
    });
  }
  return (
    <details
      onToggle={(e) => {
        if (e.currentTarget.open) void run(load);
      }}
      className="my-3 rounded-lg border border-ink/15 p-2 text-xs"
    >
      <summary>
        {tr("History & saved sections", "Histórico e seções salvas")}
      </summary>
      <fieldset disabled={busy} className="space-y-2 pt-3">
        <h3>{tr("Page history", "Histórico da página")}</h3>
        {!versions.length && (
          <p>
            {tr(
              "Earlier saved versions appear here.",
              "As versões anteriores aparecem aqui.",
            )}
          </p>
        )}
        {versions.map((v) => (
          <button
            key={v.version}
            className="block underline"
            onClick={() =>
              void run(async () => {
                const { snapshot } = await api<{ snapshot: typeof page }>(
                  history + "/" + v.version,
                );
                if (
                  !confirm(
                    tr(
                      "Restore this page to the draft? Removed library items will be omitted.",
                      "Restaurar esta página no rascunho? Itens removidos da biblioteca serão omitidos.",
                    ),
                  )
                )
                  return;
                apply((x) => {
                  x.pages[x.pages.findIndex((p) => p.id === page.id)] =
                    structuredClone(snapshot);
                });
                await flush();
                await load();
                setStatus(tr("Draft restored.", "Rascunho restaurado."));
              })
            }
          >
            {tr("Restore", "Restaurar")} #{v.version} ·{" "}
            {new Date(v.createdAt).toLocaleString(l)}
          </button>
        ))}
        <h3>{tr("Reusable sections", "Seções reutilizáveis")}</h3>
        <input
          className="w-full rounded border p-1"
          aria-label={tr("Section name", "Nome da seção")}
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="underline"
          disabled={!block || !name.trim()}
          onClick={() =>
            void run(async () => {
              await api(base + "/sections", "POST", {
                page: page.id,
                block: block!.id,
                name,
              });
              setName("");
              await load();
            })
          }
        >
          {tr("Save selected section", "Salvar seção selecionada")}
        </button>
        {sections.map((s) => (
          <div className="flex justify-between gap-2" key={s.id}>
            <button
              className="underline"
              onClick={() =>
                void run(async () => {
                  const { blocks } = await api<{ blocks: Block[] }>(
                    base + "/sections/" + s.id,
                  );
                  const copy = cloneSection(blocks);
                  apply((x) =>
                    x.pages.find((p) => p.id === page.id)!.blocks.push(...copy),
                  );
                  await flush();
                })
              }
            >
              {tr("Insert", "Inserir")} · {s.name}
            </button>
            <button
              aria-label={tr("Delete ", "Excluir ") + s.name}
              onClick={() =>
                void run(async () => {
                  await api(base + "/sections/" + s.id, "DELETE");
                  await load();
                })
              }
            >
              ×
            </button>
          </div>
        ))}
      </fieldset>
      <p role="status">{status}</p>
    </details>
  );
}
