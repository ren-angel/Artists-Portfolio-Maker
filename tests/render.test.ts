import { newCreative, cloneSection, blockSchema } from "@studio/shared";
import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Portfolio, matchPage } from "../apps/web/components/Portfolio.tsx";
import { demo, demoImages } from "../apps/web/lib/demo.ts";
import { initialDraft, newBlock, templateNames, draftSchema, publishable, removeGallery } from "@studio/shared";
test("all four public portfolios server-render a semantic page, gallery links and accessible artwork without client code", () => {
  for (const template of templateNames) {
    const d = initialDraft("My studio", "en");
    d.theme.template = template;
    const a = {
      id: crypto.randomUUID(),
      assetId: crypto.randomUUID(),
      title: "Sketch",
      alt: "A pencil portrait",
      description: "",
      featured: true,
    };
    d.artworks = [a];
    d.galleries = [
      {
        id: crypto.randomUUID(),
        slug: "drawings",
        title: "Drawings",
        description: "",
        visible: true,
        cover: a.id,
        artIds: [a.id],
      },
    ];
    d.pages[0].blocks.push({
      ...newBlock("richText"),
      text: "**bold** and <script>alert(1)</script>",
    });
    const spacer = newBlock("spacer");
    d.pages[0].blocks.push(spacer);
    const props = { draft: d, site: crypto.randomUUID(), base: "/site/mika" };
    const html = renderToStaticMarkup(createElement(Portfolio, props));
    assert.ok(html.includes('data-block="' + spacer.id + '"'));
    assert.match(html, new RegExp("pf-" + template));
    const text = (markup: string) => markup.replace(/<[^>]+>/g, " ");
    assert.match(text(html.match(/<h1[\s\S]*?<\/h1>/)![0]), /My\s+studio/);
    assert.match(html, /alt="A pencil portrait"/);
    assert.match(html, /href="\/site\/mika\/galleries\/drawings"/);
    assert(!html.includes("<script"));
    assert.match(html, /<strong>bold<\/strong>/);
    assert.equal(matchPage(d, ["missing"]), undefined);
    assert.equal(matchPage(d, ["galleries", "old-slug"]), undefined);
    const gallery = renderToStaticMarkup(
      createElement(Portfolio, { ...props, path: ["galleries", "drawings"] }),
    );
    assert.match(text(gallery.match(/<h1[\s\S]*?<\/h1>/)![0]), /Drawings/);
    const work = renderToStaticMarkup(
      createElement(Portfolio, { ...props, path: ["works", a.id] }),
    );
    assert.match(work, /alt="A pencil portrait"/);
    assert.equal(matchPage(d, ["works", crypto.randomUUID()]), undefined);
  }
});

test("Story reading mode stays in the selected gallery and stops at its last page", () => {
  const draft = demo("story", "en");
  const gallery = draft.galleries[1];
  const props = { draft, site: "", base: "/demo/story", path: ["galleries", gallery.slug], demoImages: demoImages("story") };
  const middle = renderToStaticMarkup(createElement(Portfolio, { ...props, readerPage: 2 }));
  assert.ok(middle.includes(`href="/demo/story/galleries/${gallery.slug}?page=3"`));
  assert.match(middle, /2 \/ 3/);
  const last = renderToStaticMarkup(createElement(Portfolio, { ...props, readerPage: 99 }));
  assert.match(last, /3 \/ 3/);
  assert.doesNotMatch(last, /page=4"/);
});

test("the commission CTA tracks the artist's page and keeps the current portfolio base", () => {
  const draft = demo("creative", "en");
  const page = draft.pages.find(p => p.slug === "commissions")!;
  page.slug = "requests";
  for (const template of templateNames) {
    draft.theme.template = template;
    const render = () => renderToStaticMarkup(createElement(Portfolio, { draft, site: "", base: "/preview" }));
    assert.ok(render().includes('href="/preview/requests"'));
    page.inNav = false;
    assert.ok(!render().includes('href="/preview/requests"'));
    page.inNav = true;
  }
});

test("commission examples link to visible galleries and survive gallery deletion", () => {
  const draft = demo("creative", "en");
  const gallery = draft.galleries[0];
  const render = (d: typeof draft) => renderToStaticMarkup(createElement(Portfolio, {
    draft: d, site: "", base: "/preview", path: ["commissions"],
  }));
  assert.match(render(draft), new RegExp('href="/preview/galleries/' + gallery.slug + '"'));
  draft.galleries[0].visible = false;
  const snapshot = publishable(draft, "artist");
  assert.equal(snapshot.commissions.types[0].galleryId, null);
  assert.ok(!render(snapshot).includes('/galleries/' + gallery.slug));
  removeGallery(draft, gallery.id);
  assert.ok(draftSchema.safeParse(draft).success);
  draft.commissions.types[0].galleryId = crypto.randomUUID();
  assert.ok(!draftSchema.safeParse(draft).success);
});

test("creative layouts reject cycles and render a bounded anonymous chapter", () => {
  const d = initialDraft("River", "en");
  const series = newCreative("comic");
  series.visible = true;
  const chapter = {
    id: crypto.randomUUID(),
    title: "The crossing",
    date: null,
    visible: true,
    cover: null,
    artIds: [] as string[],
  };
  for (let i = 0; i < 12; i++) {
    const id = crypto.randomUUID();
    chapter.artIds.push(id);
    d.artworks.push({
      id,
      assetId: crypto.randomUUID(),
      title: "Panel " + i,
      alt: "Panel " + i,
      description: "",
      featured: false,
    });
  }
  series.chapters.push(chapter);
  const p = d.pages[0];
  p.creative = series;
  const root = newBlock("columns"),
    nested = { ...newBlock("columns"), parentId: root.id },
    leaf = { ...newBlock("image"), parentId: nested.id };
  p.blocks = [root, nested, leaf];
  assert(draftSchema.safeParse(d).success);
  assert.equal(cloneSection([root, nested, leaf])[0].parentId, undefined);
  root.parentId = nested.id;
  assert(!draftSchema.safeParse(d).success);
  delete root.parentId;
  const extra = { ...newBlock("image"), parentId: leaf.id };
  p.blocks.push(extra);
  assert(!draftSchema.safeParse(d).success);
  p.blocks.pop();
  const html = renderToStaticMarkup(
    createElement(Portfolio, {
      draft: publishable(d),
      site: "test",
      base: "/site/river",
      path: [p.slug, "chapters", chapter.id],
    }),
  );
  assert.match(html, /The crossing/);
  assert.match(html, /Page by page/);
  assert.match(html, /Right to left/);
  assert.match(html, /Panel 7/);
  assert.doesNotMatch(html, /Panel 8/);
  const video = { ...newBlock("videoEmbed"), url: "https://youtu.be/abcdefghijk" };
  assert(blockSchema.safeParse(video).success);
  assert(!blockSchema.safeParse({ ...video, url: "https://other.example/abcdefghijk" }).success);
  p.blocks = [video];
  const home = renderToStaticMarkup(
    createElement(Portfolio, { draft: publishable(d), site: "test", base: "/site/river" }),
  );
  assert.match(home, /Load YouTube player/);
  assert.doesNotMatch(home, /<iframe/);
});
