import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  use: {
    baseURL: process.env.APP_ORIGIN || "http://localhost:3000",
    locale: "en-US",
    trace: "retain-on-failure",
  },
  timeout: 90000,
});
