import { test, expect } from "@playwright/test";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

/* Requires the development pair with BILLING_DRIVER=mock (the default):
   the "invoice" is the local simulator and no money moves. */
test("free account upgrades with a simulated confirmed payment, gains paid features, then cancels", async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  const handle = "pay-" + crypto.randomUUID().slice(0, 8),
    email = handle + "@example.test";
  await page.goto("/auth/register");
  await page.getByLabel("Display name").fill("Paying Artist");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel(/Password/).fill("browser-test-password");
  await page.getByRole("checkbox", { name: /Terms/ }).check();
  await page.getByRole("button", { name: /Create your portfolio/ }).click();
  await page.getByLabel("Portfolio address").fill(handle);
  await page.getByLabel("Title", { exact: true }).fill("Paid Garden");
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("button", { name: /Save & exit/ }).click();

  const folder = join(process.env.LOCAL_DATA_DIR!, "mail");
  const letters = await Promise.all((await readdir(folder)).map(async (f) => JSON.parse(await readFile(join(folder, f), "utf8"))));
  const verify = await page.context().newPage();
  await verify.goto(letters.find((m) => m.email === email && m.purpose === "verify").link);
  await verify.getByRole("button", { name: /Verify email/ }).click();
  await expect(verify.getByRole("status")).toContainText("Email verified");
  await verify.close();

  // Free plan: custom domains are locked.
  await page.reload();
  await page.getByRole("button", { name: /Save & exit/ }).click();
  await page.getByRole("navigation").getByRole("button", { name: "Custom domain" }).click();
  await expect(page.getByText("Available on Artist and Studio")).toBeVisible();

  // Choose Artist and pay with the test-mode invoice.
  await page.getByRole("navigation").getByRole("button", { name: "Plan & billing" }).click();
  await expect(page.getByText(/Test mode/)).toBeVisible();
  await page.getByRole("button", { name: "Choose Artist" }).click();
  await page.getByLabel("CPF / CNPJ").fill("529.982.247-25");
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(page.getByRole("heading", { name: "Simulated invoice" })).toBeVisible();
  // Returning without paying grants nothing.
  expect((await (await page.request.get("/api/billing")).json()).plan).toBe("free");
  await page.getByRole("button", { name: "Simulate approved payment" }).click();
  await expect(page.getByRole("status")).toContainText("Payment confirmed");
  await page.getByRole("link", { name: "Back to the studio" }).click();

  // Paid features are enabled from the confirmed payment.
  await expect(page.getByRole("heading", { name: "Plan & billing" })).toBeVisible();
  await expect(page.getByText("Card · renews automatically")).toBeVisible();
  const billing = await (await page.request.get("/api/billing")).json();
  expect(billing.plan).toBe("artist");
  expect(billing.limits.pages).toBe(15);
  await page.getByRole("navigation").getByRole("button", { name: "Custom domain" }).click();
  await expect(page.getByRole("button", { name: "Connect domain" })).toBeVisible();

  // Cancel: no further charges, paid access until the period ends.
  await page.getByRole("navigation").getByRole("button", { name: "Plan & billing" }).click();
  await page.getByRole("button", { name: "Cancel subscription" }).click();
  await expect(page.getByText("Ends at period end")).toBeVisible();
  await expect(page.getByText("Access until")).toBeVisible();
  const after = await (await page.request.get("/api/billing")).json();
  expect(after.plan).toBe("artist");
  expect(after.subscriptions[0].status).toBe("canceling");
  // After the period ends the account returns to Free with content kept;
  // that transition is covered against the database in tests/billing.test.ts.
});
