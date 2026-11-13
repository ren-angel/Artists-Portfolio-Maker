import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { published, publicOrigin } from "../../../../lib/server";
import { Portfolio, matchPage } from "../../../../components/Portfolio";
import { t } from "../../../../lib/copy";
type Props = { params: Promise<{ handle: string; path?: string[] }> };
export async function generateMetadata({ params }: Props) {
  const { handle, path = [] } = await params;
  const { draft, id } = await published(handle);
  const item = matchPage(draft, path);
  if (!item) notFound();
  const title = path.length ? item.title + " · " + draft.title : draft.title;
  const canonical =
    publicOrigin(handle) + (path.length ? "/" + path.join("/") : "");
  const a = draft.artworks.find((a) => a.featured) ?? draft.artworks[0];
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
    <main>
      <Portfolio
        draft={draft}
        site={id}
        path={path}
        base={
          (await headers()).get("x-portfolio-host") === handle
            ? ""
            : "/site/" + handle
        }
      />
      <footer className="report-link">
        <a
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
