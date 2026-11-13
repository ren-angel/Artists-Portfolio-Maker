import type { ReactNode } from "react";
import { Sparkle } from "../home/bits";
import { cn } from "../home/types";

/* Ports of Design/src/components/dashboard/PageHeader.jsx and EmptyStudio.jsx
   plus the shared surface classes used across studio screens. */

export const card = "rounded-[1.2rem] border border-ink/10 bg-ivory";
export const pill =
  "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-medium transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50";
export const inkPill = cn(pill, "bg-ink text-paper");
export const coralPill = cn(pill, "bg-coral text-ink shadow-[0_2px_0_0_hsl(var(--ink)/0.12)]");
export const ghostPill = cn(pill, "border border-ink/15 bg-ivory text-ink/70 hover:border-ink/40 hover:text-ink hover:translate-y-0");
export const label = "mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/45";
export const input =
  "w-full rounded-xl border border-ink/15 bg-paper px-3 py-2.5 text-[13.5px] text-ink placeholder:text-ink/30 transition-colors focus:border-ink/50 focus:outline-none";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/35">
              <Sparkle size={9} className="shrink-0 text-coral" />
              {eyebrow}
            </p>
          )}
          <h1 className="mt-2.5 font-display text-[27px] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-[34px]">{title}</h1>
          {subtitle && <p className="mt-2.5 max-w-[540px] text-[13.5px] leading-[1.7] text-ink/50">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="mt-4 h-px w-full bg-ink/10" />
    </div>
  );
}

function Sketch({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 132 104" fill="none" className={className} aria-hidden="true">
      <rect x="8" y="32" width="60" height="60" rx="7" stroke="hsl(var(--ink) / 0.22)" strokeWidth="1.3" strokeDasharray="5 5" />
      <rect x="30" y="16" width="60" height="60" rx="7" fill="hsl(var(--ivory))" stroke="hsl(var(--ink) / 0.3)" strokeWidth="1.3" />
      <path d="M52 60c9-9 15-16 21-25" stroke="hsl(var(--coral))" strokeWidth="2" strokeLinecap="round" />
      <path d="M73 35c3-1.2 5.5-2.4 8-3.6" stroke="hsl(var(--coral))" strokeWidth="2" strokeLinecap="round" />
      <path d="M99 18c.6 5.4 4.3 9 9.6 9.6-5.3.7-9 4.3-9.6 9.6-.6-5.3-4.3-9-9.6-9.6 5.3-.6 9-4.2 9.6-9.6Z" fill="hsl(var(--lilac))" />
      <path d="M14 82c11-6 21 4 31-1" stroke="hsl(var(--ink) / 0.18)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

const TONES = { lilac: "bg-lilac/15", mint: "bg-mint/15", butter: "bg-butter/25", paper: "bg-ivory/70" };

/** Illustrated blank-slate card for empty studio areas. */
export function EmptyStudio({
  title,
  body,
  tone = "paper",
  compact = false,
  className,
  children,
}: {
  title: string;
  body?: string;
  tone?: keyof typeof TONES;
  compact?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col items-center justify-center overflow-hidden rounded-[1.2rem] border border-dashed border-ink/20 text-center transition-colors",
        compact ? "px-4 py-7" : "px-6 py-10",
        TONES[tone],
        className,
      )}
    >
      <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-ivory/60 blur-xl" />
      <Sketch className={cn("relative", compact ? "h-11 w-14" : "h-16 w-20")} />
      <h3 className={cn("relative mt-3 font-display font-semibold tracking-tight text-ink", compact ? "text-[13px]" : "text-[16.5px]")}>{title}</h3>
      {body && <p className={cn("relative mt-1.5 max-w-[260px] leading-relaxed text-ink/50", compact ? "text-[10px]" : "text-[11.5px]")}>{body}</p>}
      {children && <div className="relative mt-3.5">{children}</div>}
    </div>
  );
}
