import { youtubeVideoId, type Block, type Chapter } from "@doodallery/shared";
import { ArtworkComparison } from "./ArtworkComparison";
import { VideoEmbed } from "./VideoEmbed";
import { ComicReader } from "./ComicReader";
import { Img, type Ctx, type Page } from "./kit";

const pageHref = (ctx: Ctx, p: Page) =>
  ctx.href(p.id === ctx.d.home ? "" : "/" + p.slug);
const chapterHref = (ctx: Ctx, p: Page, h: Chapter) =>
  ctx.href("/" + p.slug + "/chapters/" + h.id);
function Cards({ ctx, pages }: { ctx: Ctx; pages: Page[] }) {
  return (
    <div className="creative-cards">
      {pages.map((p) => {
        const cover = ctx.arts.get(p.creative?.cover ?? "");
        return (
          <a key={p.id} href={pageHref(ctx, p)}>
            {cover && <Img ctx={ctx} art={cover} />}
            <strong>{p.title}</strong>
            {p.creative?.description && <p>{p.creative.description}</p>}
          </a>
        );
      })}
    </div>
  );
}
function ArtworkList({
  ctx,
  ids,
  mode,
}: {
  ctx: Ctx;
  ids: string[];
  mode?: string;
}) {
  return (
    <div
      className={mode === "carousel" ? "creative-carousel" : "creative-cards"}
      tabIndex={mode === "carousel" ? 0 : undefined}
    >
      {ids.map((id, i) => {
        const a = ctx.arts.get(id);
        return (
          a && (
            <figure key={id}>
              <a href={ctx.workHref(a)}>
                <Img ctx={ctx} art={a} />
              </a>
              <figcaption>
                {mode === "processSteps" && i + 1 + ". "}
                {a.title}
              </figcaption>
            </figure>
          )
        );
      })}
    </div>
  );
}
function ChapterList({
  ctx,
  items,
}: {
  ctx: Ctx;
  items: { p: Page; h: Chapter }[];
}) {
  return (
    <ol className="creative-chapters">
      {items.map(({ p, h }) => {
        const a = ctx.arts.get(h.cover ?? h.artIds[0] ?? "");
        return (
          <li key={p.id + h.id}>
            <a href={chapterHref(ctx, p, h)}>
              {a && <Img ctx={ctx} art={a} />}
              <strong>{h.title}</strong>
              {h.date && (
                <time dateTime={h.date}>
                  {new Intl.DateTimeFormat(ctx.l, { timeZone: "UTC" }).format(
                    new Date(h.date + "T00:00:00Z"),
                  )}
                </time>
              )}
            </a>
          </li>
        );
      })}
    </ol>
  );
}
export function CreativePage({
  ctx,
  page,
  chapter,
}: {
  ctx: Ctx;
  page: Page;
  chapter?: Chapter;
}) {
  const c = page.creative!;
  const cover = ctx.arts.get(c.cover ?? "");
  if (chapter) {
    const i = c.chapters.indexOf(chapter);
    return (
      <article className="creative-content">
        <a href={pageHref(ctx, page)}>← {page.title}</a>
        <h1>{chapter.title}</h1>
        <ComicReader
          key={chapter.id}
          storageKey={"comic-progress:" + page.id + ":" + chapter.id}
          en={ctx.l === "en"}
          pages={chapter.artIds.flatMap((id) => {
            const a = ctx.arts.get(id);
            return a
              ? [
                  {
                    id,
                    alt: a.alt || a.title,
                    thumb: ctx.src(a),
                    master: ctx.src(a, "master"),
                    width: a.width,
                    height: a.height,
                  },
                ]
              : [];
          })}
        />
        <nav
          className="reader-controls"
          aria-label={ctx.tr("Chapters", "Capítulos")}
        >
          {[i - 1, i + 1].map(
            (n) =>
              c.chapters[n] && (
                <a key={n} href={chapterHref(ctx, page, c.chapters[n])}>
                  {n < i ? "← " : ""}
                  {c.chapters[n].title}
                  {n > i ? " →" : ""}
                </a>
              ),
          )}
        </nav>
      </article>
    );
  }
  return (
    <article className="creative-content">
      <header className="creative-heading">
        {cover && <Img ctx={ctx} art={cover} large />}
        <div>
          <p>{[c.status, ...c.tags].filter(Boolean).join(" · ")}</p>
          <h1>{page.title}</h1>
          <p>{c.description}</p>
          {c.link && (
            <a href={c.link} rel="external noreferrer">
              {new URL(c.link).hostname}
            </a>
          )}
          {c.sale && (
            <p>
              <strong>
                {new Intl.NumberFormat(ctx.l, {
                  style: "currency",
                  currency: c.sale.currency,
                }).format(c.sale.price)}
              </strong>
              {" · "}
              {c.sale.available && c.sale.checkout ? (
                <a href={c.sale.checkout} rel="external sponsored noreferrer">
                  {ctx.tr("External checkout", "Compra em site externo")} ↗{" "}
                  {new URL(c.sale.checkout).hostname}
                </a>
              ) : (
                ctx.tr("Unavailable", "Indisponível")
              )}
            </p>
          )}
        </div>
      </header>
      {c.fields.map((f, i) => (
        <section key={i}>
          <h2>{f.label}</h2>
          <p>{f.text}</p>
        </section>
      ))}
      {!!c.chapters.length && (
        <ChapterList
          ctx={ctx}
          items={c.chapters.map((h) => ({ p: page, h }))}
        />
      )}
      {!!c.artIds.length && <ArtworkList ctx={ctx} ids={c.artIds} />}
      {!!c.related.length && (
        <section>
          <h2>{ctx.tr("Related pages", "Páginas relacionadas")}</h2>
          <Cards
            ctx={ctx}
            pages={ctx.d.pages.filter((p) => c.related.includes(p.id))}
          />
        </section>
      )}
    </article>
  );
}
export function creativeBlock(b: Block, ctx: Ctx) {
  const pages = ctx.d.pages.filter(
    (p) => p.creative && (!b.pageId || b.pageId === p.id),
  );
  const target =
    ctx.d.pages.find((p) => p.id === b.pageId) ??
    (ctx.route.kind === "page" ? ctx.route.page : undefined);
  const c = target?.creative;
  const gallery = ctx.galleries.find((g) => g.id === b.galleryId);
  const catalogKinds = {
    comicSeries: "comic",
    characterCards: "character",
    projectShowcase: "project",
    productCards: "product",
  } as const;
  let body;
  if (Object.hasOwn(catalogKinds, b.type)) {
    const kind = catalogKinds[b.type as keyof typeof catalogKinds];
    body = (
      <Cards
        ctx={ctx}
        pages={pages
          .filter((p) => p.creative?.kind === kind)
          .sort(
            (a, b) =>
              Number(b.creative?.featured) - Number(a.creative?.featured),
          )}
      />
    );
  } else
    switch (b.type) {
      case "latestChapters":
        body = (
          <ChapterList
            ctx={ctx}
            items={pages
              .flatMap((p) =>
                (p.creative?.chapters ?? []).map((h) => ({ p, h })),
              )
              .reverse()
              .sort((a, b) => (b.h.date ?? "").localeCompare(a.h.date ?? ""))
              .slice(0, 8)}
          />
        );
        break;
      case "characterProfile":
        body = target?.creative?.kind === "character" && (
          <CreativePage ctx={ctx} page={target} />
        );
        break;
      case "characterGallery":
        body = <ArtworkList ctx={ctx} ids={c?.artIds ?? []} />;
        break;
      case "projectAssociation":
        body = (
          <Cards
            ctx={ctx}
            pages={ctx.d.pages.filter(
              (p) =>
                c?.related.includes(p.id) && p.creative?.kind === "project",
            )}
          />
        );
        break;
      case "relationships":
        body = (
          <Cards
            ctx={ctx}
            pages={ctx.d.pages.filter((p) => c?.related.includes(p.id))}
          />
        );
        break;
      case "projectTimeline":
        body = (
          <ol>
            {c?.fields.map((f, i) => (
              <li key={i}>
                <strong>{f.label}</strong>
                <p>{f.text}</p>
              </li>
            ))}
          </ol>
        );
        break;
      case "comparison": {
        const [before, after] = gallery ? ctx.works(gallery) : [];
        if (before && after)
          body = (
            <ArtworkComparison
              en={ctx.l === "en"}
              before={{
                src: ctx.src(before, "master"),
                alt: before.alt || before.title,
              }}
              after={{
                src: ctx.src(after, "master"),
                alt: after.alt || after.title,
              }}
            />
          );
        break;
      }
      case "carousel":
      case "processSteps":
        body = (
          <ArtworkList ctx={ctx} mode={b.type} ids={gallery?.artIds ?? []} />
        );
        break;
      case "collections":
        body = (
          <div className="creative-cards">
            {(gallery ? [gallery] : ctx.galleries).map((g) => (
              <a key={g.id} href={ctx.galleryHref(g)}>
                {ctx.cover(g) && <Img ctx={ctx} art={ctx.cover(g)!} />}
                <strong>{g.title}</strong>
              </a>
            ))}
          </div>
        );
        break;
      case "videoEmbed": {
        const id = youtubeVideoId(b.url);
        body = id ? (
          <VideoEmbed key={id} id={id} en={ctx.l === "en"} title={b.heading} />
        ) : null;
        break;
      }
      case "profileLink":
      case "downloadLink": {
        const url = ctx.link(b.url);
        body = url && (
          <a href={url} rel="external noreferrer">
            {b.text || new URL(url, "https://portfolio.invalid").hostname} ↗
          </a>
        );
        break;
      }
      default:
        return null;
    }
  return (
    <section className="creative-content">
      {b.heading && <h2>{b.heading}</h2>}
      {body}
    </section>
  );
}
