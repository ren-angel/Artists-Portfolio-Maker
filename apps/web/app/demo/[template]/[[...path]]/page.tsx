import { readerPageNumber } from "../../../../entities/portfolio/templates/kit";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { templateNames } from "@studio/shared";
import { demo, demoImages } from "../../../../entities/portfolio/demo";
import { language, brand } from "../../../../shared/lib/server";
import { t } from "../../../../shared/lib/copy";
import { Portfolio, matchPage } from "../../../../entities/portfolio/Portfolio";
import "../../../../shared/ui/ui.css";
type Props = { params: Promise<{ template: string; path?: string[] }> };
export async function generateMetadata({ params }: Props) {
  const { template } = await params;
  const selected = templateNames.find((v) => v === template);
  if (!selected) return {};
  const d = demo(selected, await language());
  return { title: d.title + " · " + brand(), robots: { index: false } };
}
export default async function Demo({ params, searchParams }: Props & {searchParams: Promise<{page?: string | string[]}>}) {
  const { template, path = [] } = await params;
  const selected = templateNames.find((v) => v === template);
  if (!selected) notFound();
  const l = await language();
  const draft = demo(selected, l);
  if (!matchPage(draft, path)) notFound();
  return (
    <div className="ui">
      <div className="flex items-center justify-between gap-3 bg-ink px-4 py-2 text-[11px] text-paper sm:px-6">
        <span className="flex min-w-0 items-center gap-2 uppercase tracking-[0.16em] text-paper/70">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
          <span className="truncate">
            {t(l, "preview")} · {selected} · {brand()}
          </span>
        </span>
        <a
          href={"/auth/register?template=" + selected}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-coral px-3 py-1 font-medium text-ink transition-transform hover:-translate-y-0.5"
        >
          {t(l, "register")} <ArrowRight className="h-3 w-3" />
        </a>
      </div>
      <main>
        <Portfolio
          site=""
          base={"/demo/" + selected}
          path={path}
          readerPage={readerPageNumber((await searchParams).page)}
          draft={draft}
          brand={brand()}
          demoImages={demoImages(selected, l)}
        />
      </main>
    </div>
  );
}
