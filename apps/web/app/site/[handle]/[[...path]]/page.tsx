import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { published, publicOrigin, brand } from "../../../../lib/server";
import { Portfolio, matchPage } from "../../../../components/Portfolio";
import { t } from "../../../../lib/copy";
import "../../../../components/ui/ui.css";
type Props = { params: Promise<{ handle: string; path?: string[] }> };
export async function generateMetadata({ params }: Props) {
  const { handle, path = [] } = await params;
  const { draft, id } = await published(handle);
  const item = matchPage(draft, path);
  if (!item) notFound();
  const title = path.length ? item.title + " · " + draft.title : draft.title;
  const canonical =
    publicOrigin(handle) + (path.length ? "/" + path.join("/") : "");
  const a =
    (path[0] === "works" && draft.artworks.find((a) => a.id === path[1])) ||
    (draft.artworks.find((a) => a.featured) ?? draft.artworks[0]);
  const image = a
    ? new URL("/api/media/" + id + "/" + a.assetId + "/thumb", canonical).href
    : undefined;
  return {
    title,
    description: draft.description,
    alternates: { canonical },
    openGraph: {
      title,
      description: draft.description,
      url: canonical,
      images: image ? [image] : [],
    },
  };
}
export default async function PublicPage({ params }: Props) {
  const { handle, path = [] } = await params;
  const { draft, id } = await published(handle);
  if (!matchPage(draft, path)) notFound();
  return (
    <main className="ui">
      <Portfolio
        draft={draft}
        site={id}
        path={path}
        brand={brand()}
        base={
          (await headers()).get("x-portfolio-host") === handle
            ? ""
            : "/site/" + handle
        }
      />
      <footer className="bg-paper py-3 text-center text-[11px] text-ink/45">
        <a
          className="underline decoration-ink/20 underline-offset-4 hover:text-ink"
          href={
            (process.env.APP_ORIGIN || "http://localhost:3000") +
            "/report?site=" +
            handle
          }
        >
          {t(draft.language, "report")}
        </a>
      </footer>
    </main>
  );
}
