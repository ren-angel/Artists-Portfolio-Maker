import { readerPageNumber } from "../../../../components/templates/kit";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { after } from "next/server";
import {
  published,
  publicOrigin,
  brand,
  recordHit,
  visit,
} from "../../../../lib/server";
import { Portfolio, matchPage } from "../../../../components/Portfolio";
import { t } from "../../../../lib/copy";
import "../../../../components/ui/ui.css";
function loadPortfolio(handle: string, path: string[]) {
  if (path[0] === "works") return published(handle, "");
  if (path[1] === "chapters" && /^[0-9a-f-]{36}$/i.test(path[2] ?? ""))
    return published(handle, path[2], path[0]);
  return published(handle);
}
type Props = { params: Promise<{ handle: string; path?: string[] }> };
export async function generateMetadata({ params }: Props) {
  const { handle, path = [] } = await params;
  const { draft, id, domain, indexable } = await loadPortfolio(handle, path);
  const item = matchPage(draft, path);
  if (!item) notFound();
  const title = path.length ? item.title + " · " + draft.title : draft.title;
  const canonical =
    publicOrigin(handle, domain) + (path.length ? "/" + path.join("/") : "");
  const creative = draft.pages.find(
    (p) => p.slug === path[0] || (!path.length && p.id === draft.home),
  )?.creative;
  const cover = creative?.chapters.find((h) => h.id === path[2])?.cover ?? creative?.cover;
  const description = creative?.description || draft.description;
  const a =
    draft.artworks.find((a) => a.id === cover) ||
    (path[0] === "works" && draft.artworks.find((a) => a.id === path[1])) ||
    (draft.artworks.find((a) => a.featured) ?? draft.artworks[0]);
  const image = a
    ? new URL("/api/media/" + id + "/" + a.assetId + "/thumb", canonical).href
    : undefined;
  return {
    title,
    description,
    robots: indexable ? undefined : { index: false, follow: false },
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: image ? [image] : [],
    },
  };
}
export default async function PublicPage({
  params,
  searchParams,
}: Props & { searchParams: Promise<{ page?: string | string[] }> }) {
  const { handle, path = [] } = await params;
  const { draft, id, branding } = await loadPortfolio(handle, path);
  if (!matchPage(draft, path)) notFound();
  // Count the view after the response is sent; prefetches are not visits.
  const v = await visit();
  if (!v.prefetch)
    after(() =>
      recordHit({
        handle,
        kind: "view",
        path: "/" + path.join("/"),
        referrer: v.referrer,
        country: v.country,
        agent: v.agent,
      }),
    );
  return (
    <main className="ui">
      <Portfolio
        draft={draft}
        site={id}
        path={path}
        readerPage={readerPageNumber((await searchParams).page)}
        brand={brand()}
        branding={branding}
        track
        base={(await headers()).get("x-portfolio-host") === handle ? "" : "/site/" + handle}
      />
      <footer className="bg-paper py-3 text-center text-[11px] text-ink/45">
        <a
          className="underline decoration-ink/20 underline-offset-4 hover:text-ink"
          href={(process.env.APP_ORIGIN || "http://localhost:3000") + "/report?site=" + handle}
        >
          {t(draft.language, "report")}
        </a>
      </footer>
    </main>
  );
}
