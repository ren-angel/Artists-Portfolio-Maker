import { test, expect } from "@playwright/test";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
test("mobile artist creates, customizes, uploads, verifies, publishes and visits an SSR portfolio", async ({
  page,
  browser,
}) => {
  const handle = "art-" + crypto.randomUUID().slice(0, 8),
    email = handle + "@example.test";
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/auth/register");
  await page.getByLabel("Display name").fill("Studio Artist");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel(/Password/).fill("browser-test-password");
  await page.getByRole("button", { name: /Create your portfolio/ }).click();
  await page.getByLabel("Portfolio address").fill(handle);
  await page.getByLabel("Title", { exact: true }).fill("Paper Garden");
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("button", { name: "creative", exact: true }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByLabel("Custom gallery").fill("Ink");
  await page.getByRole("button", { name: /Add/ }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page
    .getByLabel("Upload artworks")
    .setInputFiles("apps/web/public/prints/creative.webp");
  await page.locator(".art-cards button").first().click();
  await page.getByLabel("Featured artworks").check();
  await page
    .getByLabel("Image description for accessibility")
    .fill("A print of flowers");
  await page.getByRole("button", { name: /Continue/ }).click();
  await page
    .getByLabel("Description", { exact: true })
    .fill("Original illustrated prints.");
  await page.getByRole("button", { name: /Continue/ }).click();
  const folder = join(process.env.LOCAL_DATA_DIR!, "mail");
  const letters = await Promise.all(
    (await readdir(folder)).map(async (f) =>
      JSON.parse(await readFile(join(folder, f), "utf8")),
    ),
  );
  const verify = await page.context().newPage();
  await verify.goto(
    letters.find((m) => m.email === email && m.purpose === "verify").link,
  );
  await verify.getByRole("button", { name: /Verify email/ }).click();
  await expect(verify.getByRole("status")).toContainText("Email verified");
  await verify.close();
  await page.getByRole("button", { name: /^Publish/ }).click();
  await expect(
    page.getByRole("link", { name: "Visit portfolio" }),
  ).toBeVisible();
  const anonymous = await browser.newContext({ javaScriptEnabled: false });
  const publicPage = await anonymous.newPage();
  const response = await publicPage.goto(
    new URL("/site/" + handle, page.url()).href,
  );
  expect(response?.status()).toBe(200);
  await expect(
    publicPage.getByRole("heading", { name: "Paper Garden" }),
  ).toBeVisible();
  await expect(publicPage.getByAltText("A print of flowers")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await anonymous.close();
});

test("independent artist hosts render their own revisions and ignore forwarded tenant claims", async ({
  request,
}) => {
  const prefix = "routing-" + crypto.randomUUID().slice(0, 8);
  const origin = process.env.APP_ORIGIN || "http://localhost:3000";
  const headers = { origin, "x-studio-request": "1" };
  const domain = process.env.PLATFORM_DOMAIN || "localhost";
  for (const suffix of ["one", "two"]) {
    const handle = prefix + "-" + suffix;
    const email = handle + "@example.test";
    const password = "test-routing-password";
    const registered = await request.post("/api/auth/register", {
      headers,
      data: { email, password, displayName: handle },
    });
    expect(registered.status()).toBe(201);
    const site = await request.post("/api/sites", {
      headers,
      data: { handle, title: handle },
    });
    expect(site.ok()).toBe(true);
    const folder = join(process.env.LOCAL_DATA_DIR!, "mail");
    const messages = await Promise.all(
      (await readdir(folder)).map(async (f) =>
        JSON.parse(await readFile(join(folder, f), "utf8")),
      ),
    );
    const token = messages
      .find((m) => m.email === email && m.purpose === "verify")
      .link.split("#")[1];
    expect(
      (
        await request.post("/api/auth/verify", { headers, data: { token } })
      ).ok(),
    ).toBe(true);
    const id = (await site.json()).id;
    expect(
      (
        await request.post("/api/sites/" + id + "/publish", {
          headers,
          data: { version: 1 },
        })
      ).ok(),
    ).toBe(true);
  }
  for (const [suffix, other] of [
    ["one", "two"],
    ["two", "one"],
  ]) {
    const handle = prefix + "-" + suffix;
    const host = handle + "." + domain;
    const result = await request.get("/", {
      headers: {
        host,
        "x-forwarded-host": prefix + "-" + other + "." + domain,
        "x-portfolio-host": prefix + "-" + other,
      },
    });
    expect(result.status()).toBe(200);
    expect(await result.text()).toMatch(
      new RegExp("<h1[^>]*>" + handle + "</h1>"),
    );
    expect(
      (await request.get("/preview", { headers: { host } })).status(),
    ).toBe(404);
  }
});
