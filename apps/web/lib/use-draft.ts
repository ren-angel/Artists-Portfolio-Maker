"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Draft } from "@studio/shared";
import { api } from "./client";
export type SiteData = {
  id: string;
  handle: string;
  version: number;
  published: string | null;
  publishedAt: string | null;
  storageUsed?: number;
  draft: Draft;
};
export type Artist = {
  id: string;
  email: string;
  displayName: string;
  avatar: string | null;
  verified: boolean;
};
export type Limits = {
  sites: number;
  pages: number;
  artworks: number;
  storage: number;
  upload: number;
};
export type Update = (change: (draft: Draft) => void) => void;
export function useDraft(initial: SiteData) {
  const [data, setData] = useState(initial),
    [status, setStatus] = useState("saved"),
    [error, setError] = useState("");
  const current = useRef(initial),
    saved = useRef(initial.draft),
    flight = useRef<Promise<void> | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flush = useCallback(async () => {
    if (flight.current) return flight.current;
    const write = async () => {
      while (saved.current !== current.current.draft) {
        const snapshot = current.current.draft;
        setStatus("saving");
        const next = await api<{ version: number }>(
          "/sites/" + initial.id,
          "PUT",
          { version: current.current.version, draft: snapshot },
        );
        current.current = { ...current.current, version: next.version };
        saved.current = snapshot;
        setData(current.current);
      }
      setStatus("saved");
      setError("");
    };
    flight.current = write()
      .catch((err) => {
        setError(err.message);
        setStatus("dirty");
        throw err;
      })
      .finally(() => {
        flight.current = null;
      });
    return flight.current;
  }, [initial.id]);
  const update: Update = (change) => {
    const d = structuredClone(current.current.draft);
    change(d);
    current.current = { ...current.current, draft: d };
    setData(current.current);
    setStatus("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush().catch(() => {}), 700);
  };
  useEffect(() => {
    const prevent = (e: BeforeUnloadEvent) => {
      if (saved.current !== current.current.draft) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", prevent);
    return () => {
      window.removeEventListener("beforeunload", prevent);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  async function reload() {
    const fresh = await api<SiteData>("/sites/" + initial.id);
    current.current = fresh;
    saved.current = fresh.draft;
    setData(fresh);
    setStatus("saved");
    setError("");
  }
  return { data, update, flush, reload, current, status, error };
}
