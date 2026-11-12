// The layout's and the swipe card's editors as elements, over the docs' stand-ins for Home
// Assistant's form, card editor and card picker: the options form, the tabs, the tools, the
// selected card's own editor or the picker, the layout's place form
import { describe, it, expect, beforeAll, afterEach } from "vitest";
import type { CardConfigBase } from "../../../src/shared/ha.ts";

type Editor = HTMLElement & {
  setConfig(c: CardConfigBase): void;
  hass: unknown;
  lovelace: unknown;
};
type ChildEditor = HTMLElement & { value?: CardConfigBase; lovelace?: unknown };

let snapshot: () => Record<string, unknown>;
beforeAll(async () => {
  await import("../../../src/layout-card.ts");
  await import("../../../src/swipe-card.ts");
  await import("../../../src/tile-card.ts");
  await import("../../../src/poster-card.ts");
  const { defineElements } = await import("../../../docs/.vitepress/theme/ha-shim/elements.ts");
  snapshot = (await import("../../../docs/.vitepress/theme/ha-shim/hass.ts"))
    .snapshot as unknown as () => Record<string, unknown>;
  defineElements();
});

const tick = async (n = 3) => {
  for (let i = 0; i < n; i++) await new Promise((r) => setTimeout(r, 0));
};
const LAYOUT = "custom:layout-card-pro";
const SWIPE = "custom:swipe-card-pro";
const tile = { type: "custom:tile-card-pro", entity: "light.kitchen" };
const poster = { type: "custom:poster-card-pro", entity: "sensor.wind_speed" };
const entities = { type: "entities", entities: ["light.kitchen"] };

let open: Editor[] = [];
afterEach(() => {
  for (const ed of open) ed.remove();
  open = [];
});

// an editor of a container card, configured and on the page, and what it sends
const editor = async (type: string, config: Record<string, unknown>, hass = snapshot()) => {
  const ed = document.createElement(`${type.slice(7)}-editor`) as Editor;
  ed.setConfig({ type, ...config } as CardConfigBase);
  ed.hass = hass;
  document.body.appendChild(ed);
  open.push(ed);
  await tick();
  const sent: CardConfigBase[] = [];
  ed.addEventListener("config-changed", (e) => sent.push((e as CustomEvent).detail.config));
  const root = ed.shadowRoot!;
  const button = (title: string) =>
    root.querySelector<HTMLButtonElement>(`button[title="${title}"]`)!;
  return {
    ed,
    root,
    sent,
    last: () => sent.at(-1)!,
    cards: () => sent.at(-1)!.cards as CardConfigBase[],
    tabs: () => [...root.querySelectorAll(".tab")].map((t) => t.textContent),
    selected: () =>
      [...root.querySelectorAll(".tab, .icon.add")].findIndex(
        (t) => t.getAttribute("aria-selected") === "true",
      ),
    button,
    press: async (title: string) => {
      button(title).click();
      await tick();
    },
    child: () => root.querySelector<ChildEditor>(".child > *")!,
    tab: async (i: number) => {
      root.querySelectorAll<HTMLButtonElement>(".tab, .icon.add")[i].click();
      await tick();
    },
  };
};

describe("the container editors' tabs", () => {
  it("name each card and select one", async () => {
    const e = await editor(LAYOUT, { cards: [tile, poster, entities] });
    expect(e.tabs()).toEqual(["1Tile Pro", "2Poster Pro", "3Entities"]);
    expect(e.selected()).toBe(0);
    expect(e.child().localName).toBe("hui-card-element-editor");
    expect(e.child().value).toEqual(tile);
    await e.tab(1);
    expect(e.selected()).toBe(1);
    expect(e.child().value).toEqual(poster);
    // selecting changes nothing in the config
    expect(e.sent).toEqual([]);
  });

  it("open the card's own editor inside Home Assistant's card editor", async () => {
    const e = await editor(LAYOUT, { cards: [tile] });
    const inner = e.child().shadowRoot!.querySelector("tile-card-pro-editor");
    expect(inner).not.toBeNull();
  });

  it("show the picker for an empty card, and no tools", async () => {
    const e = await editor(LAYOUT, { cards: [] });
    expect(e.tabs()).toEqual([]);
    expect(e.child().localName).toBe("hui-card-picker");
    expect(e.root.querySelector<HTMLElement>(".tools")!.hidden).toBe(true);
    expect(e.root.querySelector<HTMLElement>(".place")!.hidden).toBe(true);
    // a config without cards is one with none
    const none = await editor(SWIPE, {});
    expect(none.child().localName).toBe("hui-card-picker");
  });
});

describe("the container editors' tools", () => {
  it("cannot move the first card left nor the last right", async () => {
    const e = await editor(LAYOUT, { cards: [tile, poster] });
    expect(e.button("Move left").disabled).toBe(true);
    expect(e.button("Move right").disabled).toBe(false);
    await e.tab(1);
    expect(e.button("Move left").disabled).toBe(false);
    expect(e.button("Move right").disabled).toBe(true);
  });

  it("move a card and keep it selected", async () => {
    const e = await editor(LAYOUT, { cards: [tile, poster, entities] });
    await e.tab(2);
    await e.press("Move left");
    expect(e.cards()).toEqual([tile, entities, poster]);
    expect(e.selected()).toBe(1);
    expect(e.child().value).toEqual(entities);
    await e.press("Move left");
    expect(e.cards()).toEqual([entities, tile, poster]);
    expect(e.selected()).toBe(0);
    expect(e.button("Move left").disabled).toBe(true);
  });

  it("duplicate a card after itself and select the copy", async () => {
    const e = await editor(LAYOUT, { cards: [tile, poster] });
    await e.press("Duplicate");
    expect(e.cards()).toEqual([tile, tile, poster]);
    expect(e.selected()).toBe(1);
    // a copy, not the same object
    expect(e.cards()[1]).not.toBe(e.cards()[0]);
  });

  it("delete a card and select the one before it", async () => {
    const e = await editor(LAYOUT, { cards: [tile, poster, entities] });
    await e.tab(2);
    await e.press("Delete");
    expect(e.cards()).toEqual([tile, poster]);
    expect(e.selected()).toBe(1);
    // the first: the next one moves up into its place
    await e.tab(0);
    await e.press("Delete");
    expect(e.cards()).toEqual([poster]);
    expect(e.selected()).toBe(0);
    expect(e.child().value).toEqual(poster);
    // the last one: the picker
    await e.press("Delete");
    expect(e.cards()).toEqual([]);
    expect(e.child().localName).toBe("hui-card-picker");
  });

  it("add a card from the picker and select it", async () => {
    const e = await editor(SWIPE, { cards: [tile] });
    await e.press("Add a card");
    expect(e.selected()).toBe(1);
    const picker = e.child();
    expect(picker.localName).toBe("hui-card-picker");
    // the stand-in lists the Pro cards; a tile comes with its stub config
    const pick = [...picker.shadowRoot!.querySelectorAll("button")].find(
      (b) => b.querySelector(".name")?.textContent === "Tile Card Pro",
    )!;
    pick.click();
    await tick();
    expect(e.cards()).toHaveLength(2);
    expect(e.cards()[1].type).toBe("custom:tile-card-pro");
    expect(e.tabs()).toEqual(["1Tile Pro", "2Tile Pro"]);
    expect(e.selected()).toBe(1);
    expect(e.child().localName).toBe("hui-card-element-editor");
  });

  it("ignore a picker event without a card", async () => {
    const e = await editor(LAYOUT, { cards: [] });
    e.child().dispatchEvent(new CustomEvent("config-changed", { detail: {} }));
    await tick();
    expect(e.sent).toEqual([]);
  });
});

describe("the selected card's editor", () => {
  it("writes the card it edits, and nothing for the card it was given", async () => {
    const e = await editor(LAYOUT, { cards: [tile, poster] });
    const child = e.child();
    child.dispatchEvent(new CustomEvent("config-changed", { detail: { config: { ...tile } } }));
    await tick();
    expect(e.sent).toEqual([]);
    const named = { ...tile, name: "Worktop" };
    child.dispatchEvent(new CustomEvent("config-changed", { detail: { config: named } }));
    await tick();
    expect(e.cards()).toEqual([named, poster]);
    // the same editor stays, so its own state does
    expect(e.child()).toBe(child);
    expect(child.value).toBe(named);
  });

  it("does not let the card's event reach the dashboard's editor", async () => {
    const e = await editor(LAYOUT, { cards: [tile] });
    const outer: unknown[] = [];
    const listen = (ev: Event) => outer.push((ev as CustomEvent).detail.config);
    document.body.addEventListener("config-changed", listen);
    e.child().dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: { ...tile, name: "A" } },
        bubbles: true,
        composed: true,
      }),
    );
    await tick();
    document.body.removeEventListener("config-changed", listen);
    // only the layout's own config, with the card in it
    expect(outer).toEqual([{ type: LAYOUT, cards: [{ ...tile, name: "A" }] }]);
  });

  it("switches between the card's visual editor and its code", async () => {
    const e = await editor(LAYOUT, { cards: [tile, entities] });
    expect(e.button("Show code editor").disabled).toBe(false);
    await e.press("Show code editor");
    expect(e.button("Show visual editor")).not.toBeNull();
    const textarea = e.child().shadowRoot!.querySelector("textarea")!;
    expect(textarea.value).toContain("entity: light.kitchen");
    // the code edits the card
    textarea.value = "type: custom:tile-card-pro\nentity: light.living_room\n";
    textarea.dispatchEvent(new Event("change"));
    await tick();
    expect(e.cards()[0]).toEqual({ type: "custom:tile-card-pro", entity: "light.living_room" });
    await e.press("Show visual editor");
    expect(e.button("Show code editor")).not.toBeNull();
    expect(e.child().shadowRoot!.querySelector("tile-card-pro-editor")).not.toBeNull();
    // a card without a visual editor: code only, the switch off
    await e.tab(1);
    const mode = e.root.querySelector<HTMLButtonElement>(".tools .icon")!;
    expect(mode.disabled).toBe(true);
    expect(e.child().shadowRoot!.querySelector("textarea")!.value).toContain("type: entities");
  });

  it("opens another card's editor in visual mode", async () => {
    const e = await editor(LAYOUT, { cards: [tile, poster] });
    await e.press("Show code editor");
    await e.tab(1);
    expect(e.button("Show code editor")).not.toBeNull();
  });

  it("hands the dashboard's lovelace to the card's editor", async () => {
    const e = await editor(LAYOUT, { cards: [tile] });
    const lovelace = { config: { views: [] } };
    e.ed.lovelace = lovelace;
    expect(e.child().lovelace).toBe(lovelace);
    await e.press("Add a card");
    expect(e.child().lovelace).toBe(lovelace);
  });
});

describe("the container editors' options", () => {
  it("write the layout's options and keep its cards", async () => {
    const e = await editor(LAYOUT, { columns: 2, cards: [tile] });
    const form = e.root.querySelector<HTMLElement & { data: Record<string, unknown> }>(
      ".options ha-form",
    )!;
    expect(form.data).toMatchObject({ columns: "2", layout: "grid" });
    form.dispatchEvent(
      new CustomEvent("value-changed", {
        detail: { value: { ...form.data, columns: "1fr 2fr", gap: "8 16" } },
      }),
    );
    await tick();
    expect(e.last()).toEqual({
      type: LAYOUT,
      columns: ["1fr", "2fr"],
      gap: [8, 16],
      cards: [tile],
    });
  });

  it("write the swipe card's options and keep its cards", async () => {
    const e = await editor(SWIPE, { cards: [tile, poster] });
    const form = e.root.querySelector<HTMLElement & { data: Record<string, unknown> }>(
      ".options ha-form",
    )!;
    form.dispatchEvent(
      new CustomEvent("value-changed", {
        detail: { value: { ...form.data, per_page: 1.15, unfold: 0 } },
      }),
    );
    await tick();
    expect(e.last()).toEqual({ type: SWIPE, per_page: 1.15, unfold: false, cards: [tile, poster] });
  });

  it("take the layout's options from the form a user fills in", async () => {
    const e = await editor(LAYOUT, { cards: [tile] });
    const form = e.root.querySelector("ha-form")!;
    await tick();
    const select = form.shadowRoot!.querySelector<HTMLSelectElement>(
      '[data-name="layout"] select',
    )!;
    select.value = "masonry";
    select.dispatchEvent(new Event("change"));
    await tick();
    expect(e.last()).toEqual({ type: LAYOUT, layout: "masonry", cards: [tile] });
    // a masonry has no rows
    expect(form.shadowRoot!.querySelector('[data-name="rows"]')).toBeNull();
    const cols = form.shadowRoot!.querySelector<HTMLInputElement>('[data-name="columns"] input')!;
    cols.value = "3";
    cols.dispatchEvent(new Event("change"));
    await tick();
    expect(e.last()).toEqual({ type: LAYOUT, layout: "masonry", columns: 3, cards: [tile] });
  });
});

describe("the layout editor's place for the selected card", () => {
  it("shows the selected card's place and writes it into that card", async () => {
    const placed = { ...poster, view_layout: { span: 2 } };
    const e = await editor(LAYOUT, { cards: [tile, placed] });
    const place = e.root.querySelector<HTMLElement>(".place")!;
    expect(place.hidden).toBe(false);
    expect(place.querySelector("h3")!.textContent).toBe("Place in the layout");
    const form = place.querySelector<HTMLElement & { data: Record<string, unknown> }>("ha-form")!;
    expect(form.data).toMatchObject({ span_full: false });
    expect(form.data.span_cols).toBeUndefined();
    await e.tab(1);
    expect(form.data).toMatchObject({ span_cols: 2 });
    form.dispatchEvent(
      new CustomEvent("value-changed", { detail: { value: { ...form.data, span_rows: 3 } } }),
    );
    await tick();
    expect(e.cards()).toEqual([tile, { ...poster, view_layout: { span: [2, 3] } }]);
    expect(e.selected()).toBe(1);
  });

  it("has no place on the swipe card", async () => {
    const e = await editor(SWIPE, { cards: [tile] });
    expect(e.root.querySelector<HTMLElement>(".place")!.hidden).toBe(true);
  });
});

describe("the container editors from outside", () => {
  it("keep the selected card through a new config", async () => {
    const e = await editor(LAYOUT, { cards: [tile, poster, entities] });
    await e.tab(1);
    const child = e.child();
    const named = { ...poster, name: "Wind" };
    e.ed.setConfig({ type: LAYOUT, cards: [tile, named, entities] } as CardConfigBase);
    await tick();
    expect(e.selected()).toBe(1);
    // the same editor, given the new card
    expect(e.child()).toBe(child);
    expect(child.value).toEqual(named);
  });

  it("select the last card when the selected one goes", async () => {
    const e = await editor(LAYOUT, { cards: [tile, poster, entities] });
    await e.tab(2);
    e.ed.setConfig({ type: LAYOUT, cards: [tile] } as CardConfigBase);
    await tick();
    expect(e.tabs()).toEqual(["1Tile Pro"]);
    expect(e.selected()).toBe(0);
  });

  it("move between the tabs by the arrow keys, only the selected one in the tab order", async () => {
    const e = await editor(LAYOUT, { cards: [tile, poster] });
    const bar = e.root.querySelector(".bar")!;
    const key = async (k: string) => {
      bar.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
      await tick();
    };
    const order = () =>
      [...e.root.querySelectorAll<HTMLElement>(".tab, .icon.add")].map((t) => t.tabIndex);
    expect(order()).toEqual([0, -1, -1]);
    await key("ArrowRight");
    expect(e.selected()).toBe(1);
    expect(order()).toEqual([-1, 0, -1]);
    await key("End");
    expect(e.selected()).toBe(2);
    expect(e.root.activeElement).toBe(e.root.querySelector(".icon.add"));
    await key("ArrowRight");
    expect(e.selected()).toBe(2);
    await key("Home");
    expect(e.selected()).toBe(0);
  });

  it("keep their tabs and tools through a new hass, and pass it on", async () => {
    const e = await editor(LAYOUT, { cards: [tile, poster] });
    const tab = e.root.querySelector(".tab");
    const tool = e.button("Delete");
    const hass = snapshot();
    e.ed.hass = hass;
    await tick();
    expect(e.root.querySelector(".tab")).toBe(tab);
    expect(e.button("Delete")).toBe(tool);
    expect((e.child() as unknown as { hass: unknown }).hass).toBe(hass);
    expect(
      (e.root.querySelector(".options ha-form, ha-form") as unknown as { hass: unknown }).hass,
    ).toBe(hass);
  });

  it("wait for hass before drawing", async () => {
    const ed = document.createElement("layout-card-pro-editor") as Editor;
    ed.setConfig({ type: LAYOUT, cards: [tile] } as CardConfigBase);
    document.body.appendChild(ed);
    open.push(ed);
    await tick();
    expect(ed.shadowRoot).toBeNull();
    ed.hass = snapshot();
    await tick();
    expect(ed.shadowRoot!.querySelectorAll(".tab")).toHaveLength(1);
  });

  it("speak the viewer's language", async () => {
    const en = snapshot();
    const de = { ...en, language: "de", locale: { ...(en.locale as object), language: "de" } };
    const e = await editor(LAYOUT, { cards: [tile] }, de);
    expect(e.button("Karte hinzufügen")).not.toBeNull();
    expect(e.root.querySelector(".place h3")!.textContent).toBe("Platzierung im Layout");
  });
});

describe("the tile group's editor", () => {
  const GROUP = "custom:tile-group-card-pro";
  it("edits its tiles in the tile's editor, written without their type", async () => {
    await import("../../../src/tile-group-card.ts");
    const e = await editor(GROUP, {
      title: "Lights",
      tiles: ["light.kitchen", { entity: "light.living_room", name: "Sofa" }],
    });
    // the tabs by name: the tile's own, else its entity's
    expect(e.tabs()).toEqual(["1Kitchen", "2Sofa"]);
    expect((e.child() as unknown as { value: { type: string } }).value).toEqual({
      type: "custom:tile-card-pro",
      entity: "light.kitchen",
    });
    // a tile changed: written back as the group writes tiles
    e.child().dispatchEvent(
      new CustomEvent("config-changed", {
        detail: {
          config: { type: "custom:tile-card-pro", entity: "light.kitchen", name: "Worktop" },
        },
      }),
    );
    await tick();
    expect(e.last()).toEqual({
      type: GROUP,
      title: "Lights",
      tiles: [
        { entity: "light.kitchen", name: "Worktop" },
        { entity: "light.living_room", name: "Sofa" },
      ],
    });
    // "+" adds a tile and opens it, no picker of every card
    await e.press("Add a card");
    expect((e.last().tiles as unknown[]).length).toBe(3);
    expect(e.root.querySelector(".child hui-card-picker")).toBeNull();
    expect(e.selected()).toBe(2);
  });

  it("keeps an untouched tile as it was written", async () => {
    const e = await editor(GROUP, { tiles: [{ entity: "light.kitchen" }, "light.living_room"] });
    await e.press("Move right");
    expect(e.last().tiles).toEqual(["light.living_room", { entity: "light.kitchen" }]);
  });

  it("writes its title and layout, the defaults as nothing", async () => {
    const e = await editor(GROUP, { tiles: ["light.kitchen"] });
    const form = e.root.querySelector<HTMLElement>(".options ha-form")!;
    form.dispatchEvent(
      new CustomEvent("value-changed", { detail: { value: { layout: "row", title: "Lights" } } }),
    );
    await tick();
    expect(e.last()).toEqual({
      type: GROUP,
      layout: "row",
      title: "Lights",
      tiles: ["light.kitchen"],
    });
    form.dispatchEvent(new CustomEvent("value-changed", { detail: { value: { layout: "list" } } }));
    await tick();
    expect(e.last()).toEqual({ type: GROUP, tiles: ["light.kitchen"] });
  });

  it("edits a table's tiles as rows, and no tile's vertical: the group's layout decides", async () => {
    // the tile's own editor, as the card element editor shows it, and its form's fields
    const tileEditor = (e: Awaited<ReturnType<typeof editor>>) =>
      e.child().shadowRoot!.querySelector("tile-card-pro-editor") as unknown as {
        _thing: string;
        _ctx: { grouped?: boolean };
      };
    const e = await editor(GROUP, { layout: "table", tiles: ["light.kitchen"] });
    await tick();
    expect(tileEditor(e)._thing).toBe("row");
    // another layout: the tile's editor built anew, a tile again, still in a group
    const form = e.root.querySelector<HTMLElement>(".options ha-form")!;
    form.dispatchEvent(new CustomEvent("value-changed", { detail: { value: { layout: "row" } } }));
    e.ed.setConfig(e.last());
    await tick();
    await tick();
    expect(tileEditor(e)._thing).toBe("tile");
    expect(tileEditor(e)._ctx.grouped).toBe(true);
  });
});

describe("the container editors' items in views of their own", () => {
  // an item of the options opened (as its list's row sends it), and its view's form edited
  const openItem = (root: ShadowRoot, key: string, index: number) =>
    root.querySelector(".options ha-form")!.dispatchEvent(
      new CustomEvent("pro-cards-edit-item", {
        detail: { key, index },
        bubbles: true,
        composed: true,
      }),
    );
  type Form = HTMLElement & { data: Record<string, unknown>; schema: { name: string }[] };
  const viewForm = (root: ShadowRoot) => root.querySelector(".item-view ha-form") as Form;
  const edit = (root: ShadowRoot, fields: Record<string, unknown>) =>
    viewForm(root).dispatchEvent(
      new CustomEvent("value-changed", {
        detail: { value: { ...viewForm(root).data, ...fields } },
      }),
    );

  it("open on top of the options and the cards, written through the options", async () => {
    const e = await editor("custom:tile-group-card-pro", {
      title: "Lights",
      tiles: ["light.kitchen"],
    });
    openItem(e.root, "badges", 0);
    await tick();
    expect((e.root.querySelector(".options") as HTMLElement).style.display).toBe("none");
    expect((e.root.querySelector(".cards") as HTMLElement).style.display).toBe("none");
    edit(e.root, { entity: "sensor.battery_soc" });
    expect(e.last()).toEqual({
      type: "custom:tile-group-card-pro",
      title: "Lights",
      badges: ["sensor.battery_soc"],
      tiles: ["light.kitchen"],
    });
    // back: the options and the cards again
    (e.root.querySelector(".item-view button.back") as HTMLButtonElement).click();
    await tick();
    expect((e.root.querySelector(".options") as HTMLElement).style.display).toBe("");
    expect(e.tabs()).toHaveLength(1);
  });

  it("edit a breakpoint from where it starts", async () => {
    const e = await editor(LAYOUT, { cards: [tile], breakpoints: { 3: { columns: 2 } } });
    openItem(e.root, "breakpoints", 0);
    await tick();
    expect(e.root.querySelector(".item-view .title")?.textContent).toBe("From 3 view columns");
    edit(e.root, { gap: "8px" });
    expect(e.last()).toMatchObject({ breakpoints: { 3: { columns: 2, gap: "8px" } } });
  });

  it("edit a weather rule with its status, and a flow's source and consumer", async () => {
    await import("../../../src/weather-card.ts");
    await import("../../../src/power-flow-card.ts");
    // (their editors are forms of their own: the view on top of the form)
    type Ed = HTMLElement & { setConfig(c: unknown): void; hass: unknown };
    const formEditor = async (type: string, config: Record<string, unknown>) => {
      const ed = document.createElement(`${type}-editor`) as Ed;
      ed.setConfig({ type: `custom:${type}`, ...config });
      ed.hass = snapshot();
      document.body.appendChild(ed);
      open.push(ed as unknown as Editor);
      await tick();
      const sent: Record<string, unknown>[] = [];
      ed.addEventListener("config-changed", (e) => sent.push((e as CustomEvent).detail.config));
      const openIt = async (key: string, index: number) => {
        ed.querySelector("ha-form")!.dispatchEvent(
          new CustomEvent("pro-cards-edit-item", {
            detail: { key, index },
            bubbles: true,
            composed: true,
          }),
        );
        await tick();
      };
      const view = () => ed.querySelector(".item-view ha-form") as Form;
      const change = (fields: Record<string, unknown>) =>
        view().dispatchEvent(
          new CustomEvent("value-changed", { detail: { value: { ...view().data, ...fields } } }),
        );
      return { sent, openIt, view, change };
    };
    const w = await formEditor("weather-card-pro", { entity: "weather.home" });
    await w.openIt("temperature_rules", 0);
    // the temperature's rules read a number in its unit: above and below, a status
    type Node = { name: string; schema?: Node[] };
    const names = (xs: Node[]): string[] => xs.flatMap((x) => [x.name, ...names(x.schema ?? [])]);
    expect(names(w.view().schema as Node[])).toEqual(
      expect.arrayContaining(["above", "below", "status"]),
    );
    w.change({ below: 5, status: "Cold" });
    expect(w.sent.at(-1)).toMatchObject({ temperature_rules: [{ below: 5, status: "Cold" }] });
    // (a key its form does not show: kept through an edit in its view)
    const f = await formEditor("power-flow-card-pro", {
      sources: [{ type: "solar", entity: "sensor.solar_power", decimals: 1 }],
    });
    await f.openIt("consumers", 0);
    f.change({ entity: "sensor.washer_power", group: "Laundry" });
    expect(f.sent.at(-1)).toMatchObject({
      consumers: [{ entity: "sensor.washer_power", group: "Laundry" }],
    });
    // a source in its view: written back as a source, what its form does not show kept
    (
      document.querySelector("power-flow-card-pro-editor .item-view button.back") as HTMLElement
    ).click();
    await tick();
    await f.openIt("sources", 0);
    f.change({ name: "Roof" });
    expect(f.sent.at(-1)).toMatchObject({
      sources: [{ type: "solar", entity: "sensor.solar_power", decimals: 1, name: "Roof" }],
    });
  });
});
