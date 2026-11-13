import { type Common, translator } from "./types";
import {
  ArrowRight,
  Eye,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Monitor,
  Palette,
  Rocket,
  Smartphone,
  Tablet,
  Type,
  Undo2,
  Redo2,
} from "lucide-react";

import MButton from "./MButton";
import { Eyebrow, Sparkle } from "./bits";
import { ART } from "./data";

const FEATURES = [
  {
    icon: Type,
    title: "Edit the words, not the code",
    body: "Select a section and edit its words beside the live preview.",
  },
  {
    icon: Palette,
    title: "Colours that follow you",
    body: "Set a palette once and every block updates with it.",
  },
  {
    icon: Layers,
    title: "Rearrange like paper",
    body: "Drag sections up and down until the page feels right.",
  },
];

function ToolbarButton({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={`grid h-5 w-5 place-items-center rounded-[5px] ${
        active ? "bg-ink text-paper" : "text-ink/40"
      }`}
    >
      {children}
    </span>
  );
}

export default function EditorShowcase(props: Common) {
  const tr = translator(props);
  return (
    <section id="editor" className="relative overflow-hidden bg-[#F4EEE4]">
      <div className="mx-auto max-w-[1240px] px-5 py-20 lg:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>{tr("The editor")}</Eyebrow>
            <h2 className="mt-4 font-display text-[34px] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[44px]">
              {tr("A design studio that speaks")}
              <span className="font-serif italic text-coral">
                {tr(" artist,")}
              </span>
              {tr(" not developer.")}
            </h2>
            <p className="mt-4 max-w-[380px] text-[15px] leading-relaxed text-ink/60">
              {tr(
                "Drag sections, retype headlines, swap an artwork, change a colour. Everything you touch looks designed, because the template does the hard part for you.",
              )}
            </p>

            <ul className="mt-8 space-y-5">
              {FEATURES.map((f) => (
                <li key={tr(f.title)} className="flex gap-3.5">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink/12 bg-ivory">
                    <f.icon className="h-4 w-4 text-ink/70" />
                  </span>
                  <div>
                    <p className="text-[14.5px] font-medium text-ink">
                      {tr(f.title)}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink/50">
                      {tr(f.body)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <MButton href="/studio" variant="ink" className="mt-9">
              {tr("Try the editor")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </MButton>
          </div>

          {/* editor mock */}
          <div className="relative">
            <div className="pointer-events-none absolute -right-6 -top-6 hidden lg:block">
              <Sparkle size={30} className="text-coral/70" />
            </div>
            <div className="overflow-hidden rounded-[1.4rem] border border-ink/15 bg-ivory shadow-[0_40px_80px_-50px_hsl(var(--ink)/0.7)]">
              <div className="flex items-center gap-3 border-b border-ink/10 bg-[#FBF7F0] px-3 py-2">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-coral/70" />
                  <span className="h-2 w-2 rounded-full bg-butter" />
                  <span className="h-2 w-2 rounded-full bg-mint" />
                </div>
                <span className="text-[10px] font-medium text-ink/60">
                  {tr("lunamori.muralia.com / home")}
                </span>
                <div className="ml-auto hidden items-center gap-2 sm:flex">
                  <Undo2 className="h-3 w-3 text-ink/35" />
                  <Redo2 className="h-3 w-3 text-ink/25" />
                  <div className="flex items-center gap-1 rounded-full border border-ink/12 bg-paper px-1.5 py-1">
                    <ToolbarButton active>
                      <Monitor className="h-3 w-3" />
                    </ToolbarButton>
                    <ToolbarButton>
                      <Tablet className="h-3 w-3" />
                    </ToolbarButton>
                    <ToolbarButton>
                      <Smartphone className="h-3 w-3" />
                    </ToolbarButton>
                  </div>
                  <span className="flex items-center gap-1 rounded-full border border-ink/15 px-2 py-1 text-[9px] text-ink/60">
                    <Eye className="h-2.5 w-2.5" />
                    {tr(" Preview")}
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[9px] font-medium text-paper">
                    <Rocket className="h-2.5 w-2.5" />
                    {tr(" Publish")}
                  </span>
                </div>
              </div>

              <div className="flex">
                <div className="hidden w-12 shrink-0 flex-col items-center gap-4 border-r border-ink/10 bg-[#FBF7F0] py-4 sm:flex">
                  {[LayoutGrid, Type, ImageIcon, Palette, Layers].map(
                    (Icon, i) => (
                      <span
                        key={i}
                        className={`grid h-7 w-7 place-items-center rounded-lg ${
                          i === 0 ? "bg-ink text-paper" : "text-ink/35"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                    ),
                  )}
                </div>

                <div className="relative flex-1 bg-[#EDE6DA] p-4">
                  <div className="mx-auto max-w-[380px]">
                    <div className="overflow-hidden rounded-lg bg-[#FFF4EF] shadow-sm">
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="font-display text-[9px] font-bold">
                          {tr("luna mori")}
                        </span>
                        <span className="text-[6px] uppercase tracking-[0.16em] text-ink/40">
                          {tr("work · about · commissions")}
                        </span>
                      </div>
                      <div className="relative px-3 pb-3">
                        <div className="relative rounded-md ring-2 ring-coral ring-offset-2 ring-offset-[#FFF4EF]">
                          <img
                            src={ART.lunaFanart}
                            alt="Selected artwork block in the editor"
                            className="h-[168px] w-full rounded-md object-cover"
                          />
                          <span className="absolute -top-2.5 left-0 rounded-full bg-coral px-1.5 py-[1px] text-[6px] font-bold uppercase tracking-wider text-white">
                            {tr("Hero block")}
                          </span>
                          <span className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-full border-2 border-white bg-coral" />
                        </div>
                        <p className="mt-3 font-display text-[13px] font-semibold leading-tight">
                          {tr("hi, i'm luna ✦")}
                        </p>
                        <p className="mt-1 text-[6.5px] leading-relaxed text-ink/50">
                          {tr(
                            "illustrator of cheerful characters, fanart and small universes.",
                          )}
                        </p>
                        <div className="mt-2 flex gap-1">
                          <span className="rounded-full bg-[#FF7868] px-2 py-[2px] text-[5.5px] font-bold uppercase text-white">
                            {tr("commissions open")}
                          </span>
                          <span className="rounded-full border border-ink/20 px-2 py-[2px] text-[5.5px] uppercase text-ink/50">
                            {tr("gallery")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className="h-px flex-1 bg-ink/15" />
                      <span className="rounded-full border border-dashed border-ink/35 bg-paper/70 px-2 py-[2px] text-[6px] font-medium uppercase tracking-widest text-ink/45">
                        {tr("+ add section")}
                      </span>
                      <span className="h-px flex-1 bg-ink/15" />
                    </div>
                  </div>
                </div>

                <div className="hidden w-[136px] shrink-0 border-l border-ink/10 bg-[#FBF7F0] p-3 lg:block">
                  <div className="flex gap-2 border-b border-ink/10 pb-2 text-[7px] font-semibold uppercase tracking-wider">
                    <span className="text-ink">{tr("Style")}</span>
                    <span className="text-ink/35">{tr("Content")}</span>
                  </div>
                  <p className="mt-3 text-[6.5px] uppercase tracking-[0.14em] text-ink/40">
                    {tr("Palette")}
                  </p>
                  <div className="mt-1.5 flex gap-1">
                    {["#FF7868", "#B6A0F6", "#A6E5CB", "#FFE5A0"].map((c) => (
                      <span
                        key={c}
                        className="h-4 w-4 rounded-full border border-ink/10"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-[6.5px] uppercase tracking-[0.14em] text-ink/40">
                    {tr("Typeface")}
                  </p>
                  <div className="mt-1.5 rounded border border-ink/12 bg-paper px-1.5 py-1 text-[7px]">
                    {tr("Bricolage Grotesque")}
                  </div>
                  <div className="mt-1.5 rounded border border-ink/12 bg-paper px-1.5 py-1 font-serif text-[7px] italic">
                    {tr("Fraunces Italic")}
                  </div>
                  <p className="mt-3 text-[6.5px] uppercase tracking-[0.14em] text-ink/40">
                    {tr("Corners")}
                  </p>
                  <div className="mt-1.5 h-1 w-full rounded-full bg-ink/15">
                    <div className="h-1 w-2/3 rounded-full bg-coral" />
                  </div>
                  <p className="mt-3 text-[6.5px] uppercase tracking-[0.14em] text-ink/40">
                    {tr("Spacing")}
                  </p>
                  <div className="mt-1.5 h-1 w-full rounded-full bg-ink/15">
                    <div className="h-1 w-1/3 rounded-full bg-lilac" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
