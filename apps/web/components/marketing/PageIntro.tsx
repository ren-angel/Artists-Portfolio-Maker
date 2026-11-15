import type { ReactNode } from "react";
import { Eyebrow, Sparkle } from "../home/bits";
import { cn } from "../home/types";

export default function PageIntro({ eyebrow, title, subtitle, children, tone = "paper" }: {eyebrow: string; title: ReactNode; subtitle: string; children?: ReactNode; tone?: string}) {
  return (
    <section
      className={cn(
        "u-grain relative overflow-hidden border-b border-ink/10",
        tone === "paper" ? "bg-paper" : "bg-[#FBF6EE]"
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-16 h-64 w-64 rounded-full bg-lilac/25 blur-[80px]" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-mint/20 blur-[80px]" />
      </div>
      <div className="relative mx-auto max-w-[1240px] px-5 pb-14 pt-14 lg:pb-20 lg:pt-20">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-5 max-w-[900px] font-display text-[38px] font-semibold leading-[0.98] tracking-[-0.035em] sm:text-[54px] lg:text-[62px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-6 max-w-[540px] text-[15.5px] leading-relaxed text-ink/60">{subtitle}</p>
        )}
        {children}
        <Sparkle size={16} className="absolute bottom-8 right-8 hidden text-coral/60 lg:block" />
      </div>
    </section>
  );
}
