import { type Common, translator } from "./types";
import { ArrowRight } from "lucide-react";

import { TEMPLATES } from "./data";
import { Eyebrow } from "./bits";

export default function TemplatesSection(props: Common) {
  const tr = translator(props);
  return (
    <section id="templates" className="border-y border-ink/10 bg-ivory/70">
      <div className="mx-auto max-w-[1240px] px-5 py-20 lg:py-28">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>{tr("Starting points")}</Eyebrow>
            <h2 className="mt-4 max-w-[520px] font-display text-[34px] font-semibold leading-[1.03] tracking-[-0.03em] sm:text-[46px]">
              {tr("Four templates, built to be")}
              <span className="font-serif italic text-ink/60">
                {tr(" completely rearranged.")}
              </span>
            </h2>
          </div>
          <a
            href="/templates"
            className="group inline-flex items-center gap-2 self-start rounded-full border border-ink/25 px-5 py-2.5 text-[13.5px] font-medium transition-colors hover:border-ink/60 sm:self-auto"
          >
            {tr("See the full collection")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        <div
          id="template-collection"
          className="mt-12 grid gap-5 sm:grid-cols-2"
        >
          {TEMPLATES.map((tpl, i) => (
            <a
              key={tpl.id}
              href={tpl.href}
              className="group relative overflow-hidden rounded-[1.5rem] border border-ink/10 bg-paper p-3 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-40px_hsl(var(--ink)/0.6)]"
            >
              <div className="relative overflow-hidden rounded-[1.1rem] aspect-[16/11]">
                <img
                  src={tpl.preview}
                  alt={tr("Template") + " " + tpl.name}
                  className="h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <span className="absolute left-3 top-3 rounded-full bg-paper/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink backdrop-blur">
                  0{i + 1} · {tr(tpl.mood)}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4 px-3 pb-2 pt-5">
                <div>
                  <h3 className="font-display text-[22px] font-semibold leading-none tracking-tight">
                    {tpl.name}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink/55">
                    {tr(tpl.tagline)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tpl.bestFor.map((tag) => (
                      <span
                        key={tr(tag)}
                        className="rounded-full border border-ink/15 px-2 py-[3px] text-[10px] uppercase tracking-[0.1em] text-ink/55"
                      >
                        {tr(tag)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1 pt-1">
                  {tpl.palette.map((c) => (
                    <span
                      key={c}
                      className="h-4 w-4 rounded-full border border-ink/10"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-ink/[0.08] px-3 pb-1 pt-3">
                <span className="text-[11.5px] text-ink/45">
                  {tr("Featuring ")}
                  {tpl.artist}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink">
                  {tr("View template")}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
