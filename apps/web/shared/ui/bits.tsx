import type { ReactNode } from "react";
type Decoration = { className?: string };
type Label = Decoration & { children: ReactNode };
import { cn } from "../lib/cn";

/** Four-point sparkle used across the brand. */
export function Sparkle({
  className = "",
  size = 18,
}: Decoration & { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 0c.7 6.1 5.2 10.6 12 12-6.8 1.4-11.3 5.9-12 12-.7-6.1-5.2-10.6-12-12C6.8 10.6 11.3 6.1 12 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Loose hand-drawn wave. */
export function Squiggle({
  className = "",
  width = 120,
}: Decoration & { width?: number }) {
  return (
    <svg
      viewBox="0 0 120 16"
      width={width}
      height={(width * 16) / 120}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M2 11c14-8 26 4 40-2s26 6 38-1 26 2 38-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Small uppercase editorial label with a sparkle. */
export function Eyebrow({
  children,
  className,
  tone = "ink",
}: Label & { tone?: "ink" | "coral" | "paper" }) {
  const tones = {
    ink: "text-ink/55",
    coral: "text-coral",
    paper: "text-paper/70",
  };
  return (
    <p
      className={cn(
        "flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em]",
        tones[tone],
        className,
      )}
    >
      <Sparkle size={11} className="shrink-0" />
      {children}
    </p>
  );
}

/** Sticker-style chip, slightly rotated. */
export function Sticker({
  children,
  className,
  tone = "butter",
}: Label & { tone?: "butter" | "coral" | "mint" | "lilac" | "paper" | "ink" }) {
  const tones = {
    butter: "bg-butter text-ink border-ink/15",
    coral: "bg-coral text-ink border-ink/15",
    mint: "bg-mint text-ink border-ink/15",
    lilac: "bg-lilac text-ink border-ink/15",
    paper: "bg-ivory text-ink border-ink/15",
    ink: "bg-ink text-paper border-ink",
  };
  return (
    <span
      className={cn(
        "u-sticker inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Translucent tape strip. */
export function Tape({ children, className }: Label) {
  return (
    <span
      className={cn(
        "inline-block bg-butter/80 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/70 backdrop-blur-[1px]",
        className,
      )}
      style={{ boxShadow: "0 1px 2px hsl(var(--ink) / 0.08)" }}
    >
      {children}
    </span>
  );
}
