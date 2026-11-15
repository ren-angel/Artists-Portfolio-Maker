import { type Common, translator } from "../home/types";
import {
  BarChart3,
  BookOpen,
  Globe,
  Images,
  Layers,
  Palette,
  Receipt,
  Smartphone,
  Users,
  Wallet,
} from "lucide-react";
import MButton from "../home/MButton";
import { Eyebrow, Sparkle } from "../home/bits";
import { BlockPalette, GalleryMock, ThemeMock } from "./FeatureMocks";

const HERO_FEATURES = [
  {
    eyebrow: "Visual block editor",
    title: "Build a page the way you'd arrange a desk.",
    body: "Arrange galleries, images, text and contact sections on the canvas. Select a section to change its content or move it.",
    Mock: BlockPalette,
  },
  {
    eyebrow: "Galleries",
    title: "Every image gets the frame it deserves.",
    body: "Group your artwork into galleries, choose a cover and feature your favourites on the homepage.",
    Mock: GalleryMock,
    reverse: true,
  },
  {
    eyebrow: "Theme & appearance",
    title: "Change the whole mood in one click.",
    body: "Choose a palette and typeface for your portfolio. Paid plans add more controls for shapes, grids and backgrounds.",
    Mock: ThemeMock,
  },
];

const SMALL = [
  { icon: Layers, title: "Custom pages", body: "Add pages for your bio, links and collections within your plan’s limit." },
  { icon: Images, title: "Artwork library", body: "Keep your images, captions and accessible descriptions together." },
  { icon: Receipt, title: "Commission pages", body: "Artist and Studio · publish types, prices and terms." },
  { icon: Globe, title: "Custom domains", body: "Artist and Studio · connect your address with a DNS checklist." },
  { icon: Smartphone, title: "Responsive by default", body: "Every template has its own mobile composition." },
  { icon: BookOpen, title: "Comic projects", body: "Planned · chapter publishing and a dedicated reader." },
  { icon: Users, title: "Character profiles", body: "Planned · character sheets and relationships." },
  { icon: BarChart3, title: "Portfolio analytics", body: "See visits to your published pages and galleries." },
];

export default function FeatureShowcases(props: Common) {
  const tr = translator(props);
  return (
    <>
      <div className="mx-auto max-w-[1240px] px-5 py-16 lg:py-24">
        <div className="space-y-20 lg:space-y-28">
          {HERO_FEATURES.map((f) => (
            <div
              key={tr(f.title)}
              className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                f.reverse ? "lg:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div>
                <Eyebrow>{tr(f.eyebrow)}</Eyebrow>
                <h2 className="mt-4 max-w-[420px] font-display text-[30px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[38px]">
                  {tr(f.title)}
                </h2>
                <p className="mt-4 max-w-[400px] text-[14.5px] leading-relaxed text-ink/60">{tr(f.body)}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink/35">
                  <Sparkle size={10} className="text-coral" />
                  {tr("Explore the tools")}
                </span>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] bg-lilac/10" />
                <f.Mock {...props} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-y border-ink/10 bg-[#F4EEE4]">
        <div className="mx-auto max-w-[1240px] px-5 py-16 lg:py-20">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Eyebrow>{tr("And the rest")}</Eyebrow>
              <h2 className="mt-4 max-w-[520px] font-display text-[30px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[38px]">
                {tr("All the small things that make a portfolio")}
                <span className="font-serif italic text-coral">{tr(" feel finished.")}</span>
              </h2>
            </div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-ink/35">{tr("Features by plan")}</p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SMALL.map((f) => (
              <div
                key={tr(f.title)}
                className="group rounded-2xl border border-ink/10 bg-paper p-4 transition-all duration-300 hover:-translate-y-1 hover:border-ink/25"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-ivory ring-1 ring-ink/10">
                  <f.icon className="h-4 w-4 text-ink/65" />
                </span>
                <p className="mt-3.5 text-[13.5px] font-medium text-ink">{tr(f.title)}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-ink/50">{tr(f.body)}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-4 rounded-[1.5rem] border border-ink/12 bg-ivory px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex items-center gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-paper">
                <Palette className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-[18px] font-semibold tracking-tight">
                  {tr("Want to see it with your own work?")}
                </p>
                <p className="mt-1 text-[13px] text-ink/50">
                  {tr("Start with the editor and a blank page.")}
                </p>
              </div>
            </div>
            <MButton href="/studio?tab=editor" variant="ink">
              {tr("Open the editor")}
              <Wallet className="h-4 w-4" />
            </MButton>
          </div>
        </div>
      </div>
    </>
  );
}
