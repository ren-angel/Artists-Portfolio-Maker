import { type Common, translator } from "./types";
import { Eyebrow, Sparkle, Tape } from "../../../shared/ui/bits";
import { cn } from "./types";

const QUOTES = [
  {
    quote:
      "I'd been meaning to build a proper portfolio for three years. Doodallery took an evening, and it still looks like my work, not like a template.",
    name: "Luna Mori",
    role: "Illustrator · 84 works",
    tone: "bg-ivory",
    rotate: "-rotate-1",
  },
  {
    quote:
      "The commission page alone saved me. Clients arrive already knowing my prices and terms, so the conversation starts at yes.",
    name: "Theo Vale",
    role: "Concept artist",
    tone: "bg-[#F4EEE4]",
    rotate: "rotate-1",
  },
  {
    quote:
      "It feels like a printed artbook that happens to live on the internet. My readers actually scroll through chapters now.",
    name: "Mika Sora",
    role: "Comic creator",
    tone: "bg-ivory",
    rotate: "-rotate-[0.6deg]",
  },
];

export default function Testimonials(props: Common) {
  const tr = translator(props);
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-20 lg:py-28">
      <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <Eyebrow>{tr("From the studio")}</Eyebrow>
          <h2 className="mt-4 max-w-[560px] font-display text-[34px] font-semibold leading-[1.03] tracking-[-0.03em] sm:text-[44px]">
            {tr("Artists who stopped")}
            <span className="font-serif italic text-coral">
              {tr(" postponing their website.")}
            </span>
          </h2>
        </div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink/35">
          {tr("Fictional demo quotes")}
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {QUOTES.map((q) => (
          <figure
            key={q.name}
            className={cn(
              "relative rounded-[1.3rem] border border-ink/10 p-6 transition-transform duration-500 hover:rotate-0 hover:-translate-y-1",
              q.tone,
              q.rotate,
            )}
          >
            <Tape className="absolute -top-2.5 left-6 bg-mint/80">
              {tr(q.role.split(" · ")[0])}
            </Tape>
            <Sparkle size={13} className="text-coral" />
            <blockquote className="mt-4 font-serif text-[18px] leading-[1.45] text-ink/85">
              “{tr(q.quote)}”
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-2.5 border-t border-ink/10 pt-4">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-[10px] font-semibold text-paper">
                {q.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
              <div>
                <p className="text-[12.5px] font-medium text-ink">{q.name}</p>
                <p className="text-[11px] text-ink/45">{tr(q.role)}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
