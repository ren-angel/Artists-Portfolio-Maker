import { Sparkle } from "./bits";
import { cn } from "./types";

export default function Logo({
  name,
  className,
  tone = "ink",
}: {
  name: string;
  className?: string;
  tone?: "ink" | "paper";
}) {
  return (
    <a
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label={name}
    >
      <span className="relative grid h-9 w-9 place-items-center rounded-[0.9rem] bg-ink text-paper transition-transform duration-500 group-hover:-rotate-12">
        <Sparkle size={15} />
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-coral ring-2 ring-paper" />
      </span>
      <span
        className={cn(
          "font-display text-[22px] font-semibold leading-none tracking-[-0.03em]",
          tone === "paper" ? "text-paper" : "text-ink",
        )}
      >
        {name}
      </span>
    </a>
  );
}
