// The poster card in a browser: what each poster type draws by default (status, value, inputs found on
// the device, controls, backdrops), what the card's own keys change, and that nothing moves when a
// state changes: the parts are kept, the value fits the room the card has.
import type { Locator, Page } from "@playwright/test";
import { test, expect, mount, calls, events, actions, setState, card } from "./util.ts";

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
  const end = c.locator(".pmain > .end");
  return {
    lead: await at(".plead"),
    name: await at(".pname"),
    value: await at(".pvalue"),
    controls: (await end.count()) ? await at(".pmain > .end") : null,
  };
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
// from the name's bottom to the top of the value's capitals, where they are drawn
const nameGapOf = async (c: Locator) => {
  const b = c.locator(".pvalue .big b");
  const base = await baselineOf(b);
  return base - (await fontPx(b)) * 0.711 - (await rect(c.locator(".pname"))).bottom;
};
// the glow's opacity as the card set it (not mid-transition)
const glowOf = (c: Locator) =>
  c.locator(".pglow").evaluate((e) => (e as HTMLElement).style.opacity);
// what setConfig throws for a config, or null
const configError = (page: Page, cfg: Record<string, unknown>) =>
  page.evaluate((c) => {
    const el = document.createElement("poster-card-pro") as HTMLElement & {
      setConfig(c: unknown): void;
    };
    try {
      el.setConfig({ type: "custom:poster-card-pro", ...c });
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  }, cfg);
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

  test("an entity-less poster's badges open their own entities", async ({ page }) => {
    await mount(page, {
      type: P,
      name: "Living room",
      icon: "mdi:sofa",
      badges: ["sensor.living_room_temperature"],
    });
    await card(page).locator(".corner > .hval:not(.pstatus)").click();
    expect(await infos(page)).toEqual([
      { type: "more-info", entityId: "sensor.living_room_temperature" },
    ]);
  });

  test("show_name, show_icon and show_value leave their part out", async ({ page }) => {
    const cfg = { type: P, entity: "sensor.wind_speed" };
    await mount(page, [
      { ...cfg, show_name: false },
      { ...cfg, show_icon: false },
      { ...cfg, show_value: false },
    ]);
    const [noName, noIcon, noValue] = [0, 1, 2].map((i) => card(page, i).locator(".row.poster"));
    await expect(noName.locator(".pname")).toHaveCount(0);
    await expect(noName.locator(".pvalue")).toContainText("9.4");
    // the wind's animated icon goes too
    await expect(noIcon.locator(".plead > *")).toHaveCount(0);
    await expect(noIcon.locator(".pname")).toHaveText("Wind speed");
    await expect(noValue.locator(".pvalue")).toHaveCount(0);
    // the line under the value stays
    await expect(noValue.locator(".pmain .secondary")).toContainText("gusts");
  });

  test("a picture without data says so inside the card's padding", async ({ page }) => {
    await mount(page, [
      { type: P, entity: "sensor.robot_current_room", visual: "sparkline" },
      { type: P, entity: "sensor.robot_current_room", visual: "columns" },
    ]);
    for (const i of [0, 1]) {
      const c = card(page, i);
      const label = c.locator(".plot .label.placeholder");
      await expect(label).toHaveText("no data");
      const [box, name] = [await inner(c), await rect(c.locator(".pname"))];
      // where the texts start, as they do
      expect(Math.round((await rect(label)).left)).toBe(Math.round(name.left));
      expect((await rect(label)).left - box.left).toBeGreaterThanOrEqual(15);
    }
  });

  test("an image lies behind a scrim; image: false drops a poster type's picture", async ({
    page,
  }) => {
    await mount(page, [
      { type: P, entity: "sensor.living_room_temperature", image: "/local/garden.jpg" },
      { type: P, entity: "person.malte" },
      { type: P, entity: "person.malte", image: false },
    ]);
    const back = card(page, 0).locator(".pback");
    await expect(back).toHaveClass(/scrim/);
    await expect(back.locator("img")).toHaveAttribute("src", "/local/garden.jpg");
    await expect(card(page, 1).locator(".pback.scrim img")).toBeAttached();
    await expect(card(page, 2).locator(".pback img")).toHaveCount(0);
  });

  test("a person's and a player's picture is the icon over the same picture blurred", async ({
    page,
  }) => {
    await mount(page, [
      { type: P, entity: "person.malte" },
      { type: P, entity: "person.malte", image_blur: false, show_entity_picture: false },
      { type: P, entity: "person.kim" },
      { type: P, entity: "media_player.living_room_speaker" },
      { type: P, entity: "sensor.living_room_temperature", image: "/local/garden.jpg" },
      {
        type: P,
        entity: "sensor.living_room_temperature",
        image: "/local/garden.jpg",
        image_blur: 6,
      },
    ]);
    const blurOf = (i: number) =>
      card(page, i)
        .locator(".pback")
        .evaluate((e) => (e as HTMLElement).style.getPropertyValue("--pblur"));
    const malte = card(page, 0);
    await expect(malte.locator(".pback.blur img")).toBeAttached();
    expect(await blurOf(0)).toBe("20px");
    const src = await malte.locator(".pback img").getAttribute("src");
    await expect(malte.locator(".plead img.picture")).toHaveAttribute("src", src!);
    // sharp, and no icon over their face
    await expect(card(page, 1).locator(".pback")).not.toHaveClass(/blur/);
    await expect(card(page, 1).locator(".plead .plead-none")).toBeAttached();
    // without a picture: their icon, nothing behind
    await expect(
      card(page, 2).locator(".plead ha-state-icon, .plead ha-icon").first(),
    ).toBeAttached();
    await expect(card(page, 2).locator(".pback img")).toHaveCount(0);
    const tv = card(page, 3);
    await expect(tv.locator(".pback.blur img")).toBeAttached();
    await expect(tv.locator(".plead img.picture")).toBeAttached();
    // your own image: sharp unless blurred
    await expect(card(page, 4).locator(".pback")).not.toHaveClass(/blur/);
    expect(await blurOf(5)).toBe("6px");
  });

  test("a cover from another site that allows it gives the poster its colour, the next song its own", async ({
    page,
  }) => {
    await mount(page, { type: P, entity: "media_player.kitchen_speaker" });
    const c = card(page);
    const tint = () =>
      c.locator(".body").evaluate((e) => (e as HTMLElement).style.getPropertyValue("--pc-tint"));
    await expect.poll(tint).toMatch(/^hsl\(/);
    const first = await tint();
    // the poster row and its status badge read the one colour, so they fade together
    await expect(c.locator(".row.poster")).toHaveAttribute("style", /--fe-color: var\(--pc-tint\)/);
    // the status badge over the picture is filled with it
    const badge = c.locator(".row.hval.pstatus");
    expect(await badge.evaluate((e) => getComputedStyle(e).backgroundColor)).not.toBe(
      "rgba(0, 0, 0, 0)",
    );
    // the next song: its own cover and colour, never the default between the two
    await c.locator(".pmain .ctl-buttons button").last().click();
    await expect(c.locator(".pvalue")).toContainText("Feel It");
    const seen: string[] = [];
    await expect
      .poll(async () => {
        const t = await tint();
        seen.push(t);
        return t;
      })
      .not.toBe(first);
    expect(seen.every((t) => /^hsl\(/.test(t))).toBe(true);
    // its cover fades in, behind the poster and in the icon; the one before goes once covered
    const back = c.locator(".pback > img");
    await expect(back).toHaveCount(1);
    const src = await back.getAttribute("src");
    await expect(c.locator(".plead img.picture")).toHaveAttribute("src", src!);
    await expect(c.locator(".plead img.picture")).toHaveClass(/pfade/);
  });

  test("the backdrop's shade takes its opacity and tint; a matching rule changes the icon and the backdrop", async ({
    page,
  }) => {
    await mount(page, [
      {
        type: P,
        entity: "sensor.living_room_temperature",
        image: "/local/garden.jpg",
        image_opacity: 0.6,
        image_tint: "blue",
      },
      {
        type: P,
        entity: "switch.garden_pump",
        rules: [
          {
            state: "on",
            image: "camera.garden",
            image_opacity: 0.5,
            image_tint: "amber",
            icon_style: "plain",
            icon_ring: true,
            icon_image: "person.malte",
          },
        ],
      },
    ]);
    // the shade's strength and colour: the tint mixed into the card's surface
    const shade = (i: number) =>
      card(page, i)
        .locator(".pback")
        .evaluate((e) => [
          (e as HTMLElement).style.getPropertyValue("--pc-shade"),
          (e as HTMLElement).style.getPropertyValue("--pc-shade-color"),
        ]);
    const [strength, color] = await shade(0);
    expect(strength).toBe("0.4");
    expect(color).toMatch(/^color-mix\(in srgb, var\(--blue-color\) 50%, /);
    // a new strength or tint fades
    await expect(card(page, 0).locator(".pback")).toHaveCSS(
      "transition-property",
      "--pc-shade, --pc-shade-color",
    );
    // off: no rule matches, the poster as the card writes it
    const pump = card(page, 1);
    await expect(pump.locator(".pback img")).toHaveCount(0);
    await expect(pump.locator(".plead img.picture")).toHaveCount(0);
    await setState(page, "switch.garden_pump", "on");
    await expect(pump.locator(".pback.scrim img")).toBeAttached();
    const [on, amber] = await shade(1);
    expect(on).toBe("0.5");
    expect(amber).toContain("var(--amber-color)");
    await expect(pump.locator(".plead img.picture")).toBeAttached();
    await expect(pump.locator(".plead .lead")).toHaveClass(/plain/);
    await expect(pump.locator(".plead .ring")).toBeAttached();
    // off again: back to the card's
    await setState(page, "switch.garden_pump", "off");
    await expect(pump.locator(".pback img")).toHaveCount(0);
    await expect(pump.locator(".plead img.picture")).toHaveCount(0);
    await expect(pump.locator(".plead .ring")).toHaveCount(0);
  });

  test("icon_image: a picture of its own in the icon, the icon while it has none", async ({
    page,
  }) => {
    await mount(page, [
      { type: P, name: "Garden", icon_image: "/local/garden.jpg" },
      { type: P, name: "Malte", icon_image: "person.malte" },
      {
        type: P,
        name: "Template",
        icon_image: "{{ state_attr('person.malte', 'entity_picture') }}",
        icon_ring: true,
        value: 40,
      },
      { type: P, name: "Kim", icon: "mdi:star", icon_image: "person.kim" },
      { type: P, entity: "sensor.wind_speed", icon_image: "/local/garden.jpg" },
      { type: P, entity: "person.malte" },
    ]);
    const pic = (i: number) => card(page, i).locator(".plead img.picture");
    await expect(pic(0)).toHaveAttribute("src", "/local/garden.jpg");
    // Malte's own picture, as their person poster shows it
    const malte = (await pic(5).getAttribute("src"))!;
    await expect(pic(1)).toHaveAttribute("src", malte);
    await expect(pic(2)).toHaveAttribute("src", malte);
    await expect(card(page, 2).locator(".plead .ring")).toBeAttached();
    // no picture now: the icon
    await expect(pic(3)).toHaveCount(0);
    await expect(card(page, 3).locator(".plead ha-icon")).toHaveAttribute("icon", "mdi:star");
    // the wind's arrow gives way to the picture
    await expect(pic(4)).toHaveAttribute("src", "/local/garden.jpg");
  });
});

test.describe("poster types", () => {
  test("wind: detected from the device class, direction and gusts found on its device", async ({
    page,
  }) => {
    await mount(page, { type: P, entity: "sensor.wind_speed" });
    const row = card(page).locator(".row.poster");
    await expect(row.locator(".pvalue .big b")).toHaveText("9.4");
    await expect(row.locator(".pstatus")).toHaveText("Breezy");
    await expect(row.locator(".ptext > .secondary")).toHaveText("from SW · gusts 18.2 km/h");
    // the animated lead turns where the wind blows
    await expect(row.locator(".plead")).toBeVisible();
    // the predefined rules read km/h whatever the sensor reports
    await setState(page, "sensor.wind_speed", "10", { unit_of_measurement: "m/s" });
    await expect(row.locator(".pstatus")).toHaveText("Strong wind");
    // stormy tints the whole poster
    await setState(page, "sensor.wind_speed", "20", { unit_of_measurement: "m/s" });
    await expect(row.locator(".pstatus")).toHaveText("Stormy");
    await expect(card(page).locator("ha-card")).toHaveClass(/tinted/);
  });

  test("wind drawn as lines: the field fills the poster and keeps running through a new speed", async ({
    page,
  }) => {
    await mount(page, { type: P, entity: "sensor.wind_speed", variant: "lines" });
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

  test("a battery fills its strip to the charge; the next segment pulses only while power flows", async ({
    page,
  }) => {
    await mount(page, [
      { type: P, entity: "sensor.robot_battery" },
      { type: P, entity: "sensor.phone_battery", poster: "battery" },
      {
        type: P,
        entity: "sensor.balcony_battery_soc",
        charge: "sensor.balcony_battery_charge_power",
        discharge: "sensor.balcony_battery_discharge_power",
      },
      { type: P, entity: "sensor.robot_battery", visual: "none" },
    ]);
    const fills = (i: number) =>
      card(page, i)
        .locator(".pbody > .pstrip > i")
        .evaluateAll((els) =>
          els.map((e) => [(e as HTMLElement).style.getPropertyValue("--f"), e.className]),
        );
    const strip = card(page, 0).locator(".pbody > .pstrip");
    await expect(strip.locator("> i")).toHaveCount(10);
    await expect(strip.locator("> .tip")).toBeAttached();
    expect((await fills(0)).slice(6, 9)).toEqual([
      ["1", ""],
      ["0.2", "part"],
      ["0", ""],
    ]);
    await expect(strip).not.toHaveClass(/flow/);
    await expect(card(page, 1).locator(".pstatus")).toHaveText("Low");
    expect((await fills(1)).slice(0, 2)).toEqual([
      ["1", ""],
      ["0.5", "part"],
    ]);
    await expect(card(page, 2).locator(".pbody > .pstrip")).toHaveClass(/flow/);
    await expect(card(page, 3).locator(".pstrip")).toHaveCount(0);
    // a whole ten: the next segment is the one to fill
    await setState(page, "sensor.robot_battery", "40");
    await expect.poll(async () => (await fills(0))[4]).toEqual(["0", "part"]);
  });

  test("weather: the condition as the status, the temperature as the value", async ({ page }) => {
    await mount(page, { type: P, entity: "weather.home" });
    const row = card(page).locator(".row.poster");
    await expect(row.locator(".pstatus")).toHaveText("Partly cloudy");
    await expect(row.locator(".pvalue .big b")).toHaveText("17.4");
    await setState(page, "weather.home", "rainy");
    await expect(row.locator(".pstatus")).toHaveText("Rainy");
  });

  test("a gauge takes the room under the top line, up to its cap", async ({ page }) => {
    const g = { type: P, entity: "sensor.living_room_humidity", visual: "gauge" };
    await mount(
      page,
      [
        { ...g, grid_options: { columns: 6, rows: 3 } },
        { ...g, grid_options: { columns: 6, rows: 4 } },
        { ...g, grid_options: { columns: 12, rows: 6 } },
      ],
      { width: 400 },
    );
    const size = async (i: number) => rect(card(page, i).locator(".gauge"));
    expect((await size(0)).h).toBe(80);
    expect((await size(1)).h).toBeGreaterThan(80);
    const big = await size(2);
    expect([big.w, big.h]).toEqual([204, 136]);
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
    // the glow is the light's picture: another visual replaces it
    await mount(page, { type: P, entity: "light.living_room", visual: "none" });
    await expect(card(page).locator(".row.poster")).toBeVisible();
    await expect(card(page).locator(".pglow")).toHaveCount(0);
  });

  test("a value turning from a number into a word moves nothing, the switch beside it neither; the name keeps its gap", async ({
    page,
  }) => {
    await mount(page, [
      { type: P, entity: "fan.bedroom", control: "toggle" },
      { type: P, entity: "light.desk_lamp", visual: "sparkline", control: "toggle" },
      { type: P, entity: "sensor.living_room_temperature" },
      { type: P, entity: "lock.front_door", icon_hold_action: "none" },
    ]);
    const before = [await layoutOf(card(page, 0)), await layoutOf(card(page, 1))];
    await setState(page, "fan.bedroom", "on", { percentage: 50 });
    await setState(page, "light.desk_lamp", "off");
    await expect(card(page, 0).locator(".pvalue .big b")).toHaveText("50");
    await expect(card(page, 1).locator(".pvalue .big b")).toHaveText("Off");
    expect([await layoutOf(card(page, 0)), await layoutOf(card(page, 1))]).toEqual(before);
    // the name sits as close above a word (Locked) as above a number
    const number = await nameGapOf(card(page, 2));
    expect(Math.abs((await nameGapOf(card(page, 3))) - number)).toBeLessThan(1.5);
  });

  test("a wider or narrower value never moves the controls: their place holds for the card's size", async ({
    page,
  }) => {
    // beside the value on a wide card, under it on a narrow one
    for (const [width, place] of [
      [440, "beside"],
      [180, "under"],
    ] as const) {
      await mount(page, { type: P, entity: "vacuum.robot" }, { width });
      const c = card(page);
      await expect(c.locator(".pmain")).toHaveClass(new RegExp(place));
      const before = await layoutOf(c);
      for (const state of ["returning", "docked", "cleaning"]) {
        await setState(page, "vacuum.robot", state);
        await expect(c.locator(".pvalue .big b")).not.toHaveText("");
        expect(await layoutOf(c)).toEqual(before);
      }
    }
  });

  test("a Run chip keeps its size and place while it says Done", async ({ page }) => {
    await mount(
      page,
      {
        type: P,
        entity: "script.check_windows",
        name: "Windows",
        value: "Check",
        control: "button",
        grid_options: { columns: 12 },
      },
      live,
    );
    const c = card(page);
    const chip = c.locator(".pmain > .end > .ctl-chip");
    const before = await rect(chip);
    await chip.click();
    await expect(chip).toHaveText("Done");
    expect(await rect(chip)).toEqual(before);
    expect(await services(page)).toEqual(["script.turn_on"]);
  });

  test("a robot's route fills the room the icon, the badges and the texts leave", async ({
    page,
  }) => {
    const v = { type: P, entity: "vacuum.robot" };
    await mount(
      page,
      [
        { ...v, grid_options: { columns: 6, rows: 3 } },
        { ...v, grid_options: { columns: 9, rows: 4 } },
      ],
      { width: 400 },
    );
    for (const i of [0, 1]) {
      const c = card(page, i);
      const route = await rect(c.locator(".ppath > svg"));
      const lead = await rect(c.locator(".plead"));
      const name = await rect(c.locator(".pname"));
      const box = await inner(c);
      // right of the icon, above the name, inside the card's padding
      expect(route.left).toBeGreaterThan(lead.right);
      expect(route.bottom).toBeLessThan(name.top);
      expect(route.top).toBeGreaterThanOrEqual(box.top + 16 - 0.5);
      expect(route.right).toBeLessThanOrEqual(box.right - 16);
    }
    // a taller card, a longer route
    const d = (i: number) => card(page, i).locator(".ppath .route").getAttribute("d");
    expect((await d(1))!.length).toBeGreaterThan((await d(0))!.length);
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

  test("a cover glides through the positions it reports on its way, and stops", async ({
    page,
  }) => {
    await mount(page, { type: P, entity: "cover.office_blinds" }, live);
    const c = card(page);
    const cover = c.locator(".pback > .pcov");
    const value = c.locator(".pvalue .big b");
    await expect(value).toHaveText("40");
    // no drag on the drawing: the buttons move it
    await expect(c.locator(".pcovdrag")).toHaveCount(0);
    await c.locator('.ctl-buttons button[aria-label="Open"]').click();
    await expect(cover).toHaveClass(/moving/);
    // on its way: every position between, the drawing at the one reported
    await expect.poll(async () => Number(await value.textContent())).toBeGreaterThan(40);
    const [shown, drawn] = await c.evaluate((el) => {
      const root = el.shadowRoot!;
      return [
        root.querySelector(".pvalue .big b")!.textContent,
        root.querySelector<HTMLElement>(".pback")!.style.getPropertyValue("--p"),
      ];
    });
    expect(Number(shown)).toBeLessThan(100);
    expect(drawn).toBe(shown);
    await c.locator('.ctl-buttons button[aria-label="Stop"]').click();
    await expect(cover).not.toHaveClass(/moving/);
    const stopped = await value.textContent();
    await page.waitForTimeout(600);
    await expect(value).toHaveText(stopped!);
    expect(Number(stopped)).toBeLessThan(100);
  });

  test("a lock is held to open, from its icon", async ({ page }) => {
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
        poster: "appliance",
        variant: "heat_pump",
        running_above: 50,
      },
      { type: P, entity: "sensor.washer_power", poster: "appliance", variant: "washer" },
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
    const cfg = { type: P, entity: "media_player.living_room_speaker" };
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
    expect((await rect(short.locator(".plead"))).top - box.top).toBeGreaterThanOrEqual(0);
    // the progress along the edge does not count: the tall card's title is full size
    expect(await fontPx(tall.locator(".pvalue .big b"))).toBeGreaterThan(
      await fontPx(short.locator(".pvalue .big b")),
    );
  });

  test("the sun without an entity: the next event, how soon, the curve", async ({ page }) => {
    await mount(page, { type: P, poster: "sun" });
    const row = card(page).locator(".row.poster");
    await expect(row.locator(".pname")).toHaveText("Sunset");
    await expect(row.locator(".pstatus")).toContainText(/in \d+ hours?/i);
    await expect(row.locator(".pcurve.psun")).toBeVisible();
  });
});

test.describe("poster config", () => {
  test("a key the poster type does not read is left out with one warning", async ({ page }) => {
    const warned: string[] = [];
    page.on("console", (m) => {
      if (m.text().includes("reads no")) warned.push(m.text());
    });
    await mount(page, { type: P, entity: "sensor.rain_rate_roof", gust: "sensor.wind_gust" });
    await expect(card(page).locator(".row.poster")).toBeVisible();
    await setState(page, "sensor.rain_rate_roof", "2.4");
    await expect
      .poll(() => warned)
      .toEqual(["poster-card-pro: the rain poster reads no gust; left out"]);
  });

  test("an unknown poster type is a config error that names the types", async ({ page }) => {
    await mount(page, { type: P, entity: "sensor.wind_speed" });
    const msg = await configError(page, { poster: "nonsense" });
    expect(msg).toMatch(/^poster-card-pro: .*nonsense/);
    expect(msg).toMatch(/\bwind\b/);
  });

  test("the entity cards' ring and lead control are config errors that name the icon's keys", async ({
    page,
  }) => {
    await mount(page, { type: P, entity: "sensor.wind_speed" });
    const ring = await configError(page, { entity: "sensor.living_room_humidity", visual: "ring" });
    expect(ring).toMatch(/^poster-card-pro: .*icon_ring/);
    const lead = await configError(page, {
      entity: "switch.coffee_machine",
      control: "toggle",
      control_position: "lead",
    });
    expect(lead).toMatch(/^poster-card-pro: .*icon_tap_action/);
  });
});

test.describe("poster glow and icon", () => {
  test("visual: glow lights any poster as strong as its value, fading in place", async ({
    page,
  }) => {
    await mount(page, [
      { type: P, entity: "sensor.living_room_humidity", visual: "glow", min: 0, max: 100 },
      { type: P, entity: "switch.coffee_machine", visual: "glow" },
    ]);
    const [humid, coffee] = [card(page, 0), card(page, 1)];
    // the value between min and max: 0.3 + 0.7 × the level
    await setState(page, "sensor.living_room_humidity", "50");
    await expect.poll(async () => Number(await glowOf(humid))).toBeCloseTo(0.65, 2);
    await mark(humid.locator(".pglow"));
    await setState(page, "sensor.living_room_humidity", "100");
    await expect.poll(async () => Number(await glowOf(humid))).toBeCloseTo(1, 2);
    await setState(page, "sensor.living_room_humidity", "0");
    await expect.poll(() => glowOf(humid)).toBe("0");
    await expect(humid.locator(".pglow")).toHaveAttribute("data-mark", "1");
    // on or off: lit while on, dark while off
    await expect.poll(() => glowOf(coffee)).toBe("0");
    await setState(page, "switch.coffee_machine", "on");
    await expect.poll(async () => Number(await glowOf(coffee))).toBeGreaterThan(0.3);
  });

  test("icon_ring draws the value as a ring around the icon", async ({ page }) => {
    await mount(page, [
      { type: P, entity: "sensor.living_room_humidity", icon_ring: true, min: 0, max: 100 },
      { type: P, entity: "sensor.living_room_humidity" },
    ]);
    await expect(card(page, 0).locator(".plead .lead.ring")).toBeVisible();
    await expect(card(page, 1).locator(".plead .lead.ring")).toHaveCount(0);
  });

  test("icon_tap_action: toggle switches the entity from its icon, opening nothing", async ({
    page,
  }) => {
    await mount(page, {
      type: P,
      entity: "switch.coffee_machine",
      icon_tap_action: { action: "toggle" },
    });
    const c = card(page);
    const lead = c.locator(".plead .lead.tap");
    await expect(lead).toHaveAttribute("role", "switch");
    await lead.click();
    expect(await services(page)).toEqual(["homeassistant.toggle"]);
    expect(await infos(page)).toEqual([]);
    expect(await actions(page)).toEqual([]);
  });

  test("any other icon action goes to Home Assistant; the poster keeps its own tap", async ({
    page,
  }) => {
    const nav = { action: "navigate", navigation_path: "/config" };
    await mount(page, {
      type: P,
      entity: "sensor.living_room_temperature",
      icon_tap_action: nav,
    });
    const c = card(page);
    const navs = async () =>
      ((await actions(page)) as { action: string; config: Record<string, unknown> }[]).filter(
        (a) => (a.config.tap_action as { action?: string } | undefined)?.action === "navigate",
      );
    await c.locator(".plead").click();
    await expect.poll(navs).toHaveLength(1);
    expect((await navs())[0]).toEqual({
      action: "tap",
      config: { entity: "sensor.living_room_temperature", tap_action: nav },
    });
    expect(await infos(page)).toEqual([]);
    // the poster's own tap still opens the entity, not the icon's action
    await c.locator(".pname").click({ force: true });
    expect(await infos(page)).toEqual([
      { type: "more-info", entityId: "sensor.living_room_temperature" },
    ]);
    expect(await navs()).toHaveLength(1);
  });

  test("icon_hold_action runs once the icon is held", async ({ page }) => {
    const nav = { action: "navigate", navigation_path: "/config" };
    await mount(
      page,
      { type: P, entity: "sensor.living_room_temperature", icon_hold_action: nav },
      live,
    );
    const b = (await card(page).locator(".plead").boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await expect.poll(() => actions(page), { timeout: 3000 }).not.toEqual([]);
    await page.mouse.up();
    expect(await actions(page)).toEqual([
      {
        action: "hold",
        config: { entity: "sensor.living_room_temperature", hold_action: nav },
      },
    ]);
    expect(await infos(page)).toEqual([]);
  });
});

test.describe("poster value fit", () => {
  test("a value shrinks where the card is short of room and is full size where it is not", async ({
    page,
  }) => {
    const cfg = { type: P, entity: "vacuum.robot" };
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
    // the room it gives up keeps the top line at the card's padding, the buttons beside the value
    const box = await inner(small);
    expect((await rect(small.locator(".ptop"))).top - box.top).toBeCloseTo(16, 0);
    await expect(small.locator(".pmain")).toHaveClass(/beside/);
    // a new value never makes it larger again (no jump back and forth)
    const px = await fontPx(b(small));
    await setState(page, "vacuum.robot", "docked");
    await expect(b(small)).toHaveText("Docked");
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
          { type: P, poster: "sun" },
          { type: P, entity: "sensor.wind_speed", variant: "lines" },
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
          { type: P, poster: "trend", series: ["sensor.power_consumption"] },
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
