"use client";
import { type Common, translator } from "./types";
import { Language } from "../Language";
import { useEffect, useState } from "react";

import { Menu, X, Sparkles } from "lucide-react";
import Logo from "./Logo";
import MButton from "./MButton";
import { cn } from "./types";

const NAV = [
  { label: "Explore", to: "/explore" },
  { label: "Templates", to: "/templates" },
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
];

export default function SiteHeader({ lang, name, active }: Common & {active?: string}) {
  const tr = translator({ lang, name });
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      <div
        className={cn(
          "transition-all duration-500",
          scrolled
            ? "border-b border-ink/10 bg-paper/85 backdrop-blur-xl"
            : "border-b border-transparent",
        )}
      >
        <div className="mx-auto flex h-[74px] max-w-[1240px] items-center gap-6 px-5">
          <Logo name={name} />

          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <a
                key={item.to}
                aria-current={active === item.to ? "page" : undefined}
                href={item.to}
                className="relative rounded-full px-3.5 py-2 text-[14px] text-ink/70 transition-colors duration-200 hover:text-ink"
              >
                {tr(item.label)}
                {active === item.to && <span aria-hidden className="hidden lg:block absolute inset-x-3.5 -bottom-0.5 h-[2px] rounded-full bg-coral" />}
              </a>
            ))}
          </nav>

          <div className="home-language ml-auto flex items-center gap-2">
            <Language lang={lang} />
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <a
              href="/auth/login"
              className="rounded-full px-4 py-2 text-[14px] text-ink/70 transition-colors hover:bg-ink/[0.05] hover:text-ink"
            >
              {tr("Sign in")}
            </a>
            <MButton href="/auth/register" size="sm" className="gap-1.5">
              {tr("Start creating")}
              <Sparkles className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-12" />
            </MButton>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={tr(open ? "Close menu" : "Open menu")}
            aria-expanded={open}
            className="grid h-10 w-10 place-items-center rounded-full border border-ink/15 text-ink lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-b border-ink/10 bg-paper px-5 pb-6 pt-2 lg:hidden">
          <nav className="flex flex-col">
            {NAV.map((item) => (
              <a
                key={item.to}
                aria-current={active === item.to ? "page" : undefined}
                href={item.to}
                onClick={() => setOpen(false)}
                className="border-b border-ink/[0.07] py-3.5 font-display text-lg text-ink"
              >
                {tr(item.label)}
                {active === item.to && <span aria-hidden className="hidden lg:block absolute inset-x-3.5 -bottom-0.5 h-[2px] rounded-full bg-coral" />}
              </a>
            ))}
            <a
              href="/auth/login"
              className="border-b border-ink/[0.07] py-3.5 font-display text-lg text-ink"
            >
              {tr("Sign in")}
            </a>
          </nav>
          <MButton href="/auth/register" className="mt-5 w-full">
            {tr("Start creating")}
          </MButton>
        </div>
      )}
    </header>
  );
}
