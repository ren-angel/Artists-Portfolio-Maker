import { type Common, translator } from "./types";
import { Sparkle, Eyebrow } from "../../../shared/ui/bits";

const STEPS = [
  {
    n: "01",
    title: "Pick a starting point",
    body: "Choose one of four art-directed templates. It already looks like a real artist's website, no blank canvas anxiety.",
    tone: "bg-coral",
  },
  {
    n: "02",
    title: "Add your work",
    body: "Drop in your artworks, sort them into galleries, and mark the pieces you're proudest of. Doodallery handles the layout.",
    tone: "bg-lilac",
  },
  {
    n: "03",
    title: "Make it yours",
    body: "Change colours, fonts, corners and captions in the visual editor. Then publish to your own little address.",
    tone: "bg-mint",
  },
];

export default function HowItWorks(props: Common) {
  const tr = translator(props);
  return (
    <section
      id="process"
      className="relative mx-auto max-w-[1240px] px-5 py-20 lg:py-28"
    >
      <div className="max-w-[620px]">
        <Eyebrow>{tr("How it works")}</Eyebrow>
        <h2 className="mt-4 font-display text-[34px] font-semibold leading-[1.03] tracking-[-0.03em] sm:text-[46px]">
          {tr("An afternoon, start to")}
          <span className="font-serif italic text-coral">
            {tr(" published.")}
          </span>
        </h2>
        <p className="mt-4 max-w-[440px] text-[15px] leading-relaxed text-ink/55">
          {tr(
            "No tutorials to watch, no settings to decode. Three steps and your work has somewhere to live.",
          )}
        </p>
      </div>

      <div className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
        <svg
          aria-hidden
          className="pointer-events-none absolute -top-4 left-0 hidden h-12 w-full text-ink/20 md:block"
          viewBox="0 0 1000 40"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M20 30c180-26 340-26 480-2s320 22 480-6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="6 9"
          />
        </svg>

        {STEPS.map((step) => (
          <div key={step.n} className="relative">
            <div className="flex items-baseline gap-4">
              <span className="font-display text-[54px] font-semibold leading-none tracking-[-0.05em] text-ink/15">
                {step.n}
              </span>
              <span className={`h-2.5 w-2.5 rounded-full ${step.tone}`} />
            </div>
            <h3 className="mt-5 font-display text-[21px] font-semibold tracking-tight">
              {tr(step.title)}
            </h3>
            <p className="mt-2.5 max-w-[300px] text-[14px] leading-relaxed text-ink/55">
              {tr(step.body)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-16 flex items-center gap-3 rounded-[1.4rem] border border-ink/10 bg-ivory px-6 py-5">
        <Sparkle size={16} className="shrink-0 text-coral" />
        <p className="text-[13.5px] leading-relaxed text-ink/60">
          <span className="font-medium text-ink">
            {tr("Make room for new ideas.")}
          </span>
          {tr(
            " Edit your draft, every template is swappable, and your artwork stays exactly where you put it.",
          )}
        </p>
      </div>
    </section>
  );
}
