"use client";
import { useState } from "react";
import { api } from "../../lib/client";
import { message, type Lang } from "../../lib/copy";
type Info = { file: { name: string; bytes: number } | null };
export function ProductFile({
  site,
  entitled,
  page,
  flush,
  l,
}: {
  site: string;
  entitled: boolean;
  page: string;
  flush: () => Promise<void>;
  l: Lang;
}) {
  const tr = (en: string, pt: string) => (l === "en" ? en : pt),
    path = "/sites/" + site + "/products/" + page + "/file";
  const [file, setFile] = useState<Info["file"]>(null),
    [url, setUrl] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await flush();
      await fn();
    } catch (e) {
      setError(message(l, (e as Error).message));
    } finally {
      setBusy(false);
    }
  }
  return (
    <details
      className="px-4 py-2 text-sm"
      onToggle={(e) => {
        if (e.currentTarget.open)
          void run(async () => setFile((await api<Info>(path)).file));
      }}
    >
      <summary>{tr("Private download", "Download privado")}</summary>
      {!entitled && (
        <p>
          {tr(
            "Artist and Studio plans include private wallpaper delivery.",
            "Os planos Artista e Estúdio incluem entrega privada de papéis de parede.",
          )}
        </p>
      )}
      <fieldset disabled={busy} className="space-y-2">
        <p>
          {tr(
            "Upload a wallpaper as JPEG, PNG or WebP. Buyers receive a full-size WebP. For other file types, use your external store.",
            "Envie um papel de parede JPEG, PNG ou WebP. O comprador recebe um WebP no tamanho original. Para outros formatos, use sua loja externa.",
          )}
        </p>
        <input
          aria-label={tr("Private artwork file", "Arquivo de arte privado")}
          disabled={!entitled}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const source = e.target.files?.[0];
            e.target.value = "";
            if (!source) return;
            void run(async () => {
              const response = await fetch("/api" + path, {
                method: "PUT",
                headers: {
                  "x-studio-request": "1",
                  "content-type": "application/octet-stream",
                },
                body: source,
              });
              const data = await response.json();
              if (!response.ok) throw Error(data.error);
              setFile(data.file);
              setUrl("");
            });
          }}
        />
        {file && (
          <>
            <p>
              {file.name} · {Math.ceil(file.bytes / 1024)} KiB
            </p>
            <p>
              {tr(
                "After checking the order in your store, issue a five-minute buyer link. Issuing another link replaces the previous one.",
                "Após conferir o pedido na sua loja, gere um link de cinco minutos para o comprador. Um novo link substitui o anterior.",
              )}
            </p>
            <button
              disabled={!entitled}
              className="underline"
              onClick={() =>
                void run(async () =>
                  setUrl(
                    (await api<{ url: string }>(path + "/grant", "POST")).url,
                  ),
                )
              }
            >
              {tr("Issue buyer link", "Gerar link para o comprador")}
            </button>
            {" · "}
            <button
              onClick={() =>
                void run(async () => {
                  await api(path, "DELETE");
                  setFile(null);
                  setUrl("");
                })
              }
            >
              {tr("Remove private file", "Remover arquivo privado")}
            </button>
          </>
        )}
        {url && (
          <input
            aria-label={tr("Buyer link", "Link do comprador")}
            className="w-full"
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
          />
        )}
      </fieldset>
      <p role="status">{error}</p>
    </details>
  );
}
