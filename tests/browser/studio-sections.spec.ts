import { expect, test } from "@playwright/test";

/* Regression: Comics, Characters, Projects and Shop were shown as "Coming
   soon" although Phase 3 implemented them. Each is now a working studio
   section backed by the same draft API as Pages. */

test("studio creative sections are navigable, create their own page kind and save", async ({ page }) => {
  const origin = process.env.APP_ORIGIN || "http://localhost:3000";
  const headers = { origin, "x-studio-request": "1" };
  const handle = "sections-" + crypto.randomUUID().slice(0, 8);
  const http = page.request;
  expect(
    (
      await http.post("/api/auth/register", {
        headers,
        data: { email: handle + "@example.test", password: "test-sections-password", displayName: "Section artist", accept: true },
      })
    ).status(),
  ).toBe(201);
  const { id } = await (
    await http.post("/api/sites", { headers, data: { handle, title: "Section studio", language: "en" } })
  ).json();
  // Finish onboarding so the studio opens on its dashboard.
  const site = await (await http.get("/api/sites/" + id)).json();
  expect(
    (await http.put("/api/sites/" + id, { headers, data: { version: site.version, draft: { ...site.draft, step: 7 } } })).ok(),
  ).toBeTruthy();

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/studio");
  const nav = page.getByRole("navigation", { name: "Artist studio" });
  await expect(nav).toBeVisible();
  await expect(page.getByText("Coming soon")).toHaveCount(0);

  for (const [label, empty] of [
    ["Characters", "No characters yet"],
    ["Projects", "No projects yet"],
    ["Shop", "No products yet"],
    ["Comics", "No comic series yet"],
  ]) {
    await nav.getByRole("button", { name: label, exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: label })).toBeVisible();
    await expect(page.getByText(empty)).toBeVisible();
    await expect(page).toHaveURL(new RegExp("tab=" + label.toLowerCase()));
  }

  // Create a series from the Comics section; it opens its content fields.
  await page.getByRole("button", { name: "New comic series" }).click();
  await page.getByLabel("Title", { exact: true }).fill("Night train");
  await expect(page.getByRole("button", { name: "Add chapter" })).toBeVisible();

  // Autosave stores a comic page through the draft API.
  await expect
    .poll(async () => {
      const saved = await (await http.get("/api/sites/" + id)).json();
      return saved.draft.pages.find((p: { title: string }) => p.title === "Night train")?.creative?.kind;
    }, { timeout: 15000 })
    .toBe("comic");
  // Pages lists it together with the other pages.
  await nav.getByRole("button", { name: "Pages", exact: true }).click();
  await expect(page.getByText("Night train")).toBeVisible();

  // Other sections only list their own kind.
  await nav.getByRole("button", { name: "Characters", exact: true }).click();
  await expect(page.getByText("Night train")).toHaveCount(0);
  await expect(page.getByText("No characters yet")).toBeVisible();

  // Browser history returns to the previous section.
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1, name: "Pages" })).toBeVisible();
});
