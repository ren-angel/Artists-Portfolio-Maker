import { defaultPrices, planIds, plans as sharedPlans } from "@studio/shared";
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Hero from "../apps/web/components/home/Hero.tsx";
import TemplatesSection from "../apps/web/components/home/TemplatesSection.tsx";
import PlansSection from "../apps/web/components/home/PlansSection.tsx";
import { ART } from "../apps/web/components/home/data.ts";
import type { Common } from "../apps/web/components/home/types.ts";

for (const lang of ["en", "pt-BR"] as const) {
  test(`marketing in ${lang} preserves production links, local artwork and configured branding`, () => {
    const props: Common = {
      lang,
      name: "Test Studio",
      domain: "artists.example",
    };
    const render = (component: typeof Hero) =>
      renderToStaticMarkup(createElement(component, props));
    const hero = render(Hero);
    assert.match(hero, /href="\/auth\/register"/);
    assert.match(hero, /href="\/templates"/);
    assert.match(hero, /lunamori\.artists\.example/);
    assert.ok(
      hero.includes(lang === "en" ? "Your art deserves" : "Sua arte merece"),
    );
    const templates = render(TemplatesSection);
    for (const template of ["gallery", "creative", "showcase", "story"]) {
      assert.ok(templates.includes(`href="/demo/${template}"`));
    }
    for (const asset of Object.values(ART)) {
      assert.ok(
        existsSync(new URL("../apps/web/public" + asset, import.meta.url)),
        asset,
      );
    }
    const catalog = {
      provider: "mock", live: false, plans: planIds.map(id => ({
        ...sharedPlans[id], limits: id === "free" ? { ...sharedPlans.free.limits, storage: 37 * 1024 ** 2 } : sharedPlans[id].limits,
        prices: id === "free" ? null : defaultPrices[id],
      })),
    };
    const plans = renderToStaticMarkup(createElement(PlansSection, { ...props, catalog }));
    assert.match(plans, /37 MB/);
    assert.match(plans, /href="\/auth\/register"/);
    assert.match(plans, /<table/);
    assert.ok(plans.indexOf('<table') > plans.lastIndexOf('</article>'));
    assert.equal(plans.match(/scope="row"/g)?.length, 12);
    assert.match(plans, /350/);
    assert.match(plans, /href="\/auth\/register\?plan=artist&amp;cycle=monthly"/);
    assert.doesNotMatch(plans, /Unlimited|Ilimitad|Coming soon|Em breve/);
  });
}
