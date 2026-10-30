// The visual cases' screenshot: every case mounted and shot in light and dark on one page per worker
// (sharedTest), once its fonts and icons have settled. VISUAL_THEMES=dark draws one theme only, for
// a quick look while working.
import type { MountOptions, ViewSection } from "../harness/harness.ts";
import { expect, FROZEN, mount, mountView, sharedTest } from "../e2e/util.ts";

export const THEMES = (process.env.VISUAL_THEMES || "light,dark").split(",");
type Config = Parameters<typeof mount>[1];
// a case with more than its cards: states of its own, its width, a theme, the layout (null: a
// masonry view), the time it is drawn at; or a dashboard's `sections`, laid out as a sections view
// as wide as the page (the project's device: its name goes into the screenshot's)
export interface Shot extends Pick<MountOptions, "states" | "width" | "skin" | "layout"> {
  cards?: Config;
  sections?: ViewSection[];
  time?: Date;
}
// a card config has a type (a layout card has `cards` too), a shot has none
const isShot = (c: Config | Shot): c is Shot => !Array.isArray(c) && !("type" in c);
// the harness page's padding on each side (index.html: body)
const BODY_PAD = 16;

export const shoot = (
  cases: Record<string, Config | Shot>,
  opts: { skins?: Record<string, string>; widths?: Record<string, number> } = {},
) => {
  for (const [name, c] of Object.entries(cases)) {
    const shot: Shot = isShot(c)
      ? c
      : { cards: c, skin: opts.skins?.[name], width: opts.widths?.[name] };
    sharedTest(name, async ({ shared: page }, info) => {
      // the shared page keeps the clock of the case before: every case sets its own
      if (page.url().includes("localhost")) await page.clock.setFixedTime(shot.time ?? FROZEN);
      const device = info.project.metadata?.device as string | undefined;
      const file = device ? `${name}-${device}` : name;
      for (const theme of THEMES) {
        const o = {
          theme,
          skin: shot.skin,
          width: shot.width,
          states: shot.states,
          layout: shot.layout,
          time: shot.time,
        };
        if (shot.sections) {
          const vw = page.viewportSize()?.width ?? 900;
          await mountView(page, shot.sections, { ...o, width: shot.width ?? vw - 2 * BODY_PAD });
        } else await mount(page, shot.cards ?? [], o);
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
        await expect.soft(page.locator("#root")).toHaveScreenshot(`${file}-${theme}.png`);
      }
    });
  }
};
