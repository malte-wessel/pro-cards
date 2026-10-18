import { test, expect, mount, card, setLanguage } from "./util.ts";

// the frozen clock: 21 June 2026, 12:00 CEST in Düsseldorf. The sun stands at 138° (SE), 57° high,
// an hour and a half before solar noon (13:35); sunrise 05:16 at 49°, sunset 21:52 at 311°.
// The instant carries its offset: Playwright parses it in the Node process's zone (UTC on CI) while
// the browser runs in Europe/Berlin, so a naive "12:00" would be 14:00 there.
const NOON = new Date("2026-06-21T12:00:00+02:00");

test("the sky dial shows the azimuth, the path and the lit sides", async ({ page }) => {
  await mount(
    page,
    {
      type: "custom:sun-azimuth-card-pro",
      title: "Sun",
      icon: "mdi:sun-compass",
      house: { front: 20 },
      show_events: true,
      show_sides: true,
    },
    { time: NOON },
  );
  const c = card(page);
  await expect(c.locator(".header .title")).toHaveText("Sun");
  await expect(c.locator(".header ha-icon")).toHaveAttribute("icon", "mdi:sun-compass");
  // the head: where the sun stands, its angles below
  await expect(c.locator(".head .primary")).toHaveText("South-East");
  await expect(c.locator(".head .secondary")).toHaveText("138° · Elevation 57°");
  await expect(c.locator(".head .rot")).toHaveCSS("transform", /matrix/);
  // the dial
  const dial = c.locator("svg.dial");
  await expect(dial).toHaveAttribute("viewBox", "0 0 300 300");
  await expect(dial).toHaveAttribute("style", "--k: 1.00"); // full size, full line weight
  await expect(dial.locator(".past")).toHaveCount(1);
  await expect(dial.locator(".future")).toHaveCount(1);
  await expect(dial.locator(".dayarc")).toHaveCount(1);
  await expect(dial.locator(".beam")).toHaveCount(1);
  await expect(dial.locator(".azarc")).toHaveCount(1);
  await expect(dial.locator(".chip text")).toHaveText("138°");
  await expect(dial.locator(".wall")).toHaveCount(4);
  // the front faces 20°: the sun at 138° lights the left (110°) and the back (200°)
  await expect(dial.locator(".wall.lit")).toHaveCount(2);
  await expect(dial.locator(".mark.rise")).toHaveCount(1);
  await expect(dial.locator(".mark.set")).toHaveCount(1);
  await expect(dial.locator("text.cl")).toHaveText(["N", "E", "S", "W"]);
  await expect(dial.locator("circle.sun")).not.toHaveClass(/down/);
  // the house line and the events
  await expect(c.locator(".house .primary")).toHaveText("Sun on East side + South side");
  await expect(c.locator(".house .secondary")).toHaveText(/^next: West side from 1[345]:\d\d$/);
  await expect(c.locator(".items .v.rise")).toHaveText(/^05:1\d$/);
  await expect(c.locator(".items .n.rise")).toHaveText("49° NE");
  await expect(c.locator(".items .v.noon")).toHaveText(/^13:3\d$/);
  await expect(c.locator(".items .n.noon")).toHaveText("62° high");
  await expect(c.locator(".items .v.set")).toHaveText(/^21:5\d$/);
  await expect(c.locator(".items .n.set")).toHaveText("311° NW");
});

test("the sides footer lists every side with its window, pill and timeline", async ({ page }) => {
  await mount(
    page,
    {
      type: "custom:sun-azimuth-card-pro",
      house: { front: 20 },
      show_events: true,
      show_sides: true,
    },
    { time: NOON },
  );
  const c = card(page);
  await expect(c.locator(".header")).toBeHidden();
  await expect(c.locator(".sides .key")).toHaveText("Sides of the house");
  await expect(c.locator(".sides .sechead .secondary")).toHaveText("Today");
  const rows = c.locator(".side");
  await expect(rows).toHaveCount(4);
  // front, right, back, left, each called by where it faces
  await expect(rows.locator(".primary")).toHaveText([
    "North side", // the front, 20°
    "West side", // the right, 290°
    "South side", // the back, 200°
    "East side", // the left, 110°
  ]);
  await expect(rows.nth(2)).toHaveClass(/lit/);
  await expect(rows.nth(3)).toHaveClass(/lit/);
  await expect(rows.nth(0)).not.toHaveClass(/lit/);
  await expect(rows.locator(".pill")).toHaveText([
    /^from 2\d:\d\d$/, // the front (20°) catches the sun again in the evening
    /^from 1[2345]:\d\d$/,
    "Sun now",
    "Sun now",
  ]);
  await expect(rows.nth(3).locator(".pill")).toHaveClass(/on/);
  await expect(rows.nth(0).locator(".pill")).not.toHaveClass(/on/);
  // the front's two windows, the others' one
  await expect(rows.nth(0).locator(".lbar i")).toHaveCount(2);
  await expect(rows.nth(3).locator(".lbar i")).toHaveCount(1);
  await expect(rows.nth(0).locator(".secondary")).toHaveText(
    /^sun \d\d:\d\d–\d\d:\d\d · \d\d:\d\d–\d\d:\d\d · \d+ h \d+ min$/,
  );
  // the now dot sits inside every bar, the axis runs from before sunrise to after sunset
  for (let i = 0; i < 4; i++) {
    const left = await rows
      .nth(i)
      .locator(".lbar b")
      .evaluate((el) => el.style.left);
    expect(parseFloat(left)).toBeGreaterThan(30);
    expect(parseFloat(left)).toBeLessThan(60);
  }
  await expect(c.locator(".sides .axis span")).toHaveText([
    /^0[34]:00$/,
    /^1[34]:\d\d$/,
    /^2[23]:00$/,
  ]);
  // the arrow of each side points along its normal
  await expect(rows.nth(1).locator(".rot")).toHaveAttribute("style", /rotate\(290deg\)/);
  await expect(rows.nth(3).locator(".rot")).toHaveAttribute("style", /rotate\(110deg\)/);
});

test("own side names stay as written in every language", async ({ page }) => {
  await mount(
    page,
    {
      type: "custom:sun-azimuth-card-pro",
      house: { front: 45, sides: { front: "Street", back: "Garden" } },
      show_sides: true,
      show_events: true,
    },
    { time: NOON },
  );
  const c = card(page);
  const names = c.locator(".side .primary");
  // the unnamed right (315°) and left (135°) sides are called by where they face
  await expect(names).toHaveText(["Street", "North-West side", "Garden", "South-East side"]);
  await setLanguage(page, "de-DE");
  await expect(names).toHaveText(["Street", "Nordwestseite", "Garden", "Südostseite"]);
  await expect(c.locator(".sides .key")).toHaveText("Seiten des Hauses");
  await expect(c.locator(".head .primary")).toHaveText("Südost");
  await expect(c.locator(".head .secondary")).toHaveText("138° · Höhe 57°");
  await expect(c.locator(".house .primary")).toHaveText("Sonne auf Südostseite + Garden");
  await expect(c.locator(".items .n.noon")).toHaveText("62° hoch");
  await setLanguage(page, "fi");
  await expect(c.locator(".sides .key")).toHaveText("Sides of the house");
});

test("a wall set to false stays dark and drops out of the lists", async ({ page }) => {
  await mount(
    page,
    {
      type: "custom:sun-azimuth-card-pro",
      house: { front: 20, sides: { front: "Street", left: false } },
      show_sides: true,
    },
    { time: NOON },
  );
  const c = card(page);
  // the left (110°) would be in the sun: drawn, but plain
  const dial = c.locator("svg.dial");
  await expect(dial.locator(".wall")).toHaveCount(4);
  await expect(dial.locator(".wall.lit")).toHaveCount(1); // the back alone
  await expect(c.locator(".house .primary")).toHaveText("Sun on South side");
  await expect(c.locator(".side .primary")).toHaveText(["Street", "West side", "South side"]);
});

test("hovering a timeline previews the sun at that time", async ({ page }) => {
  await mount(
    page,
    {
      type: "custom:sun-azimuth-card-pro",
      house: { front: 20 },
      show_events: true,
      show_sides: true,
    },
    { time: NOON },
  );
  const c = card(page);
  const footer = c.locator(".sides");
  const chip = c.locator("svg.dial .chip text");
  await expect(chip).toHaveText("138°");
  const bar = c.locator(".side").nth(2).locator(".lbar");
  await bar.scrollIntoViewIfNeeded(); // the footer sits below the 800 px viewport
  const box = (await bar.boundingBox())!;
  // the right end of the axis is around 23:00: the sun is down there
  await page.mouse.move(box.x + box.width * 0.95, box.y + box.height / 2);
  await expect(footer).toHaveClass(/scrub/);
  await expect(footer.locator(".sechead .secondary")).toHaveText(/^2[12]:\d\d$/);
  await expect(c.locator("svg.dial circle.sun")).toHaveClass(/down/);
  await expect(c.locator("svg.dial .beam")).toHaveCount(0);
  // every bar carries the hairline at the same place
  const lefts = await footer
    .locator(".lbar .hair")
    .evaluateAll((els) => els.map((el) => (el as HTMLElement).style.left));
  expect(lefts).toHaveLength(4);
  expect(new Set(lefts).size).toBe(1);
  expect(parseFloat(lefts[0])).toBeGreaterThan(90);
  // the head keeps the real time
  await expect(c.locator(".head .secondary")).toHaveText("138° · Elevation 57°");
  // leaving puts the sun back
  await page.mouse.move(box.x - 100, box.y - 300);
  await expect(footer).not.toHaveClass(/scrub/);
  await expect(footer.locator(".sechead .secondary")).toHaveText("Today");
  await expect(chip).toHaveText("138°");
  await expect(c.locator("svg.dial circle.sun")).not.toHaveClass(/down/);
});

test("hover_preview: false leaves the plot alone", async ({ page }) => {
  await mount(
    page,
    { type: "custom:sun-azimuth-card-pro", hover_preview: false, show_sides: true },
    { time: NOON },
  );
  const c = card(page);
  const bar = c.locator(".side").nth(2).locator(".lbar");
  await bar.scrollIntoViewIfNeeded(); // the footer sits below the 800 px viewport
  const box = (await bar.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.95, box.y + box.height / 2);
  await expect(c.locator(".sides")).not.toHaveClass(/scrub/);
  await expect(c.locator(".sides .sechead .secondary")).toHaveText("Today");
  await expect(c.locator("svg.dial circle.sun")).not.toHaveClass(/down/);
});

test("the 3D view draws the scene and the slider orbits it", async ({ page }) => {
  await mount(
    page,
    {
      type: "custom:sun-azimuth-card-pro",
      view: "3d",
      house: { front: 20 },
      camera: 180,
      camera_slider: true,
      show_sides: true,
    },
    { time: NOON },
  );
  const c = card(page);
  await expect(c.locator(".head .primary")).toHaveText("South-East");
  await expect(c.locator(".head .secondary")).toHaveText("138° · Elevation 57°");
  const scene = c.locator("svg.scene");
  // drawn in px at the column's width: wide enough for the dome's full size, the labels keep theirs
  const box = await c.locator(".visual").evaluate((visual) => {
    const svg = visual.querySelector("svg.scene") as SVGSVGElement;
    const vb = svg.viewBox.baseVal;
    const dome = (svg.querySelector(".dome") as SVGGraphicsElement).getBBox();
    const label = (svg.querySelector("text.cl") as SVGTextElement).getBoundingClientRect();
    return {
      vb: vb.width,
      column: visual.clientWidth,
      dome: dome.width,
      label: label.height,
    };
  });
  expect(box.vb).toBe(box.column);
  expect(box.dome).toBe(236);
  expect(box.label).toBeLessThan(16);
  await expect(scene.locator(".dome")).toHaveCount(1);
  // the house: two walls and the front slope of its gable roof face the camera
  await expect(scene.locator(".face:not(.roof)")).toHaveCount(2);
  await expect(scene.locator(".face.roof")).toHaveCount(1);
  await expect(scene.locator(".face.roof")).toHaveClass(/lit/);
  await expect(scene.locator(".shadow")).toHaveCount(1);
  await expect(scene.locator(".drop")).toHaveCount(1);
  await expect(scene.locator("circle.sun")).toHaveCount(1);
  await expect(scene.locator(".chip text")).toHaveText(["138°", "57°"]);
  // from the north looking south: N, E and W on the ground, S left out behind the dome
  await expect(scene.locator("text.cl")).toHaveText(["N", "E", "W"]);
  // the slider: the controls' slider, in the sun colour
  const slider = c.locator(".control .ctl-slider");
  await expect(slider).toHaveAttribute("role", "slider");
  await expect(slider).toHaveAttribute("aria-label", "Camera");
  await expect(slider).toHaveAttribute("aria-valuenow", "180");
  await expect(slider).toHaveAttribute("aria-valuetext", "180°");
  await expect(c.locator(".caxis span")).toHaveText(["N", "E", "S", "W", "N"]);
  // the compass points sit under the knob at their bearings
  const track = (await slider.locator(".track").boundingBox())!;
  const east = (await c.locator(".caxis span").nth(1).boundingBox())!;
  expect(Math.abs(east.x + east.width / 2 - (track.x + track.width * 0.25))).toBeLessThan(1.5);
  // a drag turns the scene as it goes, with the bearing in the bubble
  await page.mouse.move(track.x + track.width * 0.5, track.y + track.height / 2);
  await page.mouse.down();
  await page.mouse.move(track.x + track.width * 0.25, track.y + track.height / 2, { steps: 4 });
  await expect(slider.locator(".bubble")).toHaveText("90°");
  await expect(slider).toHaveAttribute("aria-valuetext", "90°");
  await expect(scene.locator("text.cl")).toHaveText(["N", "S", "W"]);
  await page.mouse.up();
  await expect(slider.locator(".bubble")).toBeHidden();
  // the keys step it
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuetext", "91°");
  await page.keyboard.press("End");
  await expect(slider).toHaveAttribute("aria-valuenow", "359");
  // the head and the footer do not depend on the camera
  await expect(c.locator(".head .secondary")).toHaveText("138° · Elevation 57°");
  await expect(c.locator(".side")).toHaveCount(4);
});

test("the dial is drawn at a narrow column's width: labels keep their size, lines thin down", async ({
  page,
}) => {
  const cfg = { type: "custom:sun-azimuth-card-pro", show_house: false };
  const measure = () =>
    card(page)
      .locator(".visual")
      .evaluate((visual) => {
        const svg = visual.querySelector("svg.dial") as SVGSVGElement;
        const label = (svg.querySelector("text.cl") as SVGTextElement).getBoundingClientRect();
        const past = getComputedStyle(svg.querySelector(".past") as SVGPathElement).strokeWidth;
        return {
          vb: svg.viewBox.baseVal.width,
          column: visual.clientWidth,
          k: parseFloat(svg.style.getPropertyValue("--k")),
          label: label.height,
          past: parseFloat(past),
        };
      });
  await mount(page, cfg, { time: NOON, width: 400 });
  const wide = await measure();
  expect(wide.vb).toBe(300);
  expect(wide.k).toBe(1);
  expect(wide.past).toBe(2.5);
  await mount(page, cfg, { time: NOON, width: 200 });
  const narrow = await measure();
  // one px per unit: the box is the column, the labels as tall as in the wide card
  expect(narrow.vb).toBe(narrow.column);
  expect(Math.abs(narrow.label - wide.label)).toBeLessThan(0.5);
  // the lines thin with the picture, but no further than LINE_MIN (0.7)
  expect(narrow.k).toBeLessThan(1);
  expect(narrow.k).toBeGreaterThanOrEqual(0.7);
  expect(narrow.past).toBeCloseTo(2.5 * narrow.k, 1);
  // a resize redraws the dial at the new width
  await page.locator("#root").evaluate((el) => (el.style.width = "300px"));
  await expect
    .poll(async () => {
      const r = await measure();
      return r.vb === r.column && r.column > narrow.column;
    })
    .toBe(true);
});

test("the 3D scene fills a narrow column, keeps its size in a wide one and follows a resize", async ({
  page,
}) => {
  const cfg = { type: "custom:sun-azimuth-card-pro", view: "3d", show_sides: false };
  // from the column, which stays while the observer redraws the SVG inside it
  const measure = () =>
    card(page)
      .locator(".visual")
      .evaluate((visual) => {
        const svg = visual.querySelector("svg.scene") as SVGSVGElement;
        const dome = (svg.querySelector(".dome") as SVGGraphicsElement).getBBox();
        return {
          vb: svg.viewBox.baseVal.width,
          column: visual.clientWidth,
          dome: dome.width,
          centre: dome.x + dome.width / 2,
          k: parseFloat(svg.style.getPropertyValue("--k")),
        };
      });
  await mount(page, cfg, { time: NOON, width: 260 });
  let m = await measure();
  expect(m.vb).toBe(m.column);
  expect(m.dome / m.column).toBeGreaterThan(0.75);
  // a smaller sphere, thinner lines
  expect(m.k).toBeLessThan(1);
  await mount(page, cfg, { time: NOON, width: 1000 });
  m = await measure();
  expect(m.vb).toBe(m.column);
  expect(m.dome).toBe(236);
  expect(m.centre).toBe(m.column / 2);
  expect(m.k).toBe(1);
  // the card is redrawn at its new width
  await page.locator("#root").evaluate((el) => (el.style.width = "300px"));
  await expect
    .poll(async () => {
      const r = await measure();
      return r.vb === r.column && r.column < 300 && r.dome / r.column > 0.75;
    })
    .toBe(true);
});

test("at night the sun is below the horizon everywhere", async ({ page }) => {
  await mount(
    page,
    {
      type: "custom:sun-azimuth-card-pro",
      house: { front: 20 },
      show_events: true,
      show_sides: true,
    },
    { time: new Date("2026-06-21T02:00:00+02:00") },
  );
  const c = card(page);
  await expect(c.locator(".head .primary")).toHaveText("North");
  await expect(c.locator(".head .secondary")).toHaveText(/^6° · below the horizon · rises 05:1\d$/);
  const dial = c.locator("svg.dial");
  await expect(dial.locator("circle.sun")).toHaveClass(/down/);
  await expect(dial.locator(".beam")).toHaveCount(0);
  await expect(dial.locator(".azarc")).toHaveCount(0);
  await expect(dial.locator(".chip")).toHaveCount(0);
  await expect(dial.locator(".past")).toHaveCount(0);
  await expect(dial.locator(".future")).toHaveCount(1);
  await expect(dial.locator(".wall.lit")).toHaveCount(0);
  await expect(c.locator(".house .primary")).toHaveText("No side in the sun");
  await expect(c.locator(".house .secondary")).toHaveText(/^next: North side from 05:\d\d$/);
  await expect(c.locator(".side .pill")).toHaveText([
    /^from 05:\d\d$/, // the front (20°)
    /^from 1\d:\d\d$/, // the right (290°) waits for the afternoon
    /^from 1\d:\d\d$/, // the back (200°) for the forenoon
    /^from 05:\d\d$/, // the left (110°)
  ]);
  // the now dot is outside the timeline
  await expect(c.locator(".side").first().locator(".lbar b")).toBeHidden();
});

test("house.roof shapes the house in both views", async ({ page }) => {
  await mount(
    page,
    [
      { type: "custom:sun-azimuth-card-pro", view: "3d", house: { roof: "flat" } },
      { type: "custom:sun-azimuth-card-pro", house: { roof: "flat" } },
      { type: "custom:sun-azimuth-card-pro", view: "3d", house: { roof: "gable_front" } },
      { type: "custom:sun-azimuth-card-pro", house: { roof: "hip" } },
    ],
    { time: NOON },
  );
  // flat: one roof, in the sun at noon, and no lines on the dial's footprint
  await expect(card(page, 0).locator("svg.scene .face.roof")).toHaveCount(1);
  await expect(card(page, 0).locator("svg.scene .face.roof")).toHaveClass(/lit/);
  await expect(card(page, 1).locator("svg.dial .ridge")).toHaveCount(0);
  // from the default camera (north, looking south) the front's gable shows: five corners
  const walls = await card(page, 2)
    .locator("svg.scene .face:not(.roof)")
    .evaluateAll((els) => els.map((el) => el.getAttribute("d")!.split(" L").length));
  expect(walls).toContain(5);
  // a hip roof on the dial: the ridge and the four hips
  await expect(card(page, 3).locator("svg.dial .ridge")).toHaveAttribute(
    "d",
    /^M[^M]+(M[^M]+){4}$/,
  );
});

test("the 3D view at night hides the sun and the shadow", async ({ page }) => {
  await mount(
    page,
    { type: "custom:sun-azimuth-card-pro", view: "3d" },
    { time: new Date("2026-06-21T02:00:00+02:00") },
  );
  const scene = card(page).locator("svg.scene");
  await expect(scene.locator("circle.sun")).toHaveCount(0);
  await expect(scene.locator(".shadow")).toHaveCount(0);
  await expect(scene.locator(".drop")).toHaveCount(0);
  await expect(scene.locator(".chip")).toHaveCount(0);
  await expect(scene.locator(".face.lit")).toHaveCount(0);
  await expect(card(page).locator(".head .secondary")).toHaveText(/^\d+° · below the horizon/);
});

test("the events and sides are opt-in, show_house drops its line, colours reach the card", async ({
  page,
}) => {
  await mount(
    page,
    [
      {
        type: "custom:sun-azimuth-card-pro",
        show_house: false,
        sun_color: "#ff0000",
        night_color: "teal",
        sky_color: "rgb(1, 2, 3)",
        grid_options: { columns: 6 },
      },
      {
        type: "custom:sun-azimuth-card-pro",
        view: "3d",
        show_events: true,
        grid_options: { columns: 6 },
      },
    ],
    { time: NOON },
  );
  const a = card(page, 0);
  await expect(a.locator(".sides")).toHaveCount(0);
  await expect(a.locator(".house")).toHaveCount(0);
  await expect(a.locator(".items")).toHaveCount(0);
  await expect(a.locator(".divider")).toHaveCount(0);
  await expect(a.locator("svg.dial")).toHaveCount(1);
  const vars = await a
    .locator("ha-card")
    .evaluate((el) => [
      el.style.getPropertyValue("--saz-sun"),
      el.style.getPropertyValue("--saz-night"),
      el.style.getPropertyValue("--saz-sky"),
    ]);
  expect(vars).toEqual(["#ff0000", "var(--teal-color)", "rgb(1, 2, 3)"]);
  const b = card(page, 1);
  await expect(b.locator(".sides")).toHaveCount(0);
  await expect(b.locator(".house")).toHaveCount(1);
  await expect(b.locator(".items")).toHaveCount(1);
  await expect(b.locator(".control")).toHaveCount(0);
  // the narrow column keeps the picture inside the card
  const cardBox = (await b.locator("ha-card").boundingBox())!;
  const sceneBox = (await b.locator("svg.scene").boundingBox())!;
  expect(sceneBox.x).toBeGreaterThanOrEqual(cardBox.x);
  expect(sceneBox.x + sceneBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width + 1);
});

test("moves the sun with time", async ({ page }) => {
  await mount(
    page,
    { type: "custom:sun-azimuth-card-pro" },
    { time: new Date("2026-06-21T08:00:00+02:00") },
  );
  const c = card(page);
  await expect(c.locator(".head .primary")).toHaveText("East");
  await expect(c.locator(".head .secondary")).toHaveText(/^(7|8)\d° · Elevation /);
  const early = parseFloat((await c.locator("svg.dial circle.sun").getAttribute("cx"))!);
  await page.clock.setFixedTime(new Date("2026-06-21T18:00:00+02:00"));
  await page.evaluate(() => window.pc.card(0)._render());
  await expect(c.locator(".head .primary")).toHaveText("West");
  await expect(c.locator(".head .secondary")).toHaveText(/^26\d° · Elevation /);
  const late = parseFloat((await c.locator("svg.dial circle.sun").getAttribute("cx"))!);
  expect(early).toBeGreaterThan(150); // east of the house in the morning
  expect(late).toBeLessThan(150); // west in the evening
});
