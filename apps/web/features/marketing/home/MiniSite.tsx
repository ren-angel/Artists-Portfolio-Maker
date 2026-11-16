import { type Common, translator } from "./types";
import { Sparkle } from "../../../shared/ui/bits";
import { cn } from "./types";
import { placeholderArt } from "../../../shared/lib/placeholder";

const THEMES = {
  creative: {
    shell: "bg-[#FFF4EF] text-[#272438] border-[#272438]/10",
    bar: "bg-white/60 border-[#272438]/10",
    domain: "lunamori.muralia.com",
  },
  gallery: {
    shell: "bg-[#FFFDF8] text-[#272438] border-[#272438]/10",
    bar: "bg-[#F6F2EA] border-[#272438]/10",
    domain: "ninaflores.muralia.com",
  },
  showcase: {
    shell: "bg-[#141320] text-[#F2EDE4] border-white/10",
    bar: "bg-white/[0.06] border-white/10",
    domain: "theovale.muralia.com",
  },
  story: {
    shell: "bg-[#F8F0E3] text-[#6B5442] border-[#6B5442]/20",
    bar: "bg-[#EFE3D2] border-[#6B5442]/20",
    domain: "mikasora.muralia.com",
  },
};

/** A miniature artist website, used decoratively across the marketing site. */
export default function MiniSite({
  theme = "creative",
  className,
  lang,
  domain,
}: Common & { theme?: keyof typeof THEMES; className?: string }) {
  const tr = translator({ lang, domain });
  const t = THEMES[theme];
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[14px] border shadow-[0_30px_60px_-34px_hsl(var(--ink)/0.6)]",
        t.shell,
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1 border-b px-2.5 py-[6px]",
          t.bar,
        )}
      >
        <span className="flex gap-[3px]">
          <span className="h-[4px] w-[4px] rounded-full bg-current opacity-25" />
          <span className="h-[4px] w-[4px] rounded-full bg-current opacity-25" />
          <span className="h-[4px] w-[4px] rounded-full bg-current opacity-25" />
        </span>
        <span className="ml-auto font-mono text-[7px] tracking-tight opacity-40">
          {t.domain.replace("muralia.com", domain)}
        </span>
      </div>

      <div className="p-2.5">
        {theme === "creative" && (
          <>
            <div className="flex items-center justify-between">
              <span className="font-display text-[11px] font-bold tracking-tight">
                {tr("luna mori")}
              </span>
              <span className="text-[6.5px] uppercase tracking-[0.16em] opacity-50">
                {tr("work · about")}
              </span>
            </div>
            <div className="mt-2 overflow-hidden rounded-[9px]">
              <img src={placeholderArt(lang)} alt="" className="h-[112px] w-full object-cover" />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="rounded-full bg-[#FF7868] px-2 py-[3px] text-[6.5px] font-bold uppercase tracking-[0.12em] text-white">
                {tr("fanart")}
              </span>
              <Sparkle size={9} className="text-[#B6A0F6]" />
            </div>
          </>
        )}

        {theme === "gallery" && (
          <>
            <p className="text-center font-editorial text-[13px] tracking-[0.16em]">
              {tr("NINA FLORES")}
            </p>
            <p className="mt-0.5 text-center text-[6px] uppercase tracking-[0.3em] opacity-45">
              {tr("work · about")}
            </p>
            <div className="mt-2.5 overflow-hidden">
              <img src={placeholderArt(lang)} alt="" className="h-[118px] w-full object-cover" />
            </div>
            <div className="mt-1.5 flex justify-between text-[6px] uppercase tracking-[0.18em] opacity-45">
              <span>{tr("Dried grass, 2026")}</span>
              <span>01 / 12</span>
            </div>
          </>
        )}

        {theme === "showcase" && (
          <>
            <div className="flex items-center justify-between">
              <span className="font-showcase text-[9px] font-extrabold uppercase tracking-[0.2em]">
                {tr("THEO VALE")}
              </span>
              <span className="h-1 w-1 rounded-full bg-[#E0A45C]" />
            </div>
            <div className="relative mt-2 overflow-hidden rounded-[6px]">
              <img src={placeholderArt(lang)} alt="" className="h-[124px] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              <div className="absolute inset-x-2 bottom-1.5">
                <p className="font-showcase text-[8px] font-bold uppercase tracking-[0.14em] text-white">
                  {tr("THE GATE AT DAWN")}
                </p>
                <p className="text-[5.5px] uppercase tracking-[0.24em] text-[#E0A45C]">
                  {tr("worldbuilding · 2026")}
                </p>
              </div>
            </div>
          </>
        )}

        {theme === "story" && (
          <>
            <p className="text-center font-story text-[15px] italic leading-none">
              {tr("Mika Sora")}
            </p>
            <div className="mx-auto mt-1 h-px w-7 bg-current opacity-25" />
            <div className="mt-2 rounded-[3px] border border-current/20 bg-[#FFFBF3] p-[3px]">
              <img src={placeholderArt(lang)} alt="" className="h-[96px] w-full object-cover" />
            </div>
            <p className="mt-1.5 text-center font-story text-[7.5px] italic opacity-70">
              {tr("chapter one, the town that keeps the lights on")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
