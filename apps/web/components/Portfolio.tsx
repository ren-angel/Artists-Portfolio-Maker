import type { CSSProperties } from "react";
import { safeLink, type Draft, type Block, type Art } from "@studio/shared";
import { t } from "../lib/copy";
type Props = {
  draft: Draft;
  site: string;
  base: string;
  path?: string[];
  demoImage?: string;
  selectBlock?: (id: string) => void;
  selected?: string;
};
export function matchPage(d: Draft, path: string[]) {
  if (path.length === 2 && path[0] === "galleries")
    return d.galleries.find((g) => g.slug === path[1] && g.visible);
  if (path.length > 1) return undefined;
  return d.pages.find((p) =>
    path.length ? p.slug === path[0] : p.id === d.home,
  );
}
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\s*\n/).map((p, i) => (
        <p key={i}>
          {p
            .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
            .map((s, j) =>
              s.startsWith("**") && s.endsWith("**") ? (
                <strong key={j}>{s.slice(2, -2)}</strong>
              ) : s.startsWith("*") && s.endsWith("*") ? (
                <em key={j}>{s.slice(1, -1)}</em>
              ) : (
                s
              ),
            )}
        </p>
      ))}
    </>
  );
}
export function Portfolio({
  draft: d,
  site,
  base,
  path = [],
  demoImage,
  selectBlock,
  selected,
}: Props) {
  const item = matchPage(d, path);
  const l = d.language;
  const arts = new Map(d.artworks.map((a) => [a.id, a]));
  const src = (a: Art, size = "thumb") =>
    demoImage || "/api/media/" + site + "/" + a.assetId + "/" + size;
  const image = (a: Art, large = false) => (
    <img
      loading={large ? "eager" : "lazy"}
      src={src(a, large ? "master" : "thumb")}
      alt={a.alt || a.title}
    />
  );
  const tiles = (ids: string[]) => (
    <div className="art-wall">
      {ids.map((id) => {
        const a = arts.get(id);
        return (
          a && (
            <figure key={a.id}>
              <a href={src(a, "master")}>{image(a)}</a>
              <figcaption>
                <strong>{a.title}</strong>
                {a.description && <p>{a.description}</p>}
              </figcaption>
            </figure>
          )
        );
      })}
    </div>
  );
  const href = (suffix: string) =>
    base ? base + suffix || "/" : suffix || "/";
  function render(b: Block) {
    const a = b.artId ? arts.get(b.artId) : null;
    const g = d.galleries.find((g) => g.id === b.galleryId && g.visible);
    switch (b.type) {
      case "hero":
        return (
          <div className="pf-hero">
            <div>
              <h1>{b.heading || d.title}</h1>
              {b.text && <p>{b.text}</p>}
            </div>
            {a && <figure>{image(a, true)}</figure>}
          </div>
        );
      case "divider":
        return <hr />;
      case "image":
        return (
          <>
            {b.heading && <h2>{b.heading}</h2>}
            {a && (
              <figure>
                {image(a, true)}
                <figcaption>{b.text || a.title}</figcaption>
              </figure>
            )}
          </>
        );
      case "featured":
        return (
          <>
            {(b.heading || d.artworks.some((a) => a.featured)) && (
              <h2>{b.heading || t(l, "featured")}</h2>
            )}
            {tiles(d.artworks.filter((a) => a.featured).map((a) => a.id))}
          </>
        );
      case "galleryGrid":
        return (
          g && (
            <>
              <h2>{b.heading || g.title}</h2>
              {tiles(g.artIds)}
            </>
          )
        );
      case "galleryPreview":
        return (
          <>
            {b.heading && <h2>{b.heading}</h2>}
            <div className="gallery-wall">
              {d.galleries
                .filter(
                  (v) => v.visible && (!b.galleryId || v.id === b.galleryId),
                )
                .map((v) => {
                  const cover = arts.get(v.cover ?? v.artIds[0]);
                  return (
                    <a key={v.id} href={href("/galleries/" + v.slug)}>
                      {cover && image(cover)}
                      <h3>{v.title} ↗</h3>
                      <p>{v.description}</p>
                    </a>
                  );
                })}
            </div>
          </>
        );
      case "heading":
        return <h2>{b.heading}</h2>;
      case "social":
        return (
          <>
            <h2>{b.heading}</h2>
            <nav>
              {d.social
                .filter((url) => safeLink.safeParse(url).success)
                .map((url) => (
                  <a key={url} href={url} rel="me noreferrer">
                    {new URL(url).hostname} ↗
                  </a>
                ))}
            </nav>
          </>
        );
      case "cta":
        return (
          safeLink.safeParse(b.url).success && (
            <a className="pf-button" href={b.url}>
              {b.heading || b.url} →
            </a>
          )
        );
      default:
        return (
          <>
            {b.heading && <h2>{b.heading}</h2>}
            <Rich text={b.text} />
            {b.type === "contact" && safeLink.safeParse(b.url).success && (
              <a href={b.url}>{b.url}</a>
            )}
          </>
        );
    }
  }
  return (
    <article
      lang={l}
      className={
        "portfolio pf-" +
        d.theme.template +
        " palette-" +
        d.theme.palette +
        " font-" +
        d.theme.font
      }
      style={{ "--accent": d.theme.accent } as CSSProperties}
    >
      <header className={"pf-nav nav-" + d.theme.nav}>
        <a href={href("")}>{d.title}</a>
        <nav>
          {d.pages
            .filter((p) => p.inNav)
            .map((p) => (
              <a key={p.id} href={href(p.id === d.home ? "" : "/" + p.slug)}>
                {p.title}
              </a>
            ))}
        </nav>
      </header>
      {item && "blocks" in item ? (
        item.blocks
          .filter((b) => b.visible)
          .map((b) => (
            <section
              key={b.id}
              data-block={b.id}
              className={[
                "pf-block",
                "block-" + b.type,
                "bg-" + b.background,
                "space-" + b.spacing,
                selected === b.id ? "chosen" : "",
              ].join(" ")}
              style={{ textAlign: b.layout }}
              onClick={
                selectBlock
                  ? (e) => {
                      e.preventDefault();
                      selectBlock(b.id);
                    }
                  : undefined
              }
            >
              {render(b)}
            </section>
          ))
      ) : item && "artIds" in item ? (
        <section className="pf-block">
          <h1>{item.title}</h1>
          <p>{item.description}</p>
          {item.artIds.length ? (
            tiles(item.artIds)
          ) : (
            <p>{t(l, "emptyGallery")}</p>
          )}
        </section>
      ) : null}
    </article>
  );
}
