import { cn } from "../lib/cn";

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
      className={cn("group inline-flex items-center gap-2", className)}
      aria-label={name}
    >
      <img
        src="/brand/doodallery-icon.svg"
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 transition-transform duration-500 group-hover:-rotate-12 motion-reduce:transition-none motion-reduce:group-hover:rotate-0"
      />
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
