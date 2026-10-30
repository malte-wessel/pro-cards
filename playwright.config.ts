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
  // the harness built and served as files: a page loads one bundle instead of a hundred modules
  // through the dev server, which also no longer competes with the browsers for the CPU (the
  // integration run takes about half as long); the build is a second or two
  webServer: {
    command:
      "npx vite build tests/harness --outDir dist --emptyOutDir --logLevel warn && npx vite preview tests/harness --outDir dist --port 4174 --strictPort",
    url: "http://localhost:4174/",
    // always its own, freshly built: a server left running from an earlier run would serve an old build
    reuseExistingServer: false,
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
