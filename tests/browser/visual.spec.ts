import { expect, test } from "@playwright/test";

/* Screenshot regression for the Base44-derived designs: the marketing
   homepage, pricing and the four public portfolio templates. Baselines live
   in visual.spec.ts-snapshots/. Update intentionally with
   `pnpm e2e tests/browser/visual.spec.ts --update-snapshots`. */

const pages = [
  ["home", "/"],
  ["pricing", "/pricing"],
  ["template-gallery", "/demo/gallery"],
  ["template-creative", "/demo/creative"],
  ["template-showcase", "/demo/showcase"],
  ["template-story", "/demo/story"],
] as const;

for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
] as const)
  for (const [name, path] of pages)
    test(`${name} matches the approved design at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      // The development tools badge is not part of the design.
      await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
      await expect(page).toHaveScreenshot(`${name}-${width}.png`, {
        animations: "disabled",
        caret: "hide",
        maxDiffPixelRatio: 0.01,
      });
    });
