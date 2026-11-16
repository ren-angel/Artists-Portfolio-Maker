"use client";
import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import type { Draft } from "@studio/shared";
import { t } from "../../shared/lib/copy";
import { Portfolio } from "../../entities/portfolio/Portfolio";
import { blockName } from "./blocks";
import { cn } from "../../shared/lib/cn";
import type { Device } from "./Topbar";
import type { EditorProps } from "./Editor";

/* Port of Design/src/components/editor/EditorCanvas.jsx. The reference drew a
   miniature mock; here the real template renders at a device width and is
   scaled to the frame, so breakpoints and content match the public page. */

const FRAME = { desktop: "w-full", tablet: "w-[720px] max-w-full", mobile: "w-[378px] max-w-full" };
const VIRTUAL = { desktop: 1280, tablet: 768, mobile: 390 };

export function Canvas({
  d,
  l,
  site,
  brand,
  features,
  address,
  page,
  device,
  selected,
  onSelect,
  onAddSection,
}: EditorProps & {
  page: Draft["pages"][number];
  device: Device;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onAddSection: () => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const virtual = VIRTUAL[device];
  const zoom = width ? Math.min(1, width / virtual) : 0;

  // Bring the selected section into view when it is chosen from a panel.
  useEffect(() => {
    if (!selected) return;
    frame.current?.querySelector(`[data-block="${selected}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected]);

  return (
    <div className="min-w-0 flex-1 overflow-y-auto bg-[#E7E0D3] px-4 py-6 sm:px-8" onClick={() => onSelect(null)}>
      <div className={cn("mx-auto transition-all duration-500", FRAME[device])}>
        <div className="mb-2 flex items-center justify-between gap-3 text-[10px] text-ink/40">
          <span className="truncate font-mono">{address}</span>
          <span className="shrink-0 uppercase tracking-[0.18em]">{t(l, device)}</span>
        </div>

        <div ref={frame} className="overflow-hidden rounded-xl bg-ivory shadow-[0_30px_70px_-40px_hsl(var(--ink)/0.7)]">
          {zoom > 0 && (
            <div style={{ width: virtual, zoom }}>
              <Portfolio
                draft={d}
                site={site}
                brand={brand}
                branding={!features.removeBranding}
                base="/preview"
                path={page.id === d.home ? [] : [page.slug]}
                selectBlock={(id) => onSelect(id)}
                selected={selected ?? undefined}
                blockLabel={(b) => blockName(l, b.type)}
                emptyLabel={t(l, "emptySection")}
              />
            </div>
          )}
          {page.blocks.length === 0 && (
            <p className="px-6 py-16 text-center text-[12px] text-ink/45">{t(l, "emptySection")}</p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddSection();
            }}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-ink/30 bg-ivory/60 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-ink/45 hover:border-ink/60 hover:text-ink"
          >
            <Plus className="h-3 w-3" /> {t(l, "addSection")}
          </button>
        </div>
      </div>
    </div>
  );
}
