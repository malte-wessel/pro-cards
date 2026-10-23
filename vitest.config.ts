import { defineConfig } from "vitest/config";

// the unit tests run in one zone with DST, the zone of the e2e tests (playwright.config.ts), so
// the clock maths is checked across DST changes on every machine; set before the workers start
process.env.TZ = "Europe/Berlin";

export default defineConfig({
  define: { __VERSION__: JSON.stringify("test") },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "happy-dom",
  },
});
