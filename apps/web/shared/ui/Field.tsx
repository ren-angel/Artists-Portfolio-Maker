import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { cn } from "../lib/cn";

/* Port of Design/src/components/auth-art/Field.jsx and the reference's
   MButton variants for real buttons (the homepage MButton renders links). */

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const id = useId();
  // The hint describes the control without becoming part of its name.
  const control =
    hint && isValidElement(children)
      ? cloneElement(children as ReactElement<{ "aria-describedby"?: string }>, { "aria-describedby": id })
      : children;
  return (
    <div className={cn("block", className)}>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-ink/45">{label}</span>
        {control}
      </label>
      {hint && (
        <span id={id} className="mt-1.5 block text-[11.5px] text-ink/40">
          {hint}
        </span>
      )}
    </div>
  );
}

export const inputClasses = (extra?: string) =>
  cn(
    "h-12 w-full rounded-xl border border-ink/15 bg-ivory px-4 text-[14px] text-ink placeholder:text-ink/30 transition-colors focus:border-ink/50 focus:outline-none focus:ring-4 focus:ring-coral/15",
    extra,
  );

const VARIANTS = {
  primary:
    "bg-coral text-ink shadow-[0_2px_0_0_hsl(var(--ink)/0.12)] hover:-translate-y-0.5 hover:shadow-[0_12px_26px_-14px_hsl(var(--ink)/0.6)]",
  ink: "bg-ink text-paper shadow-[0_2px_0_0_hsl(var(--ink)/0.3)] hover:-translate-y-0.5",
  paper: "bg-ivory text-ink border border-ink/15 hover:border-ink/40 hover:-translate-y-0.5",
};
const SIZES = { sm: "h-9 px-4 text-[13px]", md: "h-11 px-6 text-[14px]", lg: "h-[52px] px-7 text-[15px]" };

export const buttonClasses = (variant: keyof typeof VARIANTS = "primary", size: keyof typeof SIZES = "md", extra?: string) =>
  cn(
    "group inline-flex select-none items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-45",
    VARIANTS[variant],
    SIZES[size],
    extra,
  );
