// The tile card in a browser: the line under the name (the value, the status, the secondary), what
// each poster type puts there and at its end, the icon (a kind's animated lead kept through fills,
// a picture, its own actions), and what the card's own keys change.
import type { Page } from "@playwright/test";
import { test, expect, mount, calls, events, setState, card } from "./util.ts";

const T = "custom:tile-card-pro";
const live = { liveClock: true };

const line = (page: Page, i = 0) => card(page, i).locator(".row.tile .secondary");
const services = async (page: Page) => (await calls(page)).map((c) => `${c.domain}.${c.service}`);
const infos = async (page: Page) => (await events(page)).filter((e) => e.type === "more-info");

test.describe("tile line", () => {
  test("shows the value, then the status, then the secondary", async ({ page }) => {
    await mount(page, [
      { type: T, entity: "sensor.living_room_co2" },
      { type: T, entity: "sensor.living_room_co2", secondary: "Upstairs" },
      { type: T, entity: "sensor.living_room_co2", status: false },
      { type: T, entity: "sensor.living_room_co2", status: "{{ 'Open the window' }}" },
      { type: T, entity: "sensor.living_room_co2", show_value: false },
    ]);
    await expect(line(page, 0)).toHaveText("742 ppm · Good");
    await expect(line(page, 1)).toHaveText("742 ppm · Good · Upstairs");
    await expect(line(page, 2)).toHaveText("742 ppm");
    await expect(line(page, 3)).toHaveText("742 ppm · Open the window");
    await expect(line(page, 4)).toHaveText("Good");
  });

  test("fills the line the poster type's way and leaves out a status that repeats the value", async ({
    page,
  }) => {
    await mount(page, [
      { type: T, entity: "climate.living_room" },
      { type: T, entity: "fan.bedroom" },
      { type: T, entity: "vacuum.robot" },
      { type: T, entity: "sensor.wind_speed" },
    ]);
    await expect(line(page, 0)).toHaveText("21.6 °C · Heating");
    await expect(line(page, 1)).toHaveText("Off");
    await expect(line(page, 2)).toHaveText(/^Cleaning · /);
    await expect(line(page, 2)).not.toHaveText(/Cleaning · Cleaning/);
    await expect(line(page, 3)).toHaveText(/^9\.4 km\/h · Breezy · .*gusts/i);
  });

  test("draws the type's controls at the line's end, a slider below only when asked", async ({
    page,
  }) => {
    await mount(page, [
      { type: T, entity: "light.desk_lamp" },
      { type: T, entity: "cover.living_room_blinds" },
      { type: T, entity: "light.desk_lamp", control: "slider" },
    ]);
    await expect(card(page, 0).locator(".line > .end .toggle")).toHaveCount(1);
    await expect(card(page, 0).locator(".ctl-slider")).toHaveCount(0);
    await expect(card(page, 1).locator(".line > .end .ctl-buttons button")).toHaveCount(3);
    await expect(card(page, 2).locator(".row.tile > .ctl-slider")).toHaveCount(1);
    await card(page, 0).locator(".line > .end .toggle").click();
    expect(await services(page)).toEqual(["homeassistant.toggle"]);
  });
});

test.describe("tile pictures", () => {
  test("draws the type's picture below the line only when asked, its edge and glow always", async ({
    page,
  }) => {
    await mount(page, [
      { type: T, entity: "sun.sun" },
      { type: T, entity: "sun.sun", show_picture: true },
      { type: T, entity: "media_player.living_room_speaker" },
      { type: T, entity: "light.desk_lamp" },
      { type: T, entity: "light.desk_lamp", visual: "none" },
    ]);
    await expect(card(page, 0).locator(".row.tile > .psun")).toHaveCount(0);
    await expect(card(page, 1).locator(".row.tile > .psun svg .curve").first()).toBeVisible();
    // the picture keeps below the line
    const line = await card(page, 1).locator(".row.tile > .top").boundingBox();
    const plot = await card(page, 1).locator(".row.tile > .psun").boundingBox();
    expect(plot!.y).toBeGreaterThanOrEqual(line!.y + line!.height);
    // the progress runs along the bottom edge, taking no row
    await expect(card(page, 2).locator(".row.tile > .pprog")).toHaveCSS("position", "absolute");
    // a light glows as strong as its brightness; none without it
    await expect
      .poll(() =>
        card(page, 3)
          .locator(".body > .tglow")
          .evaluate((e) => getComputedStyle(e).opacity),
      )
      .not.toBe("0");
    await expect(card(page, 4).locator(".body > .tglow")).toHaveCount(0);
  });
});

test.describe("vertical tile", () => {
  test("puts the icon on top, the name and the value centred under it, the controls below", async ({
    page,
  }) => {
    await mount(page, [
      { type: T, entity: "cover.living_room_blinds", vertical: true },
      { type: T, entity: "sensor.wind_speed", vertical: true },
      { type: T, entity: "sensor.wind_speed", vertical: true, secondary: "Roof" },
    ]);
    const c = card(page, 0);
    const box = async (sel: string) => (await c.locator(sel).first().boundingBox())!;
    const lead = await box(".tlead"),
      name = await box(".primary"),
      text = await box(".secondary"),
      ctl = await box(".line > .end"),
      tile = await box("ha-card");
    // stacked: the icon, the name, the line, the controls
    expect(lead.y + lead.height).toBeLessThanOrEqual(name.y);
    expect(name.y + name.height).toBeLessThanOrEqual(text.y + 1);
    expect(text.y + text.height).toBeLessThanOrEqual(ctl.y);
    // centred across the tile
    const mid = tile.x + tile.width / 2;
    for (const b of [lead, ctl]) expect(Math.abs(b.x + b.width / 2 - mid)).toBeLessThan(2);
    await expect(c.locator(".primary")).toHaveCSS("text-align", "center");
    // the type's line under the value is left out; a written one stays
    await expect(line(page, 1)).toHaveText("9.4 km/h · Breezy");
    await expect(line(page, 2)).toHaveText("9.4 km/h · Breezy · Roof");
  });
});

test.describe("tile card", () => {
  test("a tap opens the entity; without an entity it does nothing", async ({ page }) => {
    await mount(page, [
      { type: T, entity: "sensor.living_room_temperature" },
      { type: T, name: "Note", value: "Hello" },
    ]);
    await expect(card(page, 1).locator(".primary")).toHaveText("Note");
    await expect(line(page, 1)).toHaveText("Hello");
    await card(page, 1).locator(".row.tile").click();
    expect(await infos(page)).toEqual([]);
    await card(page, 0).locator(".row.tile").click();
    expect(await infos(page)).toEqual([
      { type: "more-info", entityId: "sensor.living_room_temperature" },
    ]);
  });

  test("leaves out the icon or the name when told to", async ({ page }) => {
    await mount(page, [
      { type: T, entity: "sensor.living_room_temperature", show_icon: false },
      { type: T, entity: "sensor.living_room_temperature", show_name: false },
    ]);
    await expect(card(page, 0).locator(".tlead")).toBeHidden();
    await expect(card(page, 0).locator(".primary")).toHaveText("Living room temperature");
    await expect(card(page, 1).locator(".tlead .lead")).toBeVisible();
    await expect(card(page, 1).locator(".primary")).toHaveCount(0);
  });

  test("keeps a kind's animated icon through new states, at the tile's size", async ({ page }) => {
    await mount(page, { type: T, entity: "fan.living_room" }, live);
    const fan = card(page).locator(".tlead > .lead.pfan");
    await expect(fan).toHaveCSS("width", "36px");
    await fan.evaluate((e) => ((e as HTMLElement).dataset.mark = "1"));
    await setState(page, "fan.living_room", "on", { percentage: 100 });
    await expect(line(page)).toHaveText(/^100 %/);
    await expect(card(page).locator(".tlead > .lead.pfan[data-mark]")).toHaveCount(1);
  });

  test("draws a kind's animated icon with its first fill, so a resize changes nothing", async ({
    page,
  }) => {
    // the speeds wrap under the line at this width: an icon drawn a render late moved them
    await mount(
      page,
      { type: T, entity: "fan.living_room", grid_options: { columns: 6 } },
      {
        width: 500,
      },
    );
    await expect(card(page).locator(".tlead > .lead.pfan")).toHaveCount(1);
    await expect(card(page).locator(".row.tile > .top")).toHaveCount(1);
    expect(await page.evaluate(() => window.pc.errors)).toEqual([]);
  });

  test("icon_image puts a picture in the icon; icon_tap_action runs from it alone", async ({
    page,
  }) => {
    await mount(page, [
      { type: T, entity: "sensor.wind_speed", icon_image: "/local/a.png" },
      { type: T, entity: "light.desk_lamp", icon_tap_action: { action: "toggle" } },
    ]);
    await expect(card(page, 0).locator(".tlead img.picture")).toHaveAttribute(
      "src",
      "/local/a.png",
    );
    await card(page, 1).locator(".tlead .lead").click();
    expect(await services(page)).toEqual(["homeassistant.toggle"]);
    expect(await infos(page)).toEqual([]);
  });
});
