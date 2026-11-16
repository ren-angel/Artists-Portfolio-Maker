"use client";
import { useEffect, useState } from "react";
import { artCategories, type DirectoryArtist } from "@studio/shared";
import { api } from "../../shared/lib/client";
import type { Lang } from "../../shared/lib/copy";
export function ArtistDirectory({
  query,
  lang,
}: {
  query: string;
  lang: Lang;
}) {
  const [category, setCategory] = useState(""),
    [offset, setOffset] = useState(0);
  const [list, setList] = useState<{
      artists: DirectoryArtist[];
      more: boolean;
    } | null>(null),
    [error, setError] = useState(false);
  const en = lang === "en";
  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      api<NonNullable<typeof list>>(
        "/discover/artists?" +
          new URLSearchParams({ q: query, category, offset: String(offset) }),
      ).then(
        (r) => {
          if (active) {
            setList(r);
            setError(false);
          }
        },
        () => {
          if (active) setError(true);
        },
      );
    }, 180);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [query, category, offset]);
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl">
        {en ? "Artist directory" : "Diretório de artistas"}
      </h2>
      <select
        className="my-3 rounded-full border px-3 py-2 text-sm"
        aria-label={en ? "Artist category" : "Categoria do artista"}
        value={category}
        onChange={(e) => {
          setCategory(e.target.value);
          setOffset(0);
          setList(null);
        }}
      >
        <option value="">{en ? "All disciplines" : "Todas as áreas"}</option>
        {Object.entries(artCategories).map(([k, v]) => (
          <option key={k} value={k}>
            {v[en ? 0 : 1]}
          </option>
        ))}
      </select>
      {error ? (
        <p role="status">
          {en ? "Directory unavailable." : "Diretório indisponível."}
        </p>
      ) : !list ? (
        <p role="status">…</p>
      ) : !list.artists.length ? (
        <p>
          {en
            ? "No artists listed for this search."
            : "Nenhum artista listado para esta busca."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {list.artists.map((a) => (
            <a
              className="rounded-xl border p-3"
              key={a.handle}
              href={"/site/" + a.handle}
            >
              {a.thumbnail && (
                <img
                  src={a.thumbnail}
                  alt=""
                  loading="lazy"
                  className="mb-2 aspect-video w-full rounded-lg object-cover"
                />
              )}
              <strong>{a.name}</strong>
              <p>
                {a.category && artCategories[a.category][en ? 0 : 1]} {a.tags}
              </p>
            </a>
          ))}
        </div>
      )}
      <div className="mt-3 flex gap-3">
        {offset > 0 && (
          <button
            onClick={() => {
              setList(null);
              setOffset(offset - 24);
            }}
          >
            {en ? "Previous" : "Anterior"}
          </button>
        )}
        {list?.more && (
          <button
            onClick={() => {
              setList(null);
              setOffset(offset + 24);
            }}
          >
            {en ? "Next" : "Próxima"}
          </button>
        )}
      </div>
    </section>
  );
}
