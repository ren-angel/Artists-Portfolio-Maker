"use client";
import type { ReactNode } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Sparkle, Squiggle } from "./bits";
import { buttonClasses } from "./Field";

/* After Design/src/components/NotFound.jsx and DefaultCatchBoundary.jsx,
   restyled with the platform's paper surfaces, display type and pills. */
export function Status({
  code,
  title,
  body,
  back,
  home,
  retry,
  onRetry,
  children,
}: {
  code: string;
  title: string;
  body?: string;
  back: string;
  home?: string;
  retry?: string;
  onRetry?: () => void;
  children?: ReactNode;
}) {
  return (
    <main className="ui ui-page u-grain grid min-h-screen place-items-center px-6 py-16">
      <div className="relative z-10 mx-auto flex max-w-lg flex-col items-center text-center">
        <span className="relative grid h-12 w-12 -rotate-6 place-items-center rounded-2xl bg-ink text-paper">
          <Sparkle size={18} />
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-coral ring-2 ring-paper" />
        </span>
        <p className="mt-6 font-display text-[72px] font-semibold leading-none tracking-[-0.05em] sm:text-[96px]">
          {code}
        </p>
        <Squiggle className="mt-2 text-coral" width={120} />
        <h1 className="mt-5 font-display text-[24px] font-semibold tracking-[-0.03em] sm:text-[28px]">{title}</h1>
        {body && <p className="mt-2 max-w-[400px] text-[14px] leading-relaxed text-ink/55">{body}</p>}
        {children}
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => history.back()} className={buttonClasses("paper", "md")}>
            <ArrowLeft className="h-4 w-4" /> {back}
          </button>
          {onRetry && retry && (
            <button type="button" onClick={onRetry} className={buttonClasses("ink", "md")}>
              <RotateCcw className="h-4 w-4" /> {retry}
            </button>
          )}
          {home && (
            <a href="/" className={buttonClasses("ink", "md")}>
              {home}
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
