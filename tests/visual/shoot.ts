// The visual cases' screenshot: every case mounted and shot in light and dark on one page per worker
// (sharedTest), once its fonts and icons have settled. VISUAL_THEMES=dark draws one theme only, for
// a quick look while working.
import type { MountOptions } from "../harness/harness.ts";
import { expect, FROZEN, mount, sharedTest } from "../e2e/util.ts";

export const THEMES = (process.env.VISUAL_THEMES || "light,dark").split(",");
type Config = Parameters<typeof mount>[1];
// a case with more than its cards: states of its own, its width, a theme, the time it is drawn at
export interface Shot extends Pick<MountOptions, "states" | "width" | "skin"> {
  cards: Config;
  time?: Date;
}
// a card config has a type (a layout card has `cards` too), a shot has none
const isShot = (c: Config | Shot): c is Shot => !Array.isArray(c) && !("type" in c);

export const shoot = (
  cases: Record<string, Config | Shot>,
  opts: { skins?: Record<string, string>; widths?: Record<string, number> } = {},
) => {
  for (const [name, c] of Object.entries(cases)) {
    const shot: Shot = isShot(c)
      ? c
      : { cards: c, skin: opts.skins?.[name], width: opts.widths?.[name] };
    sharedTest(name, async ({ shared: page }) => {
      // the shared page keeps the clock of the case before: every case sets its own
      if (page.url().includes("localhost")) await page.clock.setFixedTime(shot.time ?? FROZEN);
      for (const theme of THEMES) {
        await mount(page, shot.cards, {
          theme,
          skin: shot.skin,
          width: shot.width,
          states: shot.states,
          time: shot.time,
        });
        // fonts + icons settled: every ha-icon has a path (in its ha-svg-icon), then one more frame
        await page.waitForFunction(() =>
          [...document.querySelectorAll("*")].every(
            (e) =>
              !e.shadowRoot ||
              [...e.shadowRoot.querySelectorAll("ha-icon")].every(
                (i) =>
                  (
                    i.shadowRoot
                      ?.querySelector("ha-svg-icon")
                      ?.shadowRoot?.querySelector("path")
                      ?.getAttribute("d") || ""
                  ).length > 5,
              ),
          ),
        );
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(150);
        // soft: a changed light snapshot still lets the dark one be checked
        await expect.soft(page.locator("#root")).toHaveScreenshot(`${name}-${theme}.png`);
      }
    });
  }
};
