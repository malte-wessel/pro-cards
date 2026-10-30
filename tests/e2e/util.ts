import { test, expect, type Locator, type Page } from "@playwright/test";
import type { CardConfigBase } from "../../src/shared/ha.ts";
import type { MountOptions } from "../harness/harness.ts";

export const FROZEN = new Date("2026-06-21T12:00:00");
// a stand-in cover, its colour from the image's id, so the speakers' songs tell apart (one song
// and the next always differ)
const COVERS = ["#7d7d7d", "#c0392b", "#138d75", "#d68910", "#7d3c98"];
const coverOf = (url: string) => {
  const id = url.slice(url.lastIndexOf("/") + 1);
  const i = [...id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % COVERS.length;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="${COVERS[i]}"/></svg>`;
};

export interface MountOpts extends MountOptions {
  liveClock?: boolean;
  time?: Date;
}

// `test` with one page per worker (`shared`): the harness loads once and every test mounts into
// it again (mount resets the theme, skin, width and the harness's records). For tests that only
// mount and look (the docs examples, the visual cases); one that clicks or sets a state takes a
// page of its own. The page's clock is the first mount's (frozen unless opts.liveClock)
export const sharedTest = test.extend<object, { shared: Page }>({
  shared: [
    async ({ browser }, use, info) => {
      const u = info.project.use;
      const context = await browser.newContext({
        baseURL: u.baseURL,
        viewport: u.viewport,
        deviceScaleFactor: u.deviceScaleFactor,
        userAgent: u.userAgent,
        colorScheme: u.colorScheme,
        reducedMotion: u.reducedMotion,
        timezoneId: u.timezoneId,
        locale: u.locale,
      });
      await use(await context.newPage());
      await context.close();
    },
    { scope: "worker" },
  ],
});

// Opens the harness (with a frozen clock unless opts.liveClock) and mounts one config or a list.
export async function mount(
  page: Page,
  cfg: CardConfigBase | CardConfigBase[],
  opts: MountOpts = {},
): Promise<number> {
  if (!page.url().includes("localhost")) {
    if (!opts.liveClock) await page.clock.setFixedTime(opts.time || FROZEN);
    // the demo speakers' cover art is on Spotify's image CDN: the tests stay offline, every
    // cover a plain colour
    await page.route("https://i.scdn.co/**", (r) =>
      r.fulfill({
        contentType: "image/svg+xml",
        headers: { "access-control-allow-origin": "*" },
        body: coverOf(r.request().url()),
      }),
    );
    await page.goto("/");
    await page.waitForFunction(() => window.__pcReady === true);
  }
  const count = await page.evaluate(
    ([c, o]) => {
      window.pc.reset();
      return window.pc.mount(c, o);
    },
    [
      cfg,
      {
        theme: opts.theme,
        skin: opts.skin,
        width: opts.width,
        fullWidth: opts.fullWidth,
        layout: opts.layout,
      },
    ] as const,
  );
  await page.evaluate(() => window.pc.settled());
  return count;
}

export const calls = (page: Page) => page.evaluate(() => window.pc.calls);
export const events = (page: Page) => page.evaluate(() => window.pc.events);
export const actions = (page: Page) => page.evaluate(() => window.pc.actions);
export const state = (page: Page, id: string) =>
  page.evaluate((i) => window.pc.world.get(i)?.state, id);
export const setState = (page: Page, id: string, s?: string, attrs?: Record<string, unknown>) =>
  page.evaluate(([i, v, a]) => window.pc.world.set(i, v, a), [id, s, attrs] as const);
// switch the frontend language the mounted cards see (they re-render at once)
export const setLanguage = (page: Page, language: string) =>
  page.evaluate((l) => window.pc.setLanguage(l), language);
// log a user in (by id) or out (null); the mounted cards re-render at once
export const setUser = (page: Page, id: string | null) =>
  page.evaluate((u) => window.pc.setUser(u), id);
export const card = (page: Page, i = 0): Locator =>
  page.locator("#root .cell").nth(i).locator("> *");
export { test, expect };
