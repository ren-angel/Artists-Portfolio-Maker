import { type Common, translator } from "./types";
import { Sparkle } from "../../../shared/ui/bits";

const DISCIPLINES = [
  "Illustrators",
  "Comic artists",
  "Photographers",
  "Concept artists",
  "Character designers",
  "3D artists",
  "Graphic designers",
  "Craftspeople",
];

export default function DisciplineMarquee(props: Common) {
  const tr = translator(props);
  const row = [...DISCIPLINES, ...DISCIPLINES];
  return (
    <div className="relative overflow-hidden border-y border-ink/10 bg-ink py-4 text-paper">
      <div className="flex w-max animate-marquee items-center gap-8 whitespace-nowrap will-change-transform">
        {[0, 1].map((pass) => (
          <div key={pass} className="flex items-center gap-8">
            {row.map((label, i) => (
              <span
                key={`${label}-${i}`}
                aria-hidden={pass !== 0 || i >= DISCIPLINES.length}
                className="flex items-center gap-8"
              >
                <span className="font-display text-[15px] font-medium tracking-tight text-paper/85">
                  {tr(label)}
                </span>
                <Sparkle size={11} className="text-coral" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
