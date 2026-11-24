import { readerPageNumber } from "../../../entities/portfolio/templates/kit";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { draftSchema } from "@doodallery/shared";
import { Portfolio, matchPage } from "../../../entities/portfolio/Portfolio";
import { ArrowLeft } from "lucide-react";
import { t } from "../../../shared/lib/copy";
import { brand } from "../../../shared/lib/server";
import { apiOrigin, internalHeaders } from "../../../shared/lib/internal-api";
import "../../../shared/ui/ui.css";
export const metadata = { robots: { index: false, follow: false } };
export default async function Preview({
  params, searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<{page?: string | string[]}>;
}) {
  const cookie = await cookies();
  const base = apiOrigin();
  const options = {
    cache: "no-store" as const,
    headers: { cookie: cookie.toString(), ...internalHeaders() },
  };
  const list = await fetch(base + "/sites", options);
  if (list.status === 401) redirect("/auth/login");
  if (!list.ok) throw Error("Could not load preview");
  const {sites, features} = await list.json();
  const site = sites[0];
  if (!site) redirect("/studio");
  const r = await fetch(base + "/sites/" + site.id, options);
  if (!r.ok) notFound();
  const draft = draftSchema.parse((await r.json()).draft);
  const { path = [] } = await params;
  if (!matchPage(draft, path)) notFound();
  return (
    <div className="ui">
      <header className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-ink px-4 py-2 text-[11px] text-paper sm:px-6">
        <span className="flex min-w-0 items-center gap-2 uppercase tracking-[0.16em] text-paper/70">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-butter" />
          <span className="truncate">
            {t(draft.language, "preview")} · {t(draft.language, "draft")}
          </span>
        </span>
        <a
          href="/studio"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-paper/25 px-3 py-1 font-medium hover:border-paper/60"
        >
          <ArrowLeft className="h-3 w-3" /> {t(draft.language, "open")}
        </a>
      </header>
      <main>
        <Portfolio
          draft={draft}
          branding={!features.removeBranding}
          site={site.id}
          path={path}
          readerPage={readerPageNumber((await searchParams).page)}
          base="/preview"
          brand={brand()}
        />
      </main>
    </div>
  );
}
