// The cards' visual editors in the browser, with the docs' stand-ins for Home Assistant's form, card
// editor and card picker (the harness defines them as the docs do)
import type { Locator, Page } from "@playwright/test";
import { test, expect, mount } from "./util.ts";

type Raw = Record<string, unknown>;

// a card type's editor on the page, configured as `config`; what it sends is in window.sent
const openEditor = async (page: Page, config: Raw) => {
  await mount(page, { type: "custom:tile-card-pro", entity: "light.kitchen" });
  await page.evaluate((cfg) => {
    type Editor = HTMLElement & { setConfig(c: unknown): void; hass: unknown };
    const w = window as unknown as { sent: unknown[] };
    const Card = customElements.get(String(cfg.type).slice(7)) as unknown as {
      getConfigElement(): Editor;
    };
    const ed = Card.getConfigElement();
    ed.setConfig(cfg);
    ed.hass = window.pc.snapshot();
    w.sent = [];
    ed.addEventListener("config-changed", (e) => w.sent.push((e as CustomEvent).detail.config));
    document.body.appendChild(ed);
  }, config);
  const tag = `${String(config.type).slice(7)}-editor`;
  return {
    editor: page.locator(tag),
    // the editor's (first) form: the card's own, or a container's options
    form: page.locator(`${tag} ha-form`).first(),
    last: () => page.evaluate(() => (window as unknown as { sent: Raw[] }).sent.at(-1) ?? null),
    count: () => page.evaluate(() => (window as unknown as { sent: Raw[] }).sent.length),
  };
};

// a form's field by name: typed and left, picked, switched, or opened
const field = (scope: Locator, name: string) => scope.locator(`[data-name="${name}"]`).first();
const fill = async (scope: Locator, name: string, value: string) => {
  const input = field(scope, name).locator("input, textarea").first();
  await input.fill(value);
  await input.press("Tab");
};
const choose = (scope: Locator, name: string, value: string) =>
  field(scope, name).locator("select").first().selectOption(value);
// a switch, turned by its label (its knob covers the checkbox)
const toggle = (scope: Locator, name: string) =>
  field(scope, name).locator("label").first().click();
const openSection = (form: Locator, title: string) =>
  form.locator("summary", { hasText: title }).click();
// the entity picker: searched, then an entity picked from its list by name
const pickEntity = async (scope: Locator, name: string, query: string, option: string) => {
  const input = field(scope, name).locator("input").first();
  await input.click();
  await input.fill(query);
  await field(scope, name).locator(".opt", { hasText: option }).first().click();
};
// a list's dialog for a new item, or for its n-th
const addItem = async (scope: Locator, name: string) => {
  await field(scope, name).getByRole("button", { name: "Add", exact: true }).click();
  return field(scope, name).locator(".edit ha-form");
};
const saveItem = (scope: Locator, name: string) =>
  field(scope, name).locator(".edit").getByRole("button", { name: "Save" }).click();

test("the tile's editor writes the visual it is given", async ({ page }) => {
  const e = await openEditor(page, { type: "custom:tile-card-pro", entity: "light.living_room" });
  await openSection(e.form, "Appearance");
  await choose(e.form, "visual_thing", "sparkline");
  await expect.poll(e.last).toEqual({
    type: "custom:tile-card-pro",
    entity: "light.living_room",
    visual: "sparkline",
  });
  // the history's options show for the line, and write it as a thing with options
  await fill(e.form, "visual_hours", "6");
  await expect.poll(e.last).toMatchObject({ visual: { type: "sparkline", hours: 6 } });
});

test("the entity picker searches the demo home and picks by click or keyboard", async ({
  page,
}) => {
  // (the entity as it is: every entity to pick)
  const e = await openEditor(page, {
    type: "custom:tile-card-pro",
    entity: "sensor.living_room_temperature",
  });
  const entity = field(e.form, "entity");
  const input = entity.locator("input");
  await expect(input).toHaveValue("Living room temperature");
  await input.click();
  // a search shows what matches every word, by name or id
  await input.fill("living temp");
  await expect(entity.locator(".opt .main")).toHaveText(["Living room temperature"]);
  await input.fill("light.living");
  await expect(entity.locator(".opt .sub").first()).toHaveText("light.living_room");
  await input.fill("no such thing");
  await expect(entity.locator(".none")).toHaveText("No matching entities");
  // Escape leaves the entity as it was
  await input.press("Escape");
  await expect(input).toHaveValue("Living room temperature");
  expect(await e.count()).toBe(0);
  // the keyboard picks
  await input.click();
  await input.fill("light.living");
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect.poll(e.last).toMatchObject({ entity: "light.living_room" });
  // (a light now: the picker offers lights)
  // a click picks
  await pickEntity(e.form, "entity", "kitchen", "Kitchen");
  await expect.poll(e.last).toEqual({ type: "custom:tile-card-pro", entity: "light.kitchen" });
  await expect(input).toHaveValue("Kitchen");
  // cleared
  await entity.getByRole("button", { name: "Clear" }).click();
  await expect.poll(e.last).toEqual({ type: "custom:tile-card-pro" });
});

test("the poster shows a kind, its entities and inputs right under it", async ({ page }) => {
  const e = await openEditor(page, { type: "custom:poster-card-pro", entity: "sensor.grid_power" });
  await expect(field(e.form, "shows").locator("select")).toHaveValue("none");
  await expect(field(e.form, "input_import")).toHaveCount(0);
  await choose(e.form, "shows", "grid");
  await expect.poll(e.last).toEqual({
    type: "custom:poster-card-pro",
    entity: "sensor.grid_power",
    kind: "grid",
  });
  // the grid reads its import and export, right under its entity
  const input = field(e.form, "input_import").locator("input");
  await input.click();
  await input.fill("kitchen");
  // only power sensors: a kitchen's light or temperature is not one
  await expect(field(e.form, "input_import").locator(".none")).toBeVisible();
  await input.fill("");
  const ids = await field(e.form, "input_import").locator(".opt .sub").allTextContents();
  expect(ids.length).toBeGreaterThan(1);
  expect(ids.every((id) => id.startsWith("sensor."))).toBe(true);
  await input.press("Escape");
  await pickEntity(e.form, "input_import", "grid import", "Grid import power");
  await expect.poll(e.last).toEqual({
    type: "custom:poster-card-pro",
    entity: "sensor.grid_power",
    kind: "grid",
    inputs: { import: "sensor.grid_import_power" },
  });
  // the entity as it is again: the inputs only the grid read go
  await choose(e.form, "shows", "none");
  await expect.poll(e.last).toEqual({
    type: "custom:poster-card-pro",
    entity: "sensor.grid_power",
  });
  await expect(field(e.form, "input_import")).toHaveCount(0);
  // a kind the entity does not fit waits for one that does, its picker offering only those
  await choose(e.form, "shows", "wind");
  await expect(field(e.form, "entity").locator("input")).toHaveValue("");
  const entity = field(e.form, "entity").locator("input");
  await entity.click();
  await entity.fill("temperature");
  await expect(field(e.form, "entity").locator(".none")).toBeVisible();
  await entity.press("Escape");
  await expect.poll(e.last).toEqual({
    type: "custom:poster-card-pro",
    entity: "sensor.grid_power",
  });
  await pickEntity(e.form, "entity", "wind speed", "Wind speed");
  await expect
    .poll(e.last)
    .toEqual({ type: "custom:poster-card-pro", entity: "sensor.wind_speed" });
  // your own texts: no entity
  await choose(e.form, "shows", "custom");
  await expect.poll(e.last).toEqual({ type: "custom:poster-card-pro" });
  await expect(field(e.form, "entity")).toHaveCount(0);
});

// a list of our own (badges, rules): its rows, an item's view on top of the form, back again
const listOf = (form: Locator, name: string) =>
  field(form, name).locator(`ha-selector-pro_cards_${name}`);
const rowTitles = (list: Locator) => list.locator(".row .title");
const itemView = (editor: Locator) => editor.locator("ha-form").nth(1);
const back = (editor: Locator) => editor.locator("button[title='Back']").click();

test("the poster's badges are added in a view of their own, edited and deleted", async ({
  page,
}) => {
  const e = await openEditor(page, { type: "custom:poster-card-pro", entity: "sensor.wind_speed" });
  await openSection(e.form, "Status and badges");
  const badges = listOf(e.form, "badges");
  // a new badge: its view on a draft, added by its entity
  await badges.locator("button.new").click();
  await pickEntity(itemView(e.editor), "entity", "gust", "Wind gust");
  await expect.poll(e.last).toMatchObject({ badges: ["sensor.wind_gust"] });
  await back(e.editor);
  // the row names the entity; its view edits it
  await expect(rowTitles(badges)).toHaveText(["Wind gust"]);
  await badges.locator(".row .main").first().click();
  // its name: shown, then written
  await toggle(itemView(e.editor), "show_name");
  await fill(itemView(e.editor), "name", "Gusts");
  await expect.poll(e.last).toMatchObject({
    badges: [{ entity: "sensor.wind_gust", name: "Gusts", show_name: true }],
  });
  await back(e.editor);
  await expect(rowTitles(badges)).toHaveText(["Gusts"]);
  // deleted
  await badges.getByRole("button", { name: "Delete" }).click();
  await expect
    .poll(e.last)
    .toEqual({ type: "custom:poster-card-pro", entity: "sensor.wind_speed" });
});

test("a badge's kind, look and visual are set in its view, by what it shows", async ({ page }) => {
  const e = await openEditor(page, {
    type: "custom:poster-card-pro",
    entity: "sensor.wind_speed",
    badges: ["sensor.battery_soc"],
  });
  await openSection(e.form, "Status and badges");
  await listOf(e.form, "badges").locator(".row .main").first().click();
  const view = itemView(e.editor);
  await expect(field(view, "shows").locator("select")).toHaveValue("battery");
  await choose(view, "shows", "none");
  await openSection(view, "Appearance");
  await choose(view, "icon_type", "dot");
  // a number: after it a trend over its hours
  await openSection(view, "Visual");
  await choose(view, "visual", "trend");
  await fill(view, "hours", "6");
  await expect.poll(e.last).toMatchObject({
    badges: [
      {
        entity: "sensor.battery_soc",
        kind: "none",
        icon: { type: "dot" },
        visual: { type: "trend", hours: 6 },
      },
    ],
  });
  // a battery does not switch: no switch to set
  await expect(field(view, "control")).toHaveCount(0);
});

test("a badge's rules open on top of the badge's view", async ({ page }) => {
  const e = await openEditor(page, {
    type: "custom:poster-card-pro",
    entity: "sensor.wind_speed",
    badges: [{ entity: "sensor.battery_soc", rules: [{ below: 20, color: "red" }] }],
  });
  await openSection(e.form, "Status and badges");
  await listOf(e.form, "badges").locator(".row .main").first().click();
  await openSection(itemView(e.editor), "Rules");
  const rules = listOf(itemView(e.editor), "rules");
  await expect(rowTitles(rules)).toHaveText(["Below 20 %"]);
  await rules.locator(".row .main").first().click();
  // a badge's rule writes a text in place of the badge's value
  await fill(itemView(e.editor), "value", "Low");
  await expect.poll(e.last).toMatchObject({
    badges: [{ entity: "sensor.battery_soc", rules: [{ below: 20, color: "red", value: "Low" }] }],
  });
  // back to the badge, then to the card
  await back(e.editor);
  await expect(rowTitles(listOf(itemView(e.editor), "rules"))).toHaveText(["Below 20 %"]);
  await back(e.editor);
  await expect(listOf(e.form, "badges")).toBeVisible();
});

test("the poster's rules are added, ordered and deleted", async ({ page }) => {
  // (a temperature: its kind brings no rules of its own)
  const e = await openEditor(page, {
    type: "custom:poster-card-pro",
    entity: "sensor.living_room_temperature",
  });
  await openSection(e.form, "Rules");
  const rules = listOf(e.form, "rules");
  await rules.locator("button.new").click();
  await fill(itemView(e.editor), "above", "30");
  await choose(itemView(e.editor), "color", "red");
  await fill(itemView(e.editor), "status", "Stormy");
  await expect.poll(e.last).toMatchObject({
    rules: [{ above: 30, color: "red", status: "Stormy" }],
  });
  await back(e.editor);
  await rules.locator("button.new").click();
  await fill(itemView(e.editor), "above", "10");
  await fill(itemView(e.editor), "status", "Windy");
  await back(e.editor);
  await expect(rowTitles(rules)).toHaveText(["Above 30 °C", "Above 10 °C"]);
  // rules match in the order written: moved up, the second comes first
  await rules.locator(".row").nth(1).getByRole("button", { name: "Move up" }).click();
  await expect.poll(e.last).toMatchObject({
    rules: [
      { above: 10, status: "Windy" },
      { above: 30, color: "red", status: "Stormy" },
    ],
  });
  await rules.locator(".row").nth(0).getByRole("button", { name: "Delete" }).click();
  await expect.poll(e.last).toMatchObject({ rules: [{ above: 30, status: "Stormy" }] });
});

test("the kind's rules are shown, copied when one changes, and come back", async ({ page }) => {
  const wind = { type: "custom:poster-card-pro", entity: "sensor.wind_speed" };
  const e = await openEditor(page, wind);
  await openSection(e.form, "Rules");
  const rules = listOf(e.form, "rules");
  await expect(rowTitles(rules)).toHaveText([
    "Below 5 km/h",
    "Below 20 km/h",
    "Below 35 km/h",
    "Below 50 km/h",
    "Above 50 km/h",
  ]);
  await expect(field(e.form, "rules_from").locator("select")).toHaveValue("default");
  // Breezy green: all five become the card's, with the change
  await rules.locator(".row .main").nth(1).click();
  await choose(itemView(e.editor), "color", "green");
  await expect.poll(e.last).toMatchObject({
    rules: [
      { below: 5, status: "Calm" },
      { below: 20, color: "green", status: "Breezy" },
      { below: 35, status: "Windy" },
      { below: 50, status: "Strong wind" },
      { above: 50, status: "Stormy", tint_card: true },
    ],
  });
  await back(e.editor);
  await expect(field(e.form, "rules_from").locator("select")).toHaveValue("own");
  // back to the kind's
  await choose(e.form, "rules_from", "default");
  await expect.poll(e.last).toEqual(wind);
});

test("the tile's controls and status badge", async ({ page }) => {
  const e = await openEditor(page, { type: "custom:tile-card-pro", entity: "light.living_room" });
  await openSection(e.form, "Controls");
  const types = await field(e.form, "control_type").locator("option").allTextContents();
  expect(types.length).toBeGreaterThan(2);
  await choose(e.form, "control_type", "none");
  await expect.poll(e.last).toMatchObject({ control: false });
  // the kind's own again: nothing written
  await choose(e.form, "control_type", "default");
  await expect.poll(e.last).toEqual({ type: "custom:tile-card-pro", entity: "light.living_room" });
  await openSection(e.form, "Status and badges");
  await toggle(e.form, "status_badge");
  await expect.poll(e.last).toEqual({
    type: "custom:tile-card-pro",
    entity: "light.living_room",
    status_badge: true,
  });
});

test("the layout's editor edits a card through that card's own editor", async ({ page }) => {
  const tile = { type: "custom:tile-card-pro", entity: "light.kitchen" };
  await openEditor(page, { type: "custom:layout-card-pro", cards: [tile] });
  const child = page
    .locator("layout-card-pro-editor hui-card-element-editor tile-card-pro-editor ha-form")
    .first();
  await fill(child, "name", "Worktop");
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { sent: unknown[] }).sent.at(-1)))
    .toEqual({ type: "custom:layout-card-pro", cards: [{ ...tile, name: "Worktop" }] });
});

test("the layout's editor writes its options, breakpoints and a card's place", async ({ page }) => {
  const tile = { type: "custom:tile-card-pro", entity: "light.kitchen" };
  const e = await openEditor(page, { type: "custom:layout-card-pro", cards: [tile] });
  await fill(e.form, "columns", "1fr 2fr");
  await expect.poll(e.last).toEqual({
    type: "custom:layout-card-pro",
    columns: ["1fr", "2fr"],
    cards: [tile],
  });
  const bp = await addItem(e.form, "breakpoints");
  await fill(bp, "at", "3");
  await fill(bp, "columns", "4");
  await saveItem(e.form, "breakpoints");
  await expect.poll(e.last).toMatchObject({ breakpoints: { 3: { columns: 4 } } });
  // the selected card's place
  const place = e.editor.locator(".place ha-form");
  await expect(e.editor.locator(".place h3")).toHaveText("Place in the layout");
  await fill(place, "span_cols", "2");
  await expect.poll(e.last).toMatchObject({ cards: [{ ...tile, view_layout: { span: 2 } }] });
  await toggle(place, "span_full");
  await expect.poll(e.last).toMatchObject({ cards: [{ ...tile, view_layout: { span: "full" } }] });
  // full width has no column count
  await expect(field(place, "span_cols")).toHaveCount(0);
});

test("the layout's editor adds a card from the picker and arranges its cards", async ({ page }) => {
  const tile = { type: "custom:tile-card-pro", entity: "light.kitchen" };
  const e = await openEditor(page, { type: "custom:layout-card-pro", cards: [tile] });
  await e.editor.getByRole("tab", { name: "Add a card" }).click();
  await e.editor.locator("hui-card-picker button", { hasText: "Poster Card Pro" }).click();
  await expect.poll(async () => ((await e.last())?.cards as Raw[])?.length).toBe(2);
  await expect(e.editor.locator(".tab")).toHaveText(["1Tile Pro", "2Poster Pro"]);
  await expect(e.editor.locator(".tab").nth(1)).toHaveAttribute("aria-selected", "true");
  // the new card's own editor is open
  await expect(e.editor.locator("hui-card-element-editor poster-card-pro-editor")).toHaveCount(1);
  await e.editor.getByRole("button", { name: "Move left" }).click();
  await expect(e.editor.locator(".tab")).toHaveText(["1Poster Pro", "2Tile Pro"]);
  await e.editor.getByRole("button", { name: "Delete" }).click();
  await expect.poll(e.last).toEqual({ type: "custom:layout-card-pro", cards: [tile] });
});

test("the swipe card's editor edits a poster through the poster's own editor", async ({ page }) => {
  const poster = { type: "custom:poster-card-pro", entity: "sensor.wind_speed" };
  const e = await openEditor(page, { type: "custom:swipe-card-pro", cards: [poster] });
  // its own options first
  await choose(e.form, "indicator", "none");
  await expect.poll(e.last).toEqual({
    type: "custom:swipe-card-pro",
    indicator: "none",
    cards: [poster],
  });
  const child = e.editor.locator("hui-card-element-editor poster-card-pro-editor ha-form").first();
  await fill(child, "name", "Wind");
  await expect.poll(e.last).toEqual({
    type: "custom:swipe-card-pro",
    indicator: "none",
    cards: [{ ...poster, name: "Wind" }],
  });
  // no place on a swipe card
  await expect(e.editor.locator(".place")).toBeHidden();
  // the poster as code, and back
  await e.editor.getByRole("button", { name: "Show code editor" }).click();
  const code = e.editor.locator("hui-card-element-editor textarea");
  await expect(code).toHaveValue(/name: Wind/);
  await code.fill("type: custom:poster-card-pro\nentity: sensor.wind_gust\n");
  await code.blur();
  await expect.poll(e.last).toMatchObject({
    cards: [{ type: "custom:poster-card-pro", entity: "sensor.wind_gust" }],
  });
  await e.editor.getByRole("button", { name: "Show visual editor" }).click();
  await expect(field(child, "entity").locator("input")).toHaveValue("Wind gust");
});

test("the tile group's editor edits a tile in the tile's own editor", async ({ page }) => {
  const e = await openEditor(page, {
    type: "custom:tile-group-card-pro",
    title: "Lights",
    tiles: ["light.kitchen", "light.living_room"],
  });
  await expect(e.editor.locator(".tab")).toHaveText(["1Kitchen", "2Living room"]);
  const tile = e.editor.locator("hui-card-element-editor tile-card-pro-editor ha-form").first();
  await fill(tile, "name", "Worktop");
  await expect.poll(e.last).toEqual({
    type: "custom:tile-group-card-pro",
    title: "Lights",
    tiles: [{ entity: "light.kitchen", name: "Worktop" }, "light.living_room"],
  });
  await expect(e.editor.locator(".tab").first()).toHaveText("1Worktop");
});

test("the heading's style, layout and badges are set in its form", async ({ page }) => {
  const e = await openEditor(page, { type: "custom:heading-card-pro", title: "Office" });
  await choose(e.form, "style", "big");
  await expect
    .poll(e.last)
    .toEqual({ type: "custom:heading-card-pro", title: "Office", style: "big" });
  // a badge added in its dialog: the entity alone is written as its id
  const item = await addItem(e.form, "badges");
  await pickEntity(item, "entity", "gust", "Wind gust");
  await saveItem(e.form, "badges");
  await expect.poll(e.last).toMatchObject({ style: "big", badges: ["sensor.wind_gust"] });
  // where the badges sit, from the Layout section; back to the default writes nothing
  await openSection(e.form, "Layout");
  await choose(e.form, "badges_position", "below");
  await expect.poll(e.last).toMatchObject({ badges_position: "below" });
  await choose(e.form, "badges_position", "end");
  await expect.poll(e.last).toEqual({
    type: "custom:heading-card-pro",
    title: "Office",
    style: "big",
    badges: ["sensor.wind_gust"],
  });
});

test("the tile group's header badges are added in the badge list", async ({ page }) => {
  const e = await openEditor(page, {
    type: "custom:tile-group-card-pro",
    title: "Living room",
    tiles: ["light.living_room"],
  });
  const item = await addItem(e.form, "badges");
  await pickEntity(item, "entity", "gust", "Wind gust");
  await saveItem(e.form, "badges");
  await expect.poll(e.last).toEqual({
    type: "custom:tile-group-card-pro",
    title: "Living room",
    badges: ["sensor.wind_gust"],
    tiles: ["light.living_room"],
  });
});

test("the sun azimuth's house and view are set in its form", async ({ page }) => {
  const e = await openEditor(page, { type: "custom:sun-azimuth-card-pro", house: { front: 110 } });
  await openSection(e.form, "House");
  // a side's default name is where it faces from the front's bearing
  await expect(field(e.form, "side_front")).toContainText("Default: East side");
  await choose(e.form, "roof", "hip");
  await expect.poll(e.last).toEqual({
    type: "custom:sun-azimuth-card-pro",
    house: { front: 110, roof: "hip" },
  });
  await toggle(e.form, "wall_left");
  await expect.poll(e.last).toMatchObject({ house: { sides: { left: false } } });
  // a dial has no camera
  await expect(e.form.locator("summary", { hasText: "3D view" })).toHaveCount(1);
  await choose(e.form, "view", "dial");
  await expect.poll(e.last).toMatchObject({ view: "dial" });
  await expect(e.form.locator("summary", { hasText: "3D view" })).toHaveCount(0);
});

test("the weather card's sections are edited in tabs, each in a form of its type", async ({
  page,
}) => {
  const e = await openEditor(page, { type: "custom:weather-card-pro", entity: "weather.home" });
  // no sections: a tile; "+" adds the lead, then a forecast
  await expect(e.editor.locator(".child")).toContainText("the card is a tile");
  await e.editor.locator(".icon.add").click();
  await expect.poll(e.last).toEqual({
    type: "custom:weather-card-pro",
    entity: "weather.home",
    sections: [{ type: "hero" }],
  });
  await e.editor.locator(".icon.add").click();
  await expect(e.editor.locator(".tab")).toHaveText(["1Lead", "2Forecast"]);
  // the forecast's own form: hourly shows hours
  const section = e.editor.locator("weather-card-pro-section-editor ha-form");
  await choose(section, "mode", "hourly");
  await fill(section, "hours", "24");
  await expect.poll(e.last).toMatchObject({
    sections: [{ type: "hero" }, { type: "forecast", mode: "hourly", hours: 24 }],
  });
  // a section has no code view of its own
  await expect(e.editor.locator(".tools .icon").first()).toBeHidden();
  // both deleted: a tile again, without an empty list
  await e.editor.getByRole("button", { name: "Delete" }).click();
  await e.editor.locator(".tab").first().click();
  await e.editor.getByRole("button", { name: "Delete" }).click();
  await expect.poll(e.last).toEqual({ type: "custom:weather-card-pro", entity: "weather.home" });
});

test("the power flow's sources are edited in tabs, and stay before its consumers", async ({
  page,
}) => {
  const e = await openEditor(page, {
    type: "custom:power-flow-card-pro",
    sources: [{ type: "solar", entity: "sensor.solar_power" }],
    consumers: ["sensor.heat_pump_power"],
  });
  // "+" adds the next source a home usually has: a battery, measured by one signed sensor
  await e.editor.locator(".icon.add").click();
  await expect(e.editor.locator(".tab")).toHaveText(["1Solar", "2Battery"]);
  const source = e.editor.locator("flow-tree-source-editor ha-form");
  await choose(source, "measure", "pair");
  await expect(field(source, "charge")).toBeVisible();
  await expect(field(source, "power")).toHaveCount(0);
  // an option of the card's own: the sources keep their place in the config
  await openSection(e.form, "Drawing");
  await choose(e.form, "flow_style", "arrows");
  await expect.poll(e.last).toMatchObject({
    sources: [{ type: "solar", entity: "sensor.solar_power" }, { type: "battery" }],
    flow_style: "arrows",
  });
  expect(Object.keys((await e.last()) ?? {})).toEqual([
    "type",
    "sources",
    "consumers",
    "flow_style",
  ]);
});

test("a trend's lines are added in a view of their own, with their rules", async ({ page }) => {
  const e = await openEditor(page, { type: "custom:poster-card-pro", kind: "trend" });
  const lines = e.form.locator("ha-selector-pro_cards_list");
  await lines.locator("button.new").click();
  await pickEntity(itemView(e.editor), "entity", "outdoor temp", "Outdoor temperature");
  await expect.poll(e.last).toMatchObject({ series: ["sensor.outdoor_temperature"] });
  // its rule, on top of the line: red above 25
  await openSection(itemView(e.editor), "Rules");
  await listOf(itemView(e.editor), "rules").locator("button.new").click();
  await fill(itemView(e.editor), "above", "25");
  await choose(itemView(e.editor), "color", "red");
  await expect.poll(e.last).toMatchObject({
    series: [{ entity: "sensor.outdoor_temperature", rules: [{ above: 25, color: "red" }] }],
  });
  await back(e.editor);
  await back(e.editor);
  await expect(rowTitles(lines)).toHaveText(["Outdoor temperature"]);
});
