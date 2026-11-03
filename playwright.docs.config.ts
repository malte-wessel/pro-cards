import { defineConfig, devices } from "@playwright/test";

// The docs site's own tests (the Playground, the examples' Edit links), against the built site:
// `npm run docs:build` first, `npm run test:docs` serves docs/.vitepress/dist and runs them
export default defineConfig({
  testDir: "tests/docs",
  testMatch: "**/*.spec.ts",
  // a folder of its own: an integration run clears test-results/ when it starts
  outputDir: "test-results-docs",
  fullyParallel: true,
  // every page loads the whole docs runtime: more browsers at once only make each one slower
  workers: process.env.CI ? 2 : 4,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  timeout: 30_000,
  use: {
    // the site's base path
    baseURL: "http://localhost:4175/pro-cards/",
    trace: "retain-on-failure",
    timezoneId: "Europe/Berlin",
    locale: "en-GB",
  },
  webServer: {
    command: "npx vitepress preview docs --port 4175 --strictPort",
    url: "http://localhost:4175/pro-cards/",
    // always its own: a server left running would serve an older build
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [
    {
      name: "docs",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
  ],
});
