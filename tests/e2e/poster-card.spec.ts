// The poster card in a browser: what each kind draws by default (status, value, inputs found on
// the device, controls, backdrops), what the card's own keys change, and that nothing moves when a
// state changes: the parts are kept, the value fits the room the card has.
import type { Locator, Page } from "@playwright/test";
import { test, expect, mount, calls, events, setState, card } from "./util.ts";

const P = "custom:poster-card-pro";
const live = { liveClock: true };

const rect = (loc: Locator) =>
  loc.evaluate((e) => {
    const r = e.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height };
  });
// the box inside the card's border
const inner = (c: Locator) =>
  c.locator("ha-card").evaluate((e) => {
    const r = e.getBoundingClientRect();
    const s = getComputedStyle(e);
    return {
      left: r.left + parseFloat(s.borderLeftWidth),
      right: r.right - parseFloat(s.borderRightWidth),
      top: r.top + parseFloat(s.borderTopWidth),
      bottom: r.bottom - parseFloat(s.borderBottomWidth),
    };
  });
const fontPx = (loc: Locator) => loc.evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
const mark = (loc: Locator) => loc.evaluate((e) => ((e as HTMLElement).dataset.mark = "1"));
const services = async (page: Page) => (await calls(page)).map((c) => `${c.domain}.${c.service}`);
const infos = async (page: Page) => (await events(page)).filter((e) => e.type === "more-info");
// where the poster's texts are, relative to the card
const layoutOf = async (c: Locator) => {
  const box = await inner(c);
  const at = async (sel: string) => {
    const r = await rect(c.locator(sel).first());
    return [Math.round(r.left - box.left), Math.round(r.top - box.top)];
  };
  return { lead: await at(".plead"), name: await at(".pname"), value: await at(".pvalue") };
};
// where a text's last line sits on its baseline (a zero-height marker at its end)
const baselineOf = (loc: Locator) =>
  loc.evaluate((e) => {
    const mark = document.createElement("span");
    mark.style.cssText = "display: inline-block; width: 0; height: 0";
    e.appendChild(mark);
    const y = mark.getBoundingClientRect().bottom;
    mark.remove();
    return y;
  });
// presses a button down for a while (a hold)
const hold = async (page: Page, loc: Locator) => {
  const b = (await loc.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await expect.poll(() => services(page), { timeout: 3000 }).not.toEqual([]);
  await page.mouse.up();
};

test.describe("poster card", () => {
  test("an entity: name and value at the bottom, the rule's label as the status", async ({
    page,
  }) => {
    await mount(page, {
      type: P,
      entity: "sensor.living_room_temperature",
      name: "Living room",
      rules: [
        { below: 20, color: "blue", label: "Cool" },
        { above: 20, color: "orange", label: "Warm" },
      ],
    });
    const c = card(page);
    const row = c.locator(".row.poster");
    await expect(row.locator(".pname")).toHaveText("Living room");
    await expect(row.locator(".pvalue .big b")).toHaveText("21.6");
    const status = row.locator(".corner .pstatus");
    await expect(status).toHaveText("Warm");
    // a new state changes the status in place
    await mark(status);
    await setState(page, "sensor.living_room_temperature", "18");
    await expect(status).toHaveText("Cool");
    await expect(status).toHaveAttribute("data-mark", "1");
    // a tap opens the entity
    await row.locator(".pname").click({ force: true });
    expect(await infos(page)).toEqual([
      { type: "more-info", entityId: "sensor.living_room_temperature" },
    ]);
  });

  test("the status can be written, or left out; with nothing to say it takes no room", async ({
    page,
  }) => {
    await mount(page, [
      { type: P, entity: "sensor.living_room_temperature", status: "Cosy" },
      { type: P, entity: "sensor.living_room_temperature", status: false },
      { type: P, entity: "sensor.living_room_temperature" },
    ]);
    await expect(card(page, 0).locator(".pstatus")).toHaveText("Cosy");
    await expect(card(page, 1).locator(".pstatus")).toHaveCount(0);
    await expect(card(page, 2).locator(".pstatus")).toBeHidden();
  });

  test("badges without an entity read the poster's, beside the status", async ({ page }) => {
    await mount(page, {
      type: P,
      entity: "weather.home",
      badges: ["status", { attribute: "humidity", icon: "mdi:water-percent" }],
    });
    const corner = card(page).locator(".corner");
    const badges = corner.locator(":scope > .hval");
    await expect(badges).toHaveCount(2);
    await expect(badges.nth(0)).toHaveText("Partly cloudy");
    await expect(badges.nth(1)).toContainText("%");
    // a badge is its own button: it opens the poster's entity
    await badges.nth(1).click();
    expect(await infos(page)).toEqual([{ type: "more-info", entityId: "weather.home" }]);
  });

  test("badges float: the texts sit where they sit without them", async ({ page }) => {
    const cfg = { type: P, entity: "sensor.living_room_temperature" };
    await mount(page, [
      { ...cfg, status: false },
      { ...cfg, badges: ["sensor.living_room_humidity", "sensor.pressure"] },
    ]);
    const [bare, badged] = [await layoutOf(card(page, 0)), await layoutOf(card(page, 1))];
    expect(badged).toEqual(bare);
  });

  test("an entity-less poster shows its own texts and opens nothing", async ({ page }) => {
    await mount(page, { type: P, name: "Welcome", value: "Home", icon: "mdi:home" });
    const row = card(page).locator(".row.poster");
    await expect(row.locator(".pname")).toHaveText("Welcome");
    await expect(row.locator(".pvalue")).toContainText("Home");
    await row.locator(".pname").click({ force: true });
    expect(await infos(page)).toEqual([]);
  });

  test("an image lies behind a scrim; image: false drops a kind's picture", async ({ page }) => {
    await mount(page, [
      { type: P, entity: "sensor.living_room_temperature", image: "/local/garden.jpg" },
      { type: P, entity: "person.alex" },
      { type: P, entity: "person.alex", image: false },
    ]);
    const back = card(page, 0).locator(".pback");
    await expect(back).toHaveClass(/scrim/);
    await expect(back.locator("img")).toHaveAttribute("src", "/local/garden.jpg");
    await expect(card(page, 1).locator(".pback.scrim img")).toBeAttached();
    await expect(card(page, 2).locator(".pback img")).toHaveCount(0);
  });
});

test.describe("poster kinds", () => {
  test("wind: detected from the device class, direction and gusts found on its device", async ({
    page,
  }) => {
    await mount(page, { type: P, entity: "sensor.wind_speed" });
    const row = card(page).locator(".row.poster");
    await expect(row.locator(".pvalue .big b")).toHaveText("9.4");
    await expect(row.locator(".pstatus")).toHaveText("Light breeze");
    await expect(row.locator(".ptext > .secondary")).toHaveText("from SW · gusts 18.2 km/h");
    // the animated lead turns where the wind blows
    await expect(row.locator(".plead")).toBeVisible();
    // the predefined rules read km/h whatever the sensor reports
    await setState(page, "sensor.wind_speed", "20", { unit_of_measurement: "m/s" });
    await expect(row.locator(".pstatus")).toHaveText("Gale");
  });

  test("wind with flow: the field fills the poster and keeps running through a new speed", async ({
    page,
  }) => {
    await mount(page, { type: P, entity: "sensor.wind_speed", kind: { flow: "lines" } });
    const c = card(page);
    const field = c.locator(".pback > *");
    await expect(field).toBeAttached();
    const box = await inner(c);
    const f = await rect(c.locator(".pback"));
    expect(Math.abs(f.left - box.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(f.bottom - box.bottom)).toBeLessThanOrEqual(1);
    await mark(field);
    await setState(page, "sensor.wind_speed", "30");
    await expect(c.locator(".pvalue .big b")).toHaveText("30");
    await expect(field).toHaveAttribute("data-mark", "1");
  });

  test("weather: the condition as the status, the temperature as the value", async ({ page }) => {
    await mount(page, { type: P, entity: "weather.home" });
    const row = card(page).locator(".row.poster");
    await expect(row.locator(".pstatus")).toHaveText("Partly cloudy");
    await expect(row.locator(".pvalue .big b")).toHaveText("17.4");
    await setState(page, "weather.home", "rainy");
    await expect(row.locator(".pstatus")).toHaveText("Rainy");
  });

  test("a light: switch and slider; the glow fades with the brightness, nothing moves", async ({
    page,
  }) => {
    await mount(page, { type: P, entity: "light.living_room" });
    const c = card(page);
    const glow = c.locator(".pglow");
    await expect(glow).toHaveCSS("transition-property", "opacity");
    const opacity = () => glow.evaluate((e) => (e as HTMLElement).style.opacity);
    const bright = Number(await opacity());
    expect(bright).toBeGreaterThan(0);
    const before = await layoutOf(c);
    await mark(glow);
    await setState(page, "light.living_room", "on", { brightness: 40 });
    await expect.poll(async () => Number(await opacity())).toBeLessThan(bright);
    await expect(glow).toHaveAttribute("data-mark", "1");
    await setState(page, "light.living_room", "off");
    await expect.poll(opacity).toBe("0");
    expect(await layoutOf(c)).toEqual(before);
    // its controls: the switch on the value's line, the slider below
    const toggle = c.locator(".pmain > .end .toggle");
    await expect(c.locator(".pbody > .ctl-slider")).toBeVisible();
    await toggle.click();
    expect(await services(page)).toEqual(["homeassistant.toggle"]);
  });

  test("a vacuum starts, pauses and docks from its buttons", async ({ page }) => {
    await mount(page, { type: P, entity: "vacuum.robot" });
    const c = card(page);
    await c.locator('.ctl-buttons button[aria-label="Start / pause"]').click();
    await c.locator('.ctl-buttons button[aria-label="Return to dock"]').click();
    expect(await services(page)).toEqual(["vacuum.pause", "vacuum.return_to_base"]);
  });

  test("controls sit beside the value and its line, or under both; the name runs across", async ({
    page,
  }) => {
    const house = {
      type: P,
      entity: "input_select.house_mode",
      name: "House",
      grid_options: { columns: 12 },
    };
    await mount(
      page,
      [
        { type: P, entity: "vacuum.robot", grid_options: { columns: 12 } },
        {
          type: P,
          entity: "climate.bedroom",
          control: "segments",
          control_attribute: "hvac_mode",
          grid_options: { columns: 6 },
        },
        { ...house, control: "select" },
        { ...house, control: false },
      ],
      { width: 400 },
    );
    // beside: the buttons end on the last line's baseline (the line under the value)
    const robot = card(page, 0);
    const value = await rect(robot.locator(".pvalue"));
    const end = await rect(robot.locator(".pmain > .end"));
    expect(end.left).toBeGreaterThan(value.right);
    expect(end.bottom).toBeCloseTo(await baselineOf(robot.locator(".ptext > .secondary")), 0);
    // the name is not cut by the controls: it runs over them
    const name = await rect(robot.locator(".pbody > .pname"));
    expect(name.right).toBeGreaterThan(end.left);
    // under: segments too wide to sit beside go under the line under the value
    const bed = card(page, 1);
    const line = await rect(bed.locator(".ptext > .secondary"));
    const segs = await rect(bed.locator(".pmain > .end"));
    expect(segs.top).toBeGreaterThanOrEqual(line.bottom);
    // the value sits where it sits without a control; the select ends on its baseline
    const [withSelect, without] = [card(page, 2), card(page, 3)];
    const at = async (c: Locator) => (await rect(c.locator(".pvalue"))).top - (await inner(c)).top;
    expect(await at(withSelect)).toBeCloseTo(await at(without), 0);
    const select = await rect(withSelect.locator(".pmain > .end"));
    expect(select.bottom).toBeCloseTo(await baselineOf(withSelect.locator(".pvalue .big b")), 0);
  });

  test("your own buttons with labels sit on the value's line, each in its place", async ({
    page,
  }) => {
    await mount(page, {
      type: P,
      entity: "vacuum.robot",
      control: "buttons",
      control_options: [
        { entity: "scene.dimmed", label: "Dim" },
        { entity: "scene.movie_night", label: "Movie" },
      ],
    });
    const c = card(page);
    const chips = c.locator(".pmain > .end .ctl-buttons.custom > .chip");
    await expect(chips).toHaveCount(2);
    const [a, b] = [await rect(chips.nth(0)), await rect(chips.nth(1))];
    // side by side on the value's line, below the lead (no band's chip style pins them)
    expect(b.left).toBeGreaterThanOrEqual(a.right);
    expect(a.top).toBeGreaterThan((await rect(c.locator(".plead"))).bottom);
    await chips.nth(1).click();
    expect(await services(page)).toEqual(["scene.turn_on"]);
  });

  test("a lock is held to open, from its lead", async ({ page }) => {
    await mount(page, { type: P, entity: "lock.front_door" }, live);
    const h = card(page).locator(".plead .ctl-hold");
    await expect(h).toHaveAttribute("aria-label", "Hold to unlock");
    // the lead shows the lock as it is, the label what the hold does
    await expect(h.locator("ha-icon")).toHaveAttribute("icon", "mdi:lock");
    await hold(page, h);
    expect(await services(page)).toEqual(["lock.unlock"]);
  });

  test("an alarm panel: armed by a hold, its shield pulses when triggered", async ({ page }) => {
    await mount(page, { type: P, entity: "alarm_control_panel.home" }, live);
    const c = card(page);
    await hold(page, c.locator(".plead .ctl-hold"));
    expect(await services(page)).toEqual(["alarm_control_panel.alarm_arm_away"]);
    await setState(page, "alarm_control_panel.home", "triggered");
    await expect(c.locator(".palarm")).toHaveClass(/on/);
  });

  test("an appliance that has run longer than its history shows its power", async ({ page }) => {
    await mount(page, [
      {
        type: P,
        entity: "sensor.heat_pump_power",
        kind: { type: "appliance", style: "heat_pump", running_above: 50 },
      },
      { type: P, entity: "sensor.washer_power", kind: { type: "appliance", style: "washer" } },
    ]);
    const pump = card(page, 0);
    await expect(pump.locator(".pstatus")).toHaveText("Running");
    await expect(pump.locator(".pvalue .big")).toHaveText(/^\d+\s*W$/);
    await expect(pump.locator(".ptext > .secondary")).toHaveText(/kWh in the last 24 h$/);
    // a pump turned off: Off, no line under it
    await setState(page, "sensor.heat_pump_power", "0");
    await expect(pump.locator(".pvalue .big")).toHaveText("Off");
  });

  test("a media player's volume gives way on a card too short for it", async ({ page }) => {
    const cfg = { type: P, entity: "media_player.living_room_tv" };
    await mount(
      page,
      [
        { ...cfg, grid_options: { columns: 6, rows: 3 } },
        { ...cfg, grid_options: { columns: 9, rows: 4 } },
      ],
      { width: 400 },
    );
    const short = card(page, 0),
      tall = card(page, 1);
    await expect(tall.locator(".pbody > .ctl-slider")).toBeVisible();
    await expect(short.locator(".pbody > .ctl-slider")).toBeHidden();
    // the transport stays, and the icon is whole inside the card
    await expect(short.locator(".ctl-buttons")).toBeVisible();
    const box = await inner(short);
    expect((await rect(short.locator(".plead"))).top - box.top).toBeGreaterThan(8);
    // the progress along the edge does not count: the tall card's title is full size
    expect(await fontPx(tall.locator(".pvalue .big b"))).toBeGreaterThan(
      await fontPx(short.locator(".pvalue .big b")),
    );
  });

  test("the sun without an entity: the next event, how soon, the curve", async ({ page }) => {
    await mount(page, { type: P, kind: "sun" });
    const row = card(page).locator(".row.poster");
    await expect(row.locator(".pname")).toHaveText("Sunset");
    await expect(row.locator(".pstatus")).toContainText(/in \d+ hours?/i);
    await expect(row.locator(".pcurve.psun")).toBeVisible();
  });
});

test.describe("poster value fit", () => {
  test("a value shrinks where the card is short of room and is full size where it is not", async ({
    page,
  }) => {
    const cfg = { type: P, entity: "climate.living_room" };
    await mount(
      page,
      [
        { ...cfg, grid_options: { columns: 6, rows: 3 } },
        { ...cfg, grid_options: { columns: 12, rows: 4 } },
      ],
      { width: 400 },
    );
    const small = card(page, 0),
      big = card(page, 1);
    const b = (c: Locator) => c.locator(".pvalue .big b");
    await expect.poll(() => fontPx(b(small))).toBeLessThan(await fontPx(b(big)));
    // the room it gives up keeps the top line at the card's padding
    const box = await inner(small);
    expect((await rect(small.locator(".ptop"))).top - box.top).toBeCloseTo(16, 0);
    // a new value never makes it larger again (no jump back and forth)
    const px = await fontPx(b(small));
    await setState(page, "climate.living_room", "heat", { current_temperature: 19 });
    await expect(b(small)).toHaveText("19");
    expect(await fontPx(b(small))).toBe(px);
  });
});

test.describe("poster cards in the layout card", () => {
  test("every cell of a row has the same height", async ({ page }) => {
    // a poster's height in the harness grid: three 56 px rows and two 8 px gaps
    const ROWS3 = 3 * 56 + 2 * 8;
    await mount(
      page,
      {
        type: "custom:layout-card-pro",
        columns: 4,
        cards: [
          { type: P, entity: "weather.home" },
          { type: P, kind: "sun" },
          { type: P, entity: "sensor.wind_speed", kind: { flow: "lines" } },
          { type: P, entity: "sensor.ev_battery", badges: ["sensor.ev_range"] },
          { type: P, entity: "sensor.solar_power", visual: "sparkline" },
          { type: P, entity: "light.kitchen" },
          {
            type: "custom:entity-group-card-pro",
            title: "Living room",
            layout: "table",
            vertical_align: "bottom",
            view_layout: { span: [1, 3] },
            entities: [
              { entity: "light.desk_lamp", control: "toggle" },
              { entity: "light.living_room", control: "slider" },
            ],
          },
          { type: P, kind: { type: "trend", entities: ["sensor.power_consumption"] } },
        ],
      },
      { width: 960 },
    );
    const rows = await page.evaluate(() => {
      const el = window.pc.card(0);
      const out: Record<number, { item: number; card: number }[]> = {};
      for (const it of el.shadowRoot!.querySelectorAll<HTMLElement>(".body .item")) {
        const b = it.getBoundingClientRect();
        const inner = it.querySelector("hui-card")?.firstElementChild as HTMLElement | null;
        const ha = inner?.shadowRoot?.querySelector("ha-card")?.getBoundingClientRect();
        (out[Math.round(b.top)] ??= []).push({
          item: Math.round(b.height),
          card: Math.round(ha?.height ?? -1),
        });
      }
      return Object.values(out);
    });
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row).toHaveLength(4);
      const h = row[0].item;
      expect(h).toBe(ROWS3);
      for (const cell of row) {
        expect(cell.item).toBe(h);
        expect(cell.card).toBe(h);
      }
    }
  });
});
