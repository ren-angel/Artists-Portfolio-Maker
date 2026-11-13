import type { ReactNode } from "react";

import { cn } from "./types";

const VARIANTS = {
  primary:
    "bg-coral text-ink shadow-[0_2px_0_0_hsl(var(--ink)/0.12)] hover:-translate-y-0.5 hover:shadow-[0_12px_26px_-14px_hsl(var(--ink)/0.6)]",
  ink: "bg-ink text-paper shadow-[0_2px_0_0_hsl(var(--ink)/0.3)] hover:-translate-y-0.5",
  lilac:
    "bg-lilac text-ink shadow-[0_2px_0_0_hsl(var(--ink)/0.12)] hover:-translate-y-0.5",
  mint: "bg-mint text-ink shadow-[0_2px_0_0_hsl(var(--ink)/0.12)] hover:-translate-y-0.5",
  paper:
    "bg-ivory text-ink border border-ink/15 hover:border-ink/40 hover:-translate-y-0.5",
  ghost:
    "text-ink border border-ink/25 hover:border-ink/70 hover:bg-ink/[0.04]",
  quiet: "text-ink/70 hover:text-ink hover:bg-ink/[0.05]",
};

const SIZES = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-[14px]",
  lg: "h-[52px] px-7 text-[15px]",
};

export default function MButton({
  children,
  variant = "primary",
  size = "md",
  href,
  className,
}: {
  children: ReactNode;
  href: string;
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const classes = cn(
    "group inline-flex select-none items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-45",
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  return (
    <a href={href} className={classes}>
      {children}
    </a>
  );
}
