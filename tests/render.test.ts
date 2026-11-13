import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Portfolio, matchPage } from "../apps/web/components/Portfolio.tsx";
import { initialDraft, newBlock, templateNames } from "@studio/shared";
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
    const props = { draft: d, site: crypto.randomUUID(), base: "/site/mika" };
    const html = renderToStaticMarkup(createElement(Portfolio, props));
    assert.match(html, new RegExp("pf-" + template));
    assert.match(html, /<h1>My studio<\/h1>/);
    assert.match(html, /alt="A pencil portrait"/);
    assert.match(html, /href="\/site\/mika\/galleries\/drawings"/);
    assert(!html.includes("<script"));
    assert.match(html, /<strong>bold<\/strong>/);
    assert.equal(matchPage(d, ["missing"]), undefined);
    assert.equal(matchPage(d, ["galleries", "old-slug"]), undefined);
    const gallery = renderToStaticMarkup(
      createElement(Portfolio, { ...props, path: ["galleries", "drawings"] }),
    );
    assert.match(gallery, /<h1>Drawings<\/h1>/);
  }
});
