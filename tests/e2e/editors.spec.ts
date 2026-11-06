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
  await openSection(e.form, "Icon and visual");
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
  const e = await openEditor(page, { type: "custom:tile-card-pro", entity: "light.kitchen" });
  const entity = field(e.form, "entity");
  const input = entity.locator("input");
  await expect(input).toHaveValue("Kitchen");
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
  await expect(input).toHaveValue("Kitchen");
  expect(await e.count()).toBe(0);
  // the keyboard picks
  await input.click();
  await input.fill("living room");
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect.poll(e.last).toMatchObject({ entity: expect.stringMatching(/living_room/) });
  // a click picks
  await pickEntity(e.form, "entity", "kitchen", "Kitchen");
  await expect.poll(e.last).toEqual({ type: "custom:tile-card-pro", entity: "light.kitchen" });
  await expect(input).toHaveValue("Kitchen");
  // cleared
  await entity.getByRole("button", { name: "Clear" }).click();
  await expect.poll(e.last).toEqual({ type: "custom:tile-card-pro" });
});

test("the poster's kind decides its sections, and an input lists what it takes", async ({
  page,
}) => {
  const e = await openEditor(page, { type: "custom:poster-card-pro", entity: "sensor.grid_power" });
  await expect(e.form.locator("summary", { hasText: "Content" })).toBeVisible();
  await expect(e.form.locator("summary", { hasText: "Other entities" })).toHaveCount(0);
  await choose(e.form, "kind", "grid");
  await expect.poll(e.last).toEqual({
    type: "custom:poster-card-pro",
    entity: "sensor.grid_power",
    kind: "grid",
  });
  // the grid reads its import and export: a section of their own
  await openSection(e.form, "Other entities");
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
  // back to the detected kind: its section and the inputs only the grid read go
  await choose(e.form, "kind", "detected");
  await expect.poll(e.last).toEqual({
    type: "custom:poster-card-pro",
    entity: "sensor.grid_power",
  });
  await expect(e.form.locator("summary", { hasText: "Other entities" })).toHaveCount(0);
});

test("the poster's badges are added and edited in their dialog", async ({ page }) => {
  const e = await openEditor(page, { type: "custom:poster-card-pro", entity: "sensor.wind_speed" });
  await openSection(e.form, "Status and badges");
  const item = await addItem(e.form, "badges");
  await pickEntity(item, "entity", "gust", "Wind gust");
  await saveItem(e.form, "badges");
  await expect.poll(e.last).toMatchObject({ badges: ["sensor.wind_gust"] });
  // the row names the entity; its dialog edits it
  const badges = field(e.form, "badges");
  await expect(badges.locator(".item .main")).toHaveText(["Wind gust"]);
  await badges.getByRole("button", { name: "Edit" }).click();
  await fill(badges.locator(".edit ha-form"), "name", "Gusts");
  await saveItem(e.form, "badges");
  await expect.poll(e.last).toMatchObject({
    badges: [{ entity: "sensor.wind_gust", name: "Gusts" }],
  });
  // a dialog cancelled changes nothing
  const n = await e.count();
  await badges.getByRole("button", { name: "Edit" }).click();
  await fill(badges.locator(".edit ha-form"), "name", "Other");
  await badges.locator(".edit").getByRole("button", { name: "Cancel" }).click();
  expect(await e.count()).toBe(n);
  // deleted
  await badges.getByRole("button", { name: "Delete" }).click();
  await expect
    .poll(e.last)
    .toEqual({ type: "custom:poster-card-pro", entity: "sensor.wind_speed" });
});

test("a badge's icon place, visual, kind and switch are set in its dialog", async ({ page }) => {
  const e = await openEditor(page, {
    type: "custom:poster-card-pro",
    entity: "sensor.wind_speed",
    badges: ["sensor.battery_soc"],
  });
  await openSection(e.form, "Status and badges");
  const badges = field(e.form, "badges");
  await badges.getByRole("button", { name: "Edit" }).click();
  const dialog = badges.locator(".edit ha-form");
  await choose(dialog, "icon_type", "dot");
  await choose(dialog, "visual", "trend");
  await fill(dialog, "hours", "6");
  await choose(dialog, "kind", "none");
  await toggle(dialog, "control");
  await saveItem(e.form, "badges");
  await expect.poll(e.last).toMatchObject({
    badges: [
      {
        entity: "sensor.battery_soc",
        kind: "none",
        icon: { type: "dot" },
        visual: { type: "trend", hours: 6 },
        control: "toggle",
      },
    ],
  });
});

test("the poster's rules are added, ordered and deleted", async ({ page }) => {
  // (a temperature: its kind brings no rules of its own)
  const e = await openEditor(page, {
    type: "custom:poster-card-pro",
    entity: "sensor.living_room_temperature",
  });
  await openSection(e.form, "Rules");
  const first = await addItem(e.form, "rules");
  await fill(first, "above", "30");
  await choose(first, "color", "red");
  await fill(first, "status", "Stormy");
  await saveItem(e.form, "rules");
  await expect.poll(e.last).toMatchObject({
    rules: [{ above: 30, color: "red", status: "Stormy" }],
  });
  const second = await addItem(e.form, "rules");
  await fill(second, "above", "10");
  await fill(second, "status", "Windy");
  await saveItem(e.form, "rules");
  const rules = field(e.form, "rules");
  await expect(rules.locator(".item .main")).toHaveText(["Stormy", "Windy"]);
  // rules match in the order written: moved up, the second comes first
  await rules.locator(".item").nth(1).getByRole("button", { name: "Move up" }).click();
  await expect.poll(e.last).toMatchObject({
    rules: [
      { above: 10, status: "Windy" },
      { above: 30, color: "red", status: "Stormy" },
    ],
  });
  await rules.locator(".item").nth(0).getByRole("button", { name: "Delete" }).click();
  await expect.poll(e.last).toMatchObject({ rules: [{ above: 30, status: "Stormy" }] });
});

test("the kind's rules are shown, copied when one changes, and come back", async ({ page }) => {
  const wind = { type: "custom:poster-card-pro", entity: "sensor.wind_speed" };
  const e = await openEditor(page, wind);
  await openSection(e.form, "Rules");
  const rules = field(e.form, "rules");
  await expect(rules.locator(".item .main")).toHaveText([
    "Calm",
    "Breezy",
    "Windy",
    "Strong wind",
    "Stormy",
  ]);
  await expect(field(e.form, "rules_from").locator("select")).toHaveValue("default");
  // Breezy green: all five become the card's, with the change
  await rules.locator(".item").nth(1).getByRole("button", { name: "Edit" }).click();
  const breezy = rules.locator(".edit ha-form");
  await choose(breezy, "color", "green");
  await saveItem(e.form, "rules");
  await expect.poll(e.last).toMatchObject({
    rules: [
      { below: 5, status: "Calm" },
      { below: 20, color: "green", status: "Breezy" },
      { below: 35, status: "Windy" },
      { below: 50, status: "Strong wind" },
      { above: 50, status: "Stormy", tint_card: true },
    ],
  });
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
