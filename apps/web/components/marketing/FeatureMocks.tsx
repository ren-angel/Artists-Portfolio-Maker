import { type Common, translator } from "../home/types";
import { Sparkle } from "../home/bits";
import { ART } from "../home/data";
import { cn } from "../home/types";

const BLOCKS = [
  { name: "Hero", tone: "bg-coral/20" },
  { name: "Gallery", tone: "bg-lilac/25" },
  { name: "About", tone: "bg-mint/30" },
  { name: "Featured", tone: "bg-butter/40" },
  { name: "Commissions", tone: "bg-sky/30" },
  { name: "Contact", tone: "bg-clay/20" },
  { name: "Image", tone: "bg-lilac/20" },
  { name: "CTA", tone: "bg-coral/15" },
];

export function BlockPalette(props: Common) {
  const tr = translator(props);
  return (
    <div className="rounded-[1.3rem] border border-ink/12 bg-ivory p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.2em] text-ink/40">{tr("Add a block")}</p>
        <Sparkle size={11} className="text-coral" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {BLOCKS.map((b, i) => (
          <div
            key={tr(b.name)}
            className={cn(
              "group flex items-center gap-2 rounded-xl border border-ink/10 px-2.5 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/30",
              i === 4 && "ring-2 ring-coral/60"
            )}
          >
            <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-md", b.tone)}>
              <span className="h-2 w-2 rounded-sm bg-ink/40" />
            </span>
            <span className="text-[11px] font-medium">{tr(b.name)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GalleryMock(props: Common) {
  const tr = translator(props);
  return (
    <div className="rounded-[1.3rem] border border-ink/12 bg-ivory p-3">
      <div className="grid grid-cols-3 gap-2">
        {[ART.lunaFanart, ART.theoGate, ART.ninaArch, ART.poster, ART.mikaWatercolor, ART.theoChar].map(
          (src, i) => (
            <div
              key={src + i}
              className={cn(
                "overflow-hidden rounded-lg",
                i === 0 ? "col-span-2 row-span-2" : ""
              )}
            >
              <img
                src={src}
                alt=""
                className={cn("w-full object-cover", i === 0 ? "h-full" : "h-[74px]")}
              />
            </div>
          )
        )}
      </div>
      <div className="mt-3 flex items-center justify-between px-1 pb-1">
        <span className="text-[10px] uppercase tracking-[0.18em] text-ink/40">Fanart · 6</span>
        <span className="rounded-full bg-mint px-2 py-[2px] text-[9px] uppercase tracking-wider">{tr("featured")}</span>
      </div>
    </div>
  );
}

export function ThemeMock(props: Common) {
  const tr = translator(props);
  return (
    <div className="rounded-[1.3rem] border border-ink/12 bg-[#FBF6EE] p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-ink/40">{tr("Palette")}</p>
      <div className="mt-2 flex gap-1.5">
        {["#FF7868", "#B6A0F6", "#A6E5CB", "#FFE5A0", "#272438"].map((c) => (
          <span key={c} className="h-8 w-8 rounded-full border border-ink/12" style={{ backgroundColor: c }} />
        ))}
      </div>
      <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-ink/40">{tr("Type pairing")}</p>
      <div className="mt-2 space-y-1.5">
        <div className="flex items-baseline justify-between rounded-lg border border-ink/12 bg-ivory px-3 py-2">
          <span className="font-display text-[17px] font-semibold">Archivo</span>
          <span className="text-[9px] uppercase tracking-widest text-ink/35">{tr("headings")}</span>
        </div>
        <div className="flex items-baseline justify-between rounded-lg border border-ink/12 bg-ivory px-3 py-2">
          <span className="font-serif text-[16px] italic">Instrument Serif</span>
          <span className="text-[9px] uppercase tracking-widest text-ink/35">{tr("accents")}</span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-ink/40">{tr("Corners")}</span>
        <div className="h-1.5 flex-1 rounded-full bg-ink/12">
          <div className="h-1.5 w-3/4 rounded-full bg-coral" />
        </div>
      </div>
    </div>
  );
}
