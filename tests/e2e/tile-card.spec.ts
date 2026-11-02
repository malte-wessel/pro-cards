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
  test("draws the kind's picture below the line unless visual: false, its edge and glow too", async ({
    page,
  }) => {
    await mount(page, [
      { type: T, entity: "sun.sun", visual: false },
      { type: T, entity: "sun.sun" },
      { type: T, entity: "media_player.living_room_speaker" },
      { type: T, entity: "light.desk_lamp" },
      { type: T, entity: "light.desk_lamp", visual: false },
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
          .locator(".body > .pback > .pglow")
          .evaluate((e) => getComputedStyle(e).opacity),
      )
      .not.toBe("0");
    await expect(card(page, 4).locator(".pglow")).toHaveCount(0);
  });
});

test.describe("tile without room for its controls", () => {
  test("keeps them under the line, else beside the name, else leaves them out", async ({
    page,
  }) => {
    await mount(
      page,
      [
        { type: T, entity: "cover.office_blinds", grid_options: { columns: 6 } },
        { type: T, entity: "cover.office_blinds", grid_options: { columns: 12, rows: 1 } },
        { type: T, entity: "vacuum.robot", grid_options: { columns: 6, rows: 1 } },
        { type: T, entity: "cover.office_blinds", grid_options: { columns: 6, rows: 1 } },
      ],
      { width: 420 },
    );
    const row = (i: number) => card(page, i).locator(".row.tile");
    const buttons = (i: number) => card(page, i).locator(".line > .end .ctl-buttons");
    // as tall as its content: under the line
    await expect(row(0)).not.toHaveClass(/tkeep|tdrop/);
    await expect(buttons(0)).toBeVisible();
    // the whole width: on the line as it is
    await expect(row(1)).not.toHaveClass(/tkeep|tdrop/);
    // one row, room beside the name: two buttons stay on the line
    await expect(row(2)).not.toHaveClass(/tdrop/);
    await expect(buttons(2)).toBeVisible();
    // one row, no room: left out, the name and the line whole
    await expect(row(3)).toHaveClass(/tdrop/);
    await expect(buttons(3)).toBeHidden();
    await expect(line(page, 3)).toHaveText("40 % · Open");
    // whatever is drawn stays inside its card
    for (let i = 0; i < 4; i++) {
      const box = (await card(page, i).locator("ha-card").boundingBox())!;
      for (const c of await card(page, i).locator(".ctl").all()) {
        const b = await c.boundingBox();
        if (b) expect(b.y + b.height).toBeLessThanOrEqual(box.y + box.height + 0.5);
      }
    }
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

test.describe("tile plots", () => {
  test("run to the tile's edges, as on a poster; a strip keeps the padding", async ({ page }) => {
    await mount(page, [
      { type: T, entity: "sensor.outdoor_temperature", visual: "sparkline" },
      { type: T, entity: "sun.sun" },
      { type: T, entity: "sensor.outdoor_temperature", visual: "sparkline", vertical: true },
      { type: T, entity: "binary_sensor.door_front", visual: "strip" },
    ]);
    // the card's inner box: inside its border
    const inner = (i: number) =>
      card(page, i)
        .locator("ha-card")
        .evaluate((e) => {
          const r = e.getBoundingClientRect(),
            s = getComputedStyle(e);
          const b = parseFloat(s.borderLeftWidth);
          return { left: r.left + b, right: r.right - b, bottom: r.bottom - b };
        });
    for (const [i, sel] of [
      [0, ".plot"],
      [1, ".pcurve"],
      [2, ".plot"],
    ] as const) {
      const box = await inner(i);
      const p = (await card(page, i).locator(`.row.tile > ${sel}`).boundingBox())!;
      expect(Math.abs(p.x - box.left)).toBeLessThan(1);
      expect(Math.abs(p.x + p.width - box.right)).toBeLessThan(1);
      expect(Math.abs(p.y + p.height - box.bottom)).toBeLessThan(1);
    }
    const box = await inner(3);
    const strip = (await card(page, 3).locator(".row.tile > .plot").boundingBox())!;
    expect(strip.x - box.left).toBeGreaterThan(8);
  });
});

test.describe("tile status and badges", () => {
  const shown = (loc: import("@playwright/test").Locator) =>
    loc.evaluate((e) => (e as HTMLElement).innerText.trim());

  test("the status is on the line; status_badge makes it a badge before the badges", async ({
    page,
  }) => {
    await mount(page, [
      { type: T, entity: "sensor.living_room_co2", grid_options: { columns: 12 } },
      {
        type: T,
        entity: "sensor.living_room_co2",
        status_badge: true,
        grid_options: { columns: 12 },
      },
    ]);
    expect(await shown(line(page, 0))).toBe("742 ppm · Good");
    await expect(card(page, 0).locator(".tcorner")).toHaveCount(0);
    expect(await shown(line(page, 1))).toBe("742 ppm");
    await expect(card(page, 1).locator(".tcorner .pstatus")).toHaveText("Good");
    await expect(card(page, 1).locator(".tcorner .pstatus")).toHaveClass(/b-tag/);
  });

  test("a status badge always shows: the entity's state where the type says nothing more", async ({
    page,
  }) => {
    await mount(page, [
      { type: T, entity: "vacuum.robot", grid_options: { columns: 12 } },
      { type: T, entity: "vacuum.robot", status_badge: true, grid_options: { columns: 12 } },
    ]);
    // on the line the state is the value, said once
    expect(await shown(line(page, 0))).toBe("Cleaning · 72 %");
    await expect(card(page, 0).locator(".tcorner")).toHaveCount(0);
    // asked for as a badge, it shows, though it repeats the value
    await expect(card(page, 1).locator(".tcorner .pstatus")).toHaveText("Cleaning");
    await expect(card(page, 1).locator(".tcorner .pstatus")).not.toHaveClass(/empty/);
  });

  test("badges always show in full: the name and the line give way, never a badge", async ({
    page,
  }) => {
    const cfg = {
      type: T,
      entity: "sensor.living_room_co2",
      badges: ["sensor.living_room_temperature"],
      status_badge: true,
    };
    await mount(
      page,
      [
        { ...cfg, grid_options: { columns: 12 } },
        { ...cfg, grid_options: { columns: 6 } },
      ],
      { width: 500 },
    );
    for (const i of [0, 1]) {
      const pills = card(page, i).locator(".tcorner > .row.hval");
      await expect(pills).toHaveCount(2);
      for (const b of await pills.all()) await expect(b).toBeVisible();
      // the status first
      await expect(pills.first()).toHaveText("Good");
    }
    // half a section: the name is cut, the badges are whole and centred on the icon
    const name = card(page, 1).locator(".tinfo > .texts > .primary");
    expect(await name.evaluate((e) => e.scrollWidth > e.clientWidth)).toBe(true);
    const lead = (await card(page, 1).locator(".tlead").boundingBox())!;
    const pill = (await card(page, 1).locator(".tcorner > .row.hval").first().boundingBox())!;
    expect(Math.abs(pill.y + pill.height / 2 - (lead.y + lead.height / 2))).toBeLessThan(2);
    // a badge opens its own entity
    await card(page, 0).locator(".tcorner > .row.hval").last().locator("> .hit").click();
    expect(await infos(page)).toEqual([
      { type: "more-info", entityId: "sensor.living_room_temperature" },
    ]);
  });

  test("icon: { badge }: none, or a badge of the card's own that a template shows and hides", async ({
    page,
  }) => {
    const alert = "{{ 'mdi:alert' if states('sensor.wind_speed') | float(0) > 50 else '' }}";
    await mount(page, [
      { type: T, entity: "sensor.wind_speed", icon: { badge: { icon: alert, color: "red" } } },
      { type: T, entity: "climate.living_room", icon: { badge: false } },
      {
        type: T,
        entity: "sensor.living_room_co2",
        icon: { badge: { icon: "mdi:window-open-variant" } },
      },
    ]);
    const badge = (i: number) => card(page, i).locator(".tlead > .tibadge");
    await expect(badge(0)).toHaveCount(0);
    await setState(page, "sensor.wind_speed", "62");
    await expect(badge(0).locator("ha-icon")).toHaveAttribute("icon", "mdi:alert");
    await expect(badge(0)).toHaveCSS("background-color", "rgb(244, 67, 54)");
    await setState(page, "sensor.wind_speed", "9.4");
    await expect(badge(0)).toHaveCount(0);
    // none, not even Home Assistant's heating flame
    await expect(badge(1)).toHaveCount(0);
    // the card's own icon, in the tile's colour
    await expect(badge(2).locator("ha-icon")).toHaveAttribute("icon", "mdi:window-open-variant");
    const tile = await card(page, 2)
      .locator(".row.tile")
      .evaluate((e) => getComputedStyle(e).getPropertyValue("--fe-color"));
    expect(tile).not.toBe("");
  });

  test("the icon carries Home Assistant's badge: an action, a zone, unavailable", async ({
    page,
  }) => {
    await mount(page, [
      { type: T, entity: "climate.living_room" },
      { type: T, entity: "person.malte" },
      { type: T, entity: "light.shed" },
      { type: T, entity: "sensor.living_room_temperature" },
    ]);
    const icon = (i: number) => card(page, i).locator(".tlead > .tibadge > ha-icon");
    await expect(icon(0)).toHaveAttribute("icon", "mdi:fire");
    await expect(icon(1)).toHaveAttribute("icon", "mdi:home");
    await expect(icon(2)).toHaveAttribute("icon", "mdi:exclamation-thick");
    await expect(card(page, 3).locator(".tibadge")).toHaveCount(0);
  });
});

test.describe("tile pointer", () => {
  test("answers the pointer by default, as Home Assistant's tile; hover: false keeps it still", async ({
    page,
  }) => {
    await mount(page, [
      { type: T, entity: "sensor.living_room_temperature" },
      { type: T, entity: "sensor.living_room_temperature", hover: false },
    ]);
    await expect(card(page, 0).locator(".row.tile")).toHaveClass(/hover-fx/);
    await expect(card(page, 1).locator(".row.tile")).not.toHaveClass(/hover-fx/);
    const hit = card(page, 0).locator(".row.tile > .hit");
    const b = (await hit.boundingBox())!;
    await page.mouse.move(b.x + b.width * 0.7, b.y + b.height / 2);
    await expect
      .poll(() =>
        hit.evaluate((e) => getComputedStyle(e.querySelector(".ripple > .rhover")!).opacity),
      )
      .toBe("0.04");
  });

  test("focus colours the card's border, with a ring outside it", async ({ page }) => {
    await mount(page, { type: T, entity: "sensor.living_room_co2" });
    const hit = card(page).locator(".row.tile > .hit");
    await hit.focus();
    await page.keyboard.press("Shift");
    const haCard = card(page).locator("ha-card");
    await expect(haCard).toHaveCSS("outline-width", "1px");
    await expect
      .poll(() =>
        haCard.evaluate(
          (e) => getComputedStyle(e).borderTopColor === getComputedStyle(e).outlineColor,
        ),
      )
      .toBe(true);
    await expect(haCard).not.toHaveCSS("outline-color", "rgba(0, 0, 0, 0)");
  });

  test("the icon toggles what switches and presses what runs, as Home Assistant's tile", async ({
    page,
  }) => {
    await mount(page, [
      { type: T, entity: "light.desk_lamp" },
      { type: T, entity: "fan.living_room" },
      { type: T, entity: "scene.movie_night" },
      { type: T, entity: "light.desk_lamp", icon: { tap_action: "none" } },
      { type: T, entity: "sensor.living_room_temperature" },
    ]);
    const lead = (i: number) => card(page, i).locator(".tlead > .lead");
    await lead(0).click();
    expect(await services(page)).toEqual(["homeassistant.toggle"]);
    // the fan keeps its turning blades, and they are the switch
    await expect(lead(1)).toHaveClass(/pfan/);
    await expect(lead(1)).toHaveAttribute("role", "switch");
    await lead(1).click();
    await lead(2).click();
    expect(await services(page)).toEqual([
      "homeassistant.toggle",
      "homeassistant.toggle",
      "scene.turn_on",
    ]);
    expect(await infos(page)).toEqual([]);
    // none: the icon is part of the tile, a sensor's has nothing to toggle
    await expect(lead(3)).not.toHaveClass(/tap/);
    await expect(lead(4)).not.toHaveClass(/tap/);
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

  test("an image icon puts a picture in the icon; icon: { tap_action } runs from it alone", async ({
    page,
  }) => {
    await mount(page, [
      {
        type: T,
        entity: "sensor.wind_speed",
        icon: { type: "image", src: "/local/a.png" },
      },
      { type: T, entity: "light.desk_lamp", icon: { tap_action: { action: "toggle" } } },
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

test.describe("tile places", () => {
  const feColor = (page: Page, i = 0) =>
    card(page, i)
      .locator(".row.tile")
      .evaluate((e) => (e as HTMLElement).style.getPropertyValue("--fe-color"));

  test("a flow visual runs the wind behind the tile; the icon is the arrow", async ({ page }) => {
    await mount(page, [
      { type: T, entity: "sensor.wind_speed", visual: { type: "flow", variant: "lines" } },
      { type: T, entity: "sensor.wind_speed" },
    ]);
    const flow = card(page, 0);
    await expect(flow.locator(".body > .pback > .wflow .field")).toBeAttached();
    await expect(flow.locator(".tlead ha-icon.arrow")).toBeAttached();
    await expect(flow.locator(".tlead .lfield")).toHaveCount(0);
    // by default the animation is in the icon, nothing behind
    const icon = card(page, 1);
    await expect(icon.locator(".tlead .lfield")).toBeAttached();
    await expect(icon.locator(".pback .wflow")).toHaveCount(0);
  });

  test("an image visual lies behind the tile under its scrim", async ({ page }) => {
    await mount(page, {
      type: T,
      entity: "sensor.living_room_temperature",
      visual: { type: "image", src: "/local/garden.jpg", opacity: 0.6 },
    });
    const back = card(page).locator(".body > .pback");
    await expect(back).toHaveClass(/scrim/);
    await expect(back.locator("img")).toHaveAttribute("src", "/local/garden.jpg");
    expect(
      await back.evaluate((e) => (e as HTMLElement).style.getPropertyValue("--pc-shade")),
    ).toBe("0.4");
  });

  test("a rule switches the visual by the value, and back", async ({ page }) => {
    await mount(page, {
      type: T,
      entity: "sensor.living_room_temperature",
      visual: "sparkline",
      rules: [{ above: 25, visual: "glow" }],
    });
    const c = card(page);
    await expect(c.locator(".row.tile > .plot")).toHaveCount(1);
    await expect(c.locator(".pglow")).toHaveCount(0);
    await setState(page, "sensor.living_room_temperature", "28");
    await expect(c.locator(".body > .pback > .pglow")).toHaveCount(1);
    await expect(c.locator(".row.tile > .plot")).toHaveCount(0);
    await setState(page, "sensor.living_room_temperature", "21");
    await expect(c.locator(".row.tile > .plot")).toHaveCount(1);
    await expect(c.locator(".pglow")).toHaveCount(0);
  });

  test("a matching rule's colour and icon win over the card's", async ({ page }) => {
    await mount(page, {
      type: T,
      entity: "sensor.living_room_temperature",
      color: "blue",
      icon: "mdi:sofa",
      rules: [{ above: 25, color: "red", icon: "mdi:fire" }],
    });
    const icon = card(page).locator(".tlead ha-icon");
    await expect.poll(() => feColor(page)).toContain("--blue-color");
    await expect(icon).toHaveAttribute("icon", "mdi:sofa");
    await setState(page, "sensor.living_room_temperature", "28");
    await expect.poll(() => feColor(page)).toContain("--red-color");
    await expect(icon).toHaveAttribute("icon", "mdi:fire");
  });

  test("a sparkline of its own: its hours, another entity's history, its axes", async ({
    page,
  }) => {
    const spark = { type: "sparkline", hours: 6, axis: true };
    await mount(page, [
      {
        type: T,
        entity: "sensor.living_room_temperature",
        visual: { ...spark, src: "sensor.power_consumption" },
      },
      { type: T, entity: "sensor.power_consumption", visual: spark },
      { type: T, entity: "sensor.living_room_temperature", visual: "sparkline" },
    ]);
    const axis = (i: number) => card(page, i).locator(".row.tile > .plot .label.axis");
    // the scale's values on the left, the window's start and now on the right
    await expect(card(page, 0).locator(".plot .label.axis.right").first()).toBeAttached();
    const right = await card(page, 0).locator(".plot .label.axis.right").allTextContents();
    expect(right).toContain("now");
    expect(right.some((t) => /6 h/.test(t))).toBe(true);
    // drawn from the power's history: the same scale as the power's own sparkline
    const nums = async (i: number) =>
      (await axis(i).allTextContents())
        .filter((t) => /\d/.test(t) && !/ h$/.test(t))
        .map((t) => Math.round(Number(t.replace(/[^\d.-]/g, ""))));
    await expect.poll(() => nums(0)).not.toEqual([]);
    expect(await nums(0)).toEqual(await nums(1));
    // no axes unless asked
    await expect(card(page, 2).locator(".row.tile > .plot")).toHaveCount(1);
    await expect(axis(2)).toHaveCount(0);
  });

  test("a cover, a robot and the grid draw nothing behind a tile unless asked", async ({
    page,
  }) => {
    await mount(page, [
      { type: T, entity: "cover.office_blinds" },
      { type: T, entity: "cover.office_blinds", visual: "cover" },
      { type: T, entity: "vacuum.robot" },
      { type: T, entity: "vacuum.robot", visual: "path" },
      { type: T, entity: "sensor.grid_power", kind: "grid" },
      { type: T, entity: "sensor.grid_power", kind: "grid", visual: "line" },
    ]);
    for (const [i, sel] of [
      [0, ".pcov"],
      [2, ".ppath"],
      [4, ".pline"],
    ] as const) {
      await expect(card(page, i).locator(".row.tile")).toBeVisible();
      await expect(card(page, i).locator(sel)).toHaveCount(0);
      await expect(card(page, i + 1).locator(`.body > .pback > ${sel}`)).toBeAttached();
    }
  });
});
