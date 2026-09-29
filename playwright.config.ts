import { defineConfig, devices } from "@playwright/test";

const FROZEN_TIME = "2026-06-21T12:00:00";

export default defineConfig({
  testDir: "tests",
  testMatch: ["e2e/**/*.spec.ts", "visual/**/*.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  timeout: 30_000,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: "disabled" } },
  // one folder of baselines, no platform suffix: visual tests always run in the Playwright Docker image
  snapshotPathTemplate: "{testDir}/visual/__snapshots__/{arg}{ext}",
  use: {
    baseURL: "http://localhost:4174",
    trace: "retain-on-failure",
    timezoneId: "Europe/Berlin",
    locale: "en-GB",
  },
  webServer: {
    command: "npx vite tests/harness --port 4174 --strictPort",
    url: "http://localhost:4174/",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    {
      name: "integration",
      testMatch: "e2e/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1000, height: 800 } },
    },
    {
      name: "visual",
      testMatch: "visual/**/*.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 900, height: 700 },
        deviceScaleFactor: 1,
        colorScheme: "light",
        reducedMotion: "reduce",
      },
    },
  ],
  metadata: { frozenTime: FROZEN_TIME },
});
