// Renders scripts/og.html to docs/public/og.png, the 1200×630 social preview linked from the docs <head>.
// Run with `npm run docs:og` after changing the template; the PNG is committed.
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";

const html = new URL("./og.html", import.meta.url);
const out = fileURLToPath(new URL("../docs/public/og.png", import.meta.url));

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.goto(html.href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out, type: "png" });
await browser.close();
console.log(`wrote ${out}`);
