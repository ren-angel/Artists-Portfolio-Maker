import { expect, test } from "@playwright/test";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Draft } from "@studio/shared";

test("artist publishes a comic from Pages and a mobile reader resumes the right-to-left chapter", async ({
  page,
  browser,
}) => {
  const http = page.request,
    origin = process.env.APP_ORIGIN || "http://localhost:3000";
  const headers = { origin, "x-studio-request": "1" };
  const handle = "reader-" + crypto.randomUUID().slice(0, 8),
    email = handle + "@example.test";
  expect(
    (
      await http.post("/api/auth/register", {
        headers,
        data: {
          email,
          password: "test-creative-password",
          displayName: "Comic artist",
          accept: true,
        },
      })
    ).status(),
  ).toBe(201);
  const folder = join(process.env.LOCAL_DATA_DIR!, "mail");
  const letters = await Promise.all(
    (await readdir(folder)).map(async (f) =>
      JSON.parse(await readFile(join(folder, f), "utf8")),
    ),
  );
  const token = letters
    .find((m) => m.email === email && m.purpose === "verify")
    .link.split("#")[1];
  expect(
    (await http.post("/api/auth/verify", { headers, data: { token } })).ok(),
  ).toBeTruthy();
  const { id } = await (
    await http.post("/api/sites", {
      headers,
      data: { handle, title: "Paper studio", language: "en" },
    })
  ).json();
  const path = "/api/sites/" + id;
  const data = await readFile("tests/fixtures/placeholder.webp");
  for (const title of ["Arrival", "Departure"]) {
    const { id } = await (
      await http.post(path + "/uploads", {
        headers,
        data: { bytes: data.length },
      })
    ).json();
    expect(
      (
        await http.put(path + "/uploads/" + id, {
          headers: { ...headers, "content-type": "application/octet-stream" },
          data,
        })
      ).ok(),
    ).toBeTruthy();
    expect(
      (
        await http.post(path + "/uploads/" + id + "/finish", {
          headers,
          data: { title },
        })
      ).ok(),
    ).toBeTruthy();
  }
  await page.goto("/studio?tab=pages");
  await page.getByLabel("Page type").selectOption("comic");
  await page.getByRole("button", { name: "Add a page", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill("Night train");
  await page.getByLabel("Include in next publication").check();
  await page.getByRole("button", { name: "Add chapter" }).click();
  await page.locator("summary").filter({ hasText: "New chapter" }).click();
  await page.getByLabel("Chapter title").fill("Leaving home");
  await page.getByLabel("Include chapter in publication").check();
  const chapter = page
    .locator("details")
    .filter({ has: page.getByLabel("Chapter title") });
  await chapter
    .getByLabel("Add artwork from library")
    .selectOption({ label: "Departure" });
  await chapter
    .getByLabel("Add artwork from library")
    .selectOption({ label: "Arrival" });
  await chapter
    .getByRole("button", { name: "Move up", exact: true })
    .nth(1)
    .click();
  const getSite = async () =>
    (await (await http.get(path)).json()) as { version: number; draft: Draft };
  await expect
    .poll(async () => {
      const { draft } = await getSite();
      const p = draft.pages.find((p) => p.title === "Night train");
      return p?.creative?.chapters[0]?.artIds.map(
        (id) => draft.artworks.find((a) => a.id === id)?.title,
      );
    })
    .toEqual(["Arrival", "Departure"]);
  const saved = await getSite();
  expect(
    (
      await http.post(path + "/publish", {
        headers,
        data: { version: saved.version },
      })
    ).ok(),
  ).toBeTruthy();
  const series = saved.draft.pages.find((p) => p.title === "Night train")!;
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  try {
    const reader = await context.newPage();
    await reader.goto(origin + "/site/" + handle + "/" + series.slug);
    await reader.getByRole("link", { name: /Leaving home/ }).click();
    await reader.getByLabel("Reading mode").selectOption("rtl");
    const region = reader.getByLabel("Comic reader", { exact: true });
    await expect(region.getByAltText("Arrival")).toBeVisible();
    await region.focus();
    await reader.keyboard.press("ArrowLeft");
    await expect(region.getByAltText("Departure")).toBeVisible();
    await reader.reload();
    await expect(reader.getByAltText("Departure")).toBeVisible();
    await expect(reader.getByLabel("Reading mode")).toHaveValue("rtl");
    expect(
      await reader.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  } finally {
    await context.close();
  }
});

test("editor undoes and redoes a change, saves a reusable section and restores a persisted page revision", async ({
  page,
}) => {
  const http = page.request,
    handle = "editor-" + crypto.randomUUID().slice(0, 8);
  const headers = {
    origin: process.env.APP_ORIGIN || "http://localhost:3000",
    "x-studio-request": "1",
  };
  await http.post("/api/auth/register", {
    headers,
    data: {
      email: handle + "@example.test",
      password: "test-creative-password",
      displayName: "Designer",
      accept: true,
    },
  });
  const { id } = await (
    await http.post("/api/sites", {
      headers,
      data: { handle, title: "Design studio", language: "en" },
    })
  ).json();
  const read = async () =>
    (await (await http.get("/api/sites/" + id)).json()) as {
      draft: Draft;
      version: number;
    };
  await page.setViewportSize({ width: 1536, height: 960 });
  await page.goto("/studio?tab=editor");
  await page.locator("[data-block]").first().click();
  const headline = page.getByRole("textbox", { name:"Headline",exact:true });
  await headline.fill("First cover");
  await expect
    .poll(async () => (await read()).draft.pages[0].blocks[0].heading)
    .toBe("First cover");
  const version = (await read()).version;
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(headline).toHaveValue("");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(headline).toHaveValue("First cover");
  await headline.fill("Second cover");
  await expect
    .poll(async () => (await read()).draft.pages[0].blocks[0].heading)
    .toBe("Second cover");
  await page.getByRole("tab", { name: "Pages", exact: true }).click();
  await page.getByText("History & saved sections", { exact: true }).click();
  await page.getByLabel("Section name", { exact: true }).fill("Cover copy");
  await page.getByRole("button", { name: "Save selected section" }).click();
  await page.getByRole("button", { name: "Insert · Cover copy" }).click();
  await expect
    .poll(async () => (await read()).draft.pages[0].blocks.length)
    .toBe(4);
  page.on("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: new RegExp("^Restore #" + version + " ") })
    .click();
  await expect
    .poll(async () =>
      (await read()).draft.pages[0].blocks.map((b) => b.heading),
    )
    .toEqual(["First cover", "", ""]);
  await page.reload();
  await page.locator("[data-block]").first().click();
  await expect(headline).toHaveValue("First cover");
});
