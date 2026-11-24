"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Undo2, Redo2, PanelLeft, Rocket, SlidersHorizontal } from "lucide-react";
import { containerChoices, cleanPageReferences, newBlock, type Block, type Draft, type Features } from "@doodallery/shared";
import type { Limits, Update } from "../studio/use-draft";
import { t, type Lang } from "../../shared/lib/copy";
import { reorder } from "../../shared/lib/reorder";
import { Topbar, type Device } from "./Topbar";
import { LeftRail, type RailTab } from "./LeftRail";
import { Canvas } from "./Canvas";
import { Properties } from "./Properties";
import { PublishDialog } from "./PublishDialog";
import { ArtPicker } from "./ArtPicker";
import { blockName } from "./blocks";
import { cn } from "../../shared/lib/cn";

/* Port of Design/src/components/editor/EditorApp.jsx connected to the real
   draft: every control edits, saves, reorders or publishes actual content. */

export type EditorProps = {
  d: Draft;
  update: Update;
  l: Lang;
  site: string;
  brand: string;
  address: string;
  publicHref: string;
  status: string;
  saveError: string;
  published: boolean;
  publishedAt: string | null;
  verified: boolean;
  limits: Limits;
  progress: number | null;
  onPublish: () => Promise<void>;
  onResend: () => Promise<void>;
  onUpload: (files: File[]) => void;
  onPreview: (pageId: string) => void;
  onExit: (tab?: "galleries" | "library" | "pages" | "commissions" | "billing") => void;
  features: Features;
  creativeEnabled?: boolean; flush:()=>Promise<void>;
  /** Page to open first; defaults to the home page. */
  startPage?: string;
};

/** Parts of the draft that undo and redo may restore. Artwork records are
    never restored, because dropping them would delete stored images. */
type Snapshot = Pick<Draft, "pages" | "home" | "theme" | "title" | "description" | "language" | "social">;
const snap = (d: Draft): Snapshot =>
  structuredClone({
    pages: d.pages,
    home: d.home,
    theme: d.theme,
    title: d.title,
    description: d.description,
    language: d.language,
    social: d.social,
  });
function restore(x: Draft, s: Snapshot) {
  Object.assign(x, structuredClone(s));
  cleanPageReferences(x);
}

export function Editor(props: EditorProps) {
  const { d, update, l } = props;
  const [pageId, setPageId] = useState(props.startPage ?? d.home),
    [selected, setSelected] = useState<string | null>(null),
    [tab, setTab] = useState<RailTab>("blocks"),
    [open, setOpen] = useState(true),
    [mode, setMode] = useState<"simple" | "advanced">("simple"),
    [device, setDevice] = useState<Device>(() =>
      typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches ? "mobile" : "desktop",
    ),
    [publishOpen, setPublishOpen] = useState(false),
    [picker, setPicker] = useState(false),
    [sheet, setSheet] = useState<"rail" | "props" | null>(null),
    [, setTick] = useState(0);
  const page = d.pages.find((p) => p.id === pageId) ?? d.pages[0];
  const block = page.blocks.find((b) => b.id === selected) ?? null;

  const past = useRef<Snapshot[]>([]),
    future = useRef<Snapshot[]>([]),
    last = useRef({ key: "", at: 0 }),
    current = useRef(d);
  current.current = d;

  /** Records history (coalescing keystrokes in one field) and saves. */
  const edit = useCallback(
    (change: (x: Draft) => void, key = "") => {
      const now = Date.now();
      if (!key || key !== last.current.key || now - last.current.at > 1200) {
        past.current = [...past.current.slice(-59), snap(current.current)];
        future.current = [];
        setTick((n) => n + 1);
      }
      last.current = { key, at: now };
      update(change);
    },
    [update],
  );
  const travel = useCallback(
    (from: typeof past, to: typeof past) => {
      const s = from.current.at(-1);
      if (!s) return;
      from.current = from.current.slice(0, -1);
      to.current = [...to.current, snap(current.current)];
      last.current = { key: "", at: 0 };
      setTick((n) => n + 1);
      update((x) => restore(x, s));
    },
    [update],
  );
  const undo = () => travel(past, future);
  const redo = () => travel(future, past);

  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest("input, textarea, select, [contenteditable]");
      if (typing || !(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        travel(past, future);
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        travel(future, past);
      }
    };
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  }, [travel]);

  // Keep the selection valid when undo or another change removes a page.
  useEffect(() => {
    if (!d.pages.some((p) => p.id === pageId)) setPageId(d.home);
  }, [d.pages, d.home, pageId]);

  const editPage = (fn: (p: Draft["pages"][number]) => void, key?: string) =>
    edit((x) => fn(x.pages.find((p) => p.id === page.id)!), key);
  const patch = (v: Partial<Block>, key?: string) =>
    selected &&
    editPage((p) => Object.assign(p.blocks.find((k) => k.id === selected)!, v), key ? selected + key : undefined);

  const addBlock = (type: Block["type"], init: Partial<Block> = {}) => {
    const added = { ...newBlock(type), ...init };
    editPage((p) => {
      if (block?.type==="columns" && containerChoices([...p.blocks,added],added).some(parent=>parent.id===block.id)) added.parentId=block.id;
      else if (block?.parentId) added.parentId=block.parentId;
      const at = p.blocks.findIndex((k) => k.id === selected);
      p.blocks.splice(at < 0 ? p.blocks.length : at + 1, 0, added);
    });
    setSelected(added.id);
    setSheet(null);
  };
  const addPage = () => {
    const id = crypto.randomUUID();
    edit((x) =>
      x.pages.push({
        id,
        slug: "page-" + id.slice(0, 6),
        title: t(l, "newPage"),
        inNav: true,
        blocks: [{ ...newBlock("heading"), heading: t(l, "newPage") }],
      }),
    );
    setPageId(id);
    setSelected(null);
  };
  const choosePage = (id: string) => {
    setPageId(id);
    setSelected(null);
  };
  const move = (from: number, to: number) => editPage((p) => reorder(p.blocks, from, to));
  const remove = (id: string) => {
    if (!confirm(t(l, "deleteAsk"))) return;
    editPage((p) => {
      for (const b of p.blocks) if (b.parentId === id) b.parentId = p.blocks.find(k=>k.id===id)?.parentId;
      p.blocks = p.blocks.filter((k) => k.id !== id);
    });
    setSelected(null);
  };
  const toggle = (id: string) =>
    editPage((p) => {
      const b = p.blocks.find((k) => k.id === id)!;
      b.visible = !b.visible;
    });
  const select = (id: string | null) => {
    setSelected(id);
    if (id && window.matchMedia("(max-width: 1279px)").matches) setSheet("props");
  };

  const rail = (
    <LeftRail
      {...props}
      tab={tab}
      setTab={setTab}
      open={open}
      setOpen={setOpen}
      page={page}
      selected={selected}
      block={block}
      onSelect={(id) => {
        setSelected(id);
        setSheet(null);
      }}
      onPage={choosePage}
      onAddPage={addPage}
      onAdd={addBlock}
      onMove={move}
      onToggle={toggle}
      onPatch={patch}
      edit={edit}
    />
  );
  const properties = (
    <Properties
      {...props}
      update={edit}
      block={block}
      page={page}
      mode={mode}
      setMode={setMode}
      patch={patch}
      onRemove={remove}
      onPick={() => setPicker(true)}
      onClose={() => setSheet(null)}
    />
  );

  return (
    <div className="ui flex h-dvh flex-col overflow-hidden bg-paper">
      <Topbar
        {...props}
        page={page}
        device={device}
        setDevice={setDevice}
        canUndo={past.current.length > 0}
        canRedo={future.current.length > 0}
        onUndo={undo}
        onRedo={redo}
        onPage={choosePage}
        onPublishOpen={() => setPublishOpen(true)}
      />
      <div className="flex min-h-0 flex-1">
        <div className="hidden md:flex">{rail}</div>
        <Canvas
          {...props}
          page={page}
          device={device}
          selected={selected}
          onSelect={select}
          onAddSection={() => {
            setTab("blocks");
            setOpen(true);
            if (window.matchMedia("(max-width: 767px)").matches) setSheet("rail");
          }}
        />
        <aside className="hidden w-[268px] shrink-0 flex-col border-l border-ink/10 bg-ivory xl:flex">{properties}</aside>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-ink/10 bg-ivory px-3 py-2 md:hidden">
        <button
          type="button"
          onClick={() => setSheet("rail")}
          aria-label={t(l, "blocks")}
          className="grid h-8 w-8 place-items-center rounded-lg border border-ink/12 text-ink/60"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
        <span className="min-w-0 flex-1 truncate text-[10px] uppercase tracking-[0.16em] text-ink/40">
          {block ? t(l, "editing") + " " + blockName(l, block.type) : t(l, "selectSection")}
        </span>
        <div className="flex gap-1 sm:hidden">
          <button type="button" onClick={undo} disabled={!past.current.length} aria-label={t(l,"undo")} className="p-2 disabled:opacity-30"><Undo2 className="h-4 w-4" /></button>
          <button type="button" onClick={redo} disabled={!future.current.length} aria-label={t(l,"redo")} className="p-2 disabled:opacity-30"><Redo2 className="h-4 w-4" /></button>
          <button type="button" onClick={() => props.onPreview(page.id)} aria-label={t(l,"preview")} className="p-2"><Eye className="h-4 w-4" /></button>
        </div>
        <button
          type="button"
          onClick={() => setPublishOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-coral px-3 py-1.5 text-[11px] font-medium text-ink"
        >
          <Rocket className="h-3 w-3" /> {t(l, "publish")}
        </button>
      </div>
      {block && sheet !== "props" && (
        <button
          type="button"
          onClick={() => setSheet("props")}
          className="fixed bottom-16 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[12px] font-medium text-paper shadow-[0_12px_30px_-12px_hsl(var(--ink)/0.7)] md:bottom-6 xl:hidden"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> {t(l, "properties")}
        </button>
      )}

      {sheet && (
        <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label={t(l, "cancel")}
            className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
            onClick={() => setSheet(null)}
          />
          <div
            className={cn(
              "u-pop absolute bottom-0 top-0 flex max-w-[92vw] flex-col bg-ivory shadow-2xl",
              sheet === "rail" ? "left-0" : "right-0 w-[300px]",
            )}
          >
            {sheet === "rail" ? <div className="flex h-full">{rail}</div> : properties}
          </div>
        </div>
      )}

      <PublishDialog {...props} open={publishOpen} onClose={() => setPublishOpen(false)} />
      <ArtPicker
        {...props}
        open={picker}
        current={block?.artId ?? null}
        onClose={() => setPicker(false)}
        onPick={(id) => {
          patch({ artId: id });
          setPicker(false);
        }}
      />
    </div>
  );
}
