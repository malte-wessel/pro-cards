import { test, expect, mount, card, setLanguage } from "./util.ts";

// the frozen clock: 21 June 2026, 12:00 CEST in Düsseldorf. The sun stands at 138° (SE), 57° high,
// an hour and a half before solar noon (13:35); sunrise 05:16 at 49°, sunset 21:52 at 311°.

test("the sky dial shows the azimuth, the path and the lit sides", async ({ page }) => {
  await mount(page, {
    type: "custom:sun-azimuth-card-pro",
    title: "Sun",
    icon: "mdi:sun-compass",
    house: { rotation: 20 },
  });
  const c = card(page);
  await expect(c.locator(".header .title")).toHaveText("Sun");
  await expect(c.locator(".header ha-icon")).toHaveAttribute("icon", "mdi:sun-compass");
  // the head
  await expect(c.locator(".head .primary")).toHaveText("Azimuth");
  await expect(c.locator(".head .big b")).toHaveText("138°");
  await expect(c.locator(".head .big span")).toHaveText("SE");
  await expect(c.locator(".head .accent")).toHaveText("Elevation 57° · rising");
  await expect(c.locator(".head .rot")).toHaveCSS("transform", /matrix/);
  // the dial
  const dial = c.locator("svg.dial");
  await expect(dial).toHaveAttribute("viewBox", "0 0 300 300");
  await expect(dial.locator(".past")).toHaveCount(1);
  await expect(dial.locator(".future")).toHaveCount(1);
  await expect(dial.locator(".dayarc")).toHaveCount(1);
  await expect(dial.locator(".beam")).toHaveCount(1);
  await expect(dial.locator(".azarc")).toHaveCount(1);
  await expect(dial.locator(".chip text")).toHaveText("138°");
  await expect(dial.locator(".edge")).toHaveCount(4);
  // the house is turned 20°: the sun at 138° lights its east (110°) and south (200°) sides
  await expect(dial.locator(".edge.lit")).toHaveCount(2);
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
  await expect(c.locator(".items .n.noon")).toHaveText("noon · 62° high");
  await expect(c.locator(".items .v.set")).toHaveText(/^21:5\d$/);
  await expect(c.locator(".items .n.set")).toHaveText("311° NW");
});

test("the sides footer lists every side with its window, pill and timeline", async ({ page }) => {
  await mount(page, { type: "custom:sun-azimuth-card-pro", house: { rotation: 20 } });
  const c = card(page);
  await expect(c.locator(".header")).toBeHidden();
  await expect(c.locator(".sides .key")).toHaveText("Sides of the house");
  await expect(c.locator(".sides .sechead .secondary")).toHaveText("Today");
  const rows = c.locator(".side");
  await expect(rows).toHaveCount(4);
  await expect(rows.locator(".primary")).toHaveText([
    "North side",
    "East side",
    "South side",
    "West side",
  ]);
  await expect(rows.nth(1)).toHaveClass(/lit/);
  await expect(rows.nth(2)).toHaveClass(/lit/);
  await expect(rows.nth(0)).not.toHaveClass(/lit/);
  await expect(rows.locator(".pill")).toHaveText([
    /^from 2\d:\d\d$/, // the north side (20°) catches the sun again in the evening
    "Sun now",
    "Sun now",
    /^from 1[2345]:\d\d$/,
  ]);
  await expect(rows.nth(1).locator(".pill")).toHaveClass(/on/);
  await expect(rows.nth(0).locator(".pill")).not.toHaveClass(/on/);
  // the north side's two windows, the others' one
  await expect(rows.nth(0).locator(".lbar i")).toHaveCount(2);
  await expect(rows.nth(1).locator(".lbar i")).toHaveCount(1);
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
  await expect(rows.nth(1).locator(".rot")).toHaveAttribute("style", /rotate\(110deg\)/);
});

test("own side names stay as written in every language", async ({ page }) => {
  await mount(page, {
    type: "custom:sun-azimuth-card-pro",
    house: { rotation: 45, sides: { north: "Street", south: "Garden" } },
  });
  const c = card(page);
  const names = c.locator(".side .primary");
  await expect(names).toHaveText(["Street", "East side", "Garden", "West side"]);
  await setLanguage(page, "de-DE");
  await expect(names).toHaveText(["Street", "Ostseite", "Garden", "Westseite"]);
  await expect(c.locator(".sides .key")).toHaveText("Seiten des Hauses");
  await expect(c.locator(".head .primary")).toHaveText("Azimut");
  await expect(c.locator(".head .accent")).toHaveText("Höhe 57° · steigend");
  await expect(c.locator(".house .primary")).toHaveText(/^Sonne auf /);
  await expect(c.locator(".items .n.noon")).toHaveText("Mittag · 62° hoch");
  await setLanguage(page, "fi");
  await expect(c.locator(".sides .key")).toHaveText("Sides of the house");
});

test("hovering a timeline previews the sun at that time", async ({ page }) => {
  await mount(page, { type: "custom:sun-azimuth-card-pro", house: { rotation: 20 } });
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
  await expect(c.locator(".head .big b")).toHaveText("138°");
  // leaving puts the sun back
  await page.mouse.move(box.x - 100, box.y - 300);
  await expect(footer).not.toHaveClass(/scrub/);
  await expect(footer.locator(".sechead .secondary")).toHaveText("Today");
  await expect(chip).toHaveText("138°");
  await expect(c.locator("svg.dial circle.sun")).not.toHaveClass(/down/);
});

test("hover_preview: false leaves the plot alone", async ({ page }) => {
  await mount(page, { type: "custom:sun-azimuth-card-pro", hover_preview: false });
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
  await mount(page, {
    type: "custom:sun-azimuth-card-pro",
    view: "3d",
    house: { rotation: 20 },
    camera: 180,
    camera_slider: true,
  });
  const c = card(page);
  await expect(c.locator(".head .primary")).toHaveText("Elevation");
  await expect(c.locator(".head .big b")).toHaveText("57°");
  await expect(c.locator(".head .big span")).toHaveText("SE · 138°");
  await expect(c.locator(".head .accent")).toHaveText("rising");
  await expect(c.locator(".head .rest")).toHaveText(" · shadow 0.7 × height");
  const scene = c.locator("svg.scene");
  await expect(scene).toHaveAttribute("viewBox", "0 0 416 206");
  await expect(scene.locator(".dome")).toHaveCount(1);
  await expect(scene.locator(".face")).toHaveCount(2);
  await expect(scene.locator(".redge")).toHaveCount(4);
  await expect(scene.locator(".redge.lit")).toHaveCount(2);
  await expect(scene.locator(".shadow")).toHaveCount(1);
  await expect(scene.locator(".drop")).toHaveCount(1);
  await expect(scene.locator("circle.sun")).toHaveCount(1);
  await expect(scene.locator(".chip text")).toHaveText(["138°", "57°"]);
  // from the north looking south: N, E and W on the ground, S left out behind the dome
  await expect(scene.locator("text.cl")).toHaveText(["N", "E", "W"]);
  // the slider
  const slider = c.locator(".control input");
  await expect(slider).toHaveValue("180");
  await expect(c.locator(".control .cv")).toHaveText("180°");
  await expect(c.locator(".caxis span")).toHaveText(["N", "E", "S", "W", "N"]);
  await slider.evaluate((el) => {
    (el as HTMLInputElement).value = "90";
    el.dispatchEvent(new Event("input"));
  });
  await expect(c.locator(".control .cv")).toHaveText("90°");
  await expect(scene.locator("text.cl")).toHaveText(["N", "S", "W"]);
  // the head and the footer do not depend on the camera
  await expect(c.locator(".head .big b")).toHaveText("57°");
  await expect(c.locator(".side")).toHaveCount(4);
});

test("the compass ring shows the daylight sector and the day's events", async ({ page }) => {
  await mount(page, { type: "custom:sun-azimuth-card-pro", view: "ring", house: { rotation: 20 } });
  const c = card(page);
  await expect(c.locator(".visual")).toHaveCount(0);
  await expect(c.locator(".items")).toHaveCount(0);
  await expect(c.locator(".house")).toHaveCount(0);
  await expect(c.locator(".lead.ring .az")).toHaveText("138°");
  await expect(c.locator(".lead.ring .cp")).toHaveText("SE");
  // the arc covers the sunrise → sunset bearings: 262° of 360°
  const arc = c.locator(".lead.ring .arc");
  const dash = await arc.evaluate((el) => (el as SVGElement).style.strokeDasharray);
  const [on, total] = dash.split(" ").map(parseFloat);
  expect(on / total).toBeGreaterThan(0.71);
  expect(on / total).toBeLessThan(0.75);
  const dot = c.locator(".lead.ring .dot");
  expect(parseFloat((await dot.getAttribute("cx"))!)).toBeGreaterThan(18); // east of centre
  expect(parseFloat((await dot.getAttribute("cy"))!)).toBeGreaterThan(18); // south of centre
  await expect(c.locator(".lines .l1")).toHaveText(/^Sunrise 05:1\d$/);
  await expect(c.locator(".lines .l1s")).toHaveText("49° · NE");
  await expect(c.locator(".lines .l2")).toHaveText("Now · 57° high");
  await expect(c.locator(".lines .l2s")).toHaveText(/^noon 13:3\d · 62° at 180°$/);
  await expect(c.locator(".lines .l3")).toHaveText(/^Sunset 21:5\d$/);
  await expect(c.locator(".lines .l3s")).toHaveText("311° · NW");
  await expect(c.locator(".side")).toHaveCount(4);
});

test("at night the sun is below the horizon everywhere", async ({ page }) => {
  await mount(
    page,
    { type: "custom:sun-azimuth-card-pro", house: { rotation: 20 } },
    { time: new Date("2026-06-21T02:00:00") },
  );
  const c = card(page);
  await expect(c.locator(".head .big b")).toHaveText("6°");
  await expect(c.locator(".head .accent")).toHaveText(/^below the horizon · rises 05:1\d$/);
  const dial = c.locator("svg.dial");
  await expect(dial.locator("circle.sun")).toHaveClass(/down/);
  await expect(dial.locator(".beam")).toHaveCount(0);
  await expect(dial.locator(".azarc")).toHaveCount(0);
  await expect(dial.locator(".chip")).toHaveCount(0);
  await expect(dial.locator(".past")).toHaveCount(0);
  await expect(dial.locator(".future")).toHaveCount(1);
  await expect(dial.locator(".edge.lit")).toHaveCount(0);
  await expect(c.locator(".house .primary")).toHaveText("No side in the sun");
  await expect(c.locator(".house .secondary")).toHaveText(/^next: North side from 05:\d\d$/);
  await expect(c.locator(".side .pill")).toHaveText([
    /^from 05:\d\d$/,
    /^from 05:\d\d$/,
    /^from 1\d:\d\d$/, // the south side (200°) waits for the forenoon
    /^from 1\d:\d\d$/,
  ]);
  // the now dot is outside the timeline
  await expect(c.locator(".side").first().locator(".lbar b")).toBeHidden();
});

test("the 3D view at night hides the sun and the shadow", async ({ page }) => {
  await mount(
    page,
    { type: "custom:sun-azimuth-card-pro", view: "3d" },
    { time: new Date("2026-06-21T02:00:00") },
  );
  const scene = card(page).locator("svg.scene");
  await expect(scene.locator("circle.sun")).toHaveCount(0);
  await expect(scene.locator(".shadow")).toHaveCount(0);
  await expect(scene.locator(".drop")).toHaveCount(0);
  await expect(scene.locator(".chip")).toHaveCount(0);
  await expect(scene.locator(".face.lit")).toHaveCount(0);
  await expect(card(page).locator(".head .rest")).toHaveText("");
});

test("show_* options drop their sections and colours reach the card", async ({ page }) => {
  await mount(page, [
    {
      type: "custom:sun-azimuth-card-pro",
      show_sides: false,
      show_house: false,
      show_events: false,
      sun_color: "#ff0000",
      night_color: "teal",
      sky_color: "rgb(1, 2, 3)",
      grid_options: { columns: 6 },
    },
    {
      type: "custom:sun-azimuth-card-pro",
      view: "3d",
      show_sides: false,
      grid_options: { columns: 6 },
    },
  ]);
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
    { time: new Date("2026-06-21T08:00:00") },
  );
  const c = card(page);
  await expect(c.locator(".head .big b")).toHaveText(/^(7|8)\d°$/);
  const early = parseFloat((await c.locator("svg.dial circle.sun").getAttribute("cx"))!);
  await page.clock.setFixedTime(new Date("2026-06-21T18:00:00"));
  await page.evaluate(() => window.pc.card(0)._render());
  await expect(c.locator(".head .big b")).toHaveText(/^26\d°$/);
  await expect(c.locator(".head .accent")).toHaveText(/sinking$/);
  const late = parseFloat((await c.locator("svg.dial circle.sun").getAttribute("cx"))!);
  expect(early).toBeGreaterThan(150); // east of the house in the morning
  expect(late).toBeLessThan(150); // west in the evening
});
