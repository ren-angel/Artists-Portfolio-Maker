"use client";
import { useState } from "react";
import { Check, ChevronDown, Eye, Monitor, Redo2, Rocket, Smartphone, Tablet, Undo2 } from "lucide-react";
import type { Draft } from "@studio/shared";
import { t, message } from "../../../lib/copy";
import { Sparkle } from "../../home/bits";
import { cn } from "../../home/types";
import type { EditorProps } from "./Editor";

export type Device = "desktop" | "tablet" | "mobile";
const VIEWPORTS = [
  { id: "desktop", icon: Monitor },
  { id: "tablet", icon: Tablet },
  { id: "mobile", icon: Smartphone },
] as const;

export function Topbar({
  d,
  l,
  status,
  saveError,
  page,
  device,
  setDevice,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onPage,
  onPreview,
  onExit,
  onPublishOpen,
}: EditorProps & {
  page: Draft["pages"][number];
  device: Device;
  setDevice: (d: Device) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onPage: (id: string) => void;
  onPublishOpen: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const state = saveError ? "error" : status;
  return (
    <header className="relative z-40 flex h-14 shrink-0 items-center gap-3 border-b border-ink/10 bg-ivory px-3 sm:px-4">
      <button
        type="button"
        onClick={() => onExit()}
        className="flex items-center gap-2"
        aria-label={t(l, "backStudio")}
        title={t(l, "backStudio")}
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-paper transition-transform hover:-rotate-12">
          <Sparkle size={12} />
        </span>
      </button>

      <div className="relative min-w-0">
        <button
          type="button"
          onClick={() => setMenu((v) => !v)}
          aria-expanded={menu}
          aria-haspopup="listbox"
          className="flex min-w-0 items-center gap-2 rounded-lg px-1 py-1 hover:bg-ink/[0.04]"
        >
          <span className="hidden max-w-[160px] truncate text-[13px] font-medium sm:inline">{d.title}</span>
          <ChevronDown className={cn("hidden h-3 w-3 text-ink/35 transition-transform sm:block", menu && "rotate-180")} />
          <span className="max-w-[120px] truncate rounded-md bg-ink/[0.06] px-2 py-1 text-[11px] text-ink/55 sm:ml-1">
            {page.title}
          </span>
        </button>
        {menu && (
          <>
            <button type="button" aria-hidden="true" tabIndex={-1} className="fixed inset-0 z-10 cursor-default" onClick={() => setMenu(false)} />
            <div role="listbox" className="u-pop absolute left-0 top-[calc(100%+6px)] z-20 w-60 rounded-[1.1rem] border border-ink/10 bg-ivory p-1.5 shadow-[0_24px_48px_-24px_hsl(var(--ink)/0.45)]">
              <p className="px-2 pb-1 pt-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-ink/35">{t(l, "pages")}</p>
              {d.pages.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="option"
                  aria-selected={p.id === page.id}
                  onClick={() => {
                    onPage(p.id);
                    setMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[12px] hover:bg-ink/[0.04]"
                >
                  <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", p.id === d.home ? "bg-coral" : p.inNav ? "bg-mint" : "bg-ink/20")} />
                  <span className="flex-1 truncate">{p.title}</span>
                  <span className="font-mono text-[9.5px] text-ink/30">/{p.id === d.home ? "" : p.slug}</span>
                  {p.id === page.id && <Check className="h-3 w-3 text-coral" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="ml-1 flex min-w-0 items-center gap-1.5 text-[10.5px] text-ink/40" role="status">
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            state === "saved" ? "bg-mint" : state === "error" ? "bg-coral" : "bg-butter",
          )}
        />
        <span className="hidden truncate md:inline">
          {state === "error" ? message(l, saveError) : t(l, state === "saved" ? "allSaved" : state === "saving" ? "saving" : "dirty")}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-1 rounded-lg border border-ink/12 bg-paper p-0.5 sm:flex">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title={t(l, "undo") + " (Ctrl+Z)"}
            aria-label={t(l, "undo")}
            className="grid h-7 w-7 place-items-center rounded-md text-ink/60 hover:bg-ink/[0.05] hover:text-ink disabled:text-ink/25 disabled:hover:bg-transparent"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title={t(l, "redo") + " (Ctrl+Shift+Z)"}
            aria-label={t(l, "redo")}
            className="grid h-7 w-7 place-items-center rounded-md text-ink/60 hover:bg-ink/[0.05] hover:text-ink disabled:text-ink/25 disabled:hover:bg-transparent"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-0.5 rounded-lg border border-ink/12 bg-paper p-0.5" role="radiogroup" aria-label={t(l, "viewport")}>
          {VIEWPORTS.map((v) => (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={device === v.id}
              onClick={() => setDevice(v.id)}
              aria-label={t(l, v.id)}
              title={t(l, v.id)}
              className={cn(
                "grid h-7 w-7 place-items-center rounded-md transition-colors",
                device === v.id ? "bg-ink text-paper" : "text-ink/40 hover:text-ink",
              )}
            >
              <v.icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onPreview(page.id)}
          className="hidden items-center gap-1.5 rounded-full border border-ink/15 px-3.5 py-2 text-[12px] font-medium text-ink/65 hover:border-ink/40 hover:text-ink sm:flex"
        >
          <Eye className="h-3.5 w-3.5" /> {t(l, "preview")}
        </button>

        <button
          type="button"
          onClick={onPublishOpen}
          className="hidden items-center gap-1.5 rounded-full bg-coral px-4 py-2 text-[12px] font-medium text-ink shadow-[0_2px_0_0_hsl(var(--ink)/0.12)] transition-transform hover:-translate-y-0.5 md:inline-flex"
        >
          <Rocket className="h-3.5 w-3.5" /> {t(l, "publish")}
        </button>
      </div>
    </header>
  );
}
