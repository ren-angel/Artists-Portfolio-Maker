import { test, expect } from "@playwright/test";

for (const viewport of [{width:1440,height:900},{width:390,height:844}]) {
  test(`marketing comparison, navigation and gallery controls at ${viewport.width}px`, async ({page}, info) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const table = page.getByRole("table", {name:"Compare plans"});
    await expect(table.getByRole("columnheader", {name:/Artist.*Recommended/})).toBeVisible();
    await expect(table.getByRole("row", {name:/Custom domain/})).toContainText("Not included");
    await page.getByRole("button", {name:/Yearly/}).click();
    await expect(page.getByRole("link", {name:"Choose Artist"})).toHaveAttribute("href","/auth/register?plan=artist&cycle=yearly");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await page.screenshot({path:info.outputPath("homepage.png"),fullPage:true, animations:"disabled"});
    if (viewport.width < 1024) await page.getByRole("button",{name:"Open menu"}).click();
    await page.getByRole("navigation").getByRole("link",{name:"Templates",exact:true}).first().click();
    await page.getByRole("button",{name:/Creative/}).click();
    await expect(page.getByRole("link",{name:"Use this template"})).toHaveAttribute("href","/auth/register?template=creative");
    await page.goto("/explore");
    await page.getByRole("button",{name:"Photography",exact:true}).click();
    await page.getByRole("textbox",{name:"Search artworks or artists…"}).fill("no-match-999");
    await expect(page.getByText("Nothing here yet")).toBeVisible();
    await page.getByRole("button",{name:"Clear filters"}).click();
    await expect(page.getByText("14 demo works")).toBeVisible();
    await page.goto("/pricing");
    await page.getByText("Can I change templates later?",{exact:true}).click();
    await expect(page.getByText(/Your pages, galleries and artwork carry over/)).toBeVisible();
  });
}
