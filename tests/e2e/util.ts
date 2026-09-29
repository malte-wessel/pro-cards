import { test, expect, type Locator, type Page } from "@playwright/test";
import type { CardConfigBase } from "../../src/shared/ha.ts";
import type { MountOptions } from "../harness/harness.ts";

export const FROZEN = new Date("2026-06-21T12:00:00");

export interface MountOpts extends MountOptions {
  liveClock?: boolean;
  time?: Date;
}

// Opens the harness (with a frozen clock unless opts.liveClock) and mounts one config or a list.
export async function mount(
  page: Page,
  cfg: CardConfigBase | CardConfigBase[],
  opts: MountOpts = {},
): Promise<number> {
  if (!page.url().includes("localhost")) {
    if (!opts.liveClock) await page.clock.setFixedTime(opts.time || FROZEN);
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
      { theme: opts.theme, skin: opts.skin, width: opts.width, fullWidth: opts.fullWidth },
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
export const card = (page: Page, i = 0): Locator =>
  page.locator("#root .cell").nth(i).locator("> *");
export { test, expect };
