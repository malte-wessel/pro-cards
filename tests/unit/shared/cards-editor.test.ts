import { describe, it, expect } from "vitest";
import { optionsFromForm, optionsToForm } from "../../../src/shared/cards/editor-options.ts";
import { LAYOUT_CONVS, placeFromForm, placeToForm } from "../../../src/layout/editor.ts";
import { SWIPE_CONVS } from "../../../src/swipe/editor.ts";
import type { CardConfigBase } from "../../../src/shared/ha.ts";
import { docExamples, withNested } from "../docs-examples.ts";

const CONVS = {
  "custom:layout-card-pro": LAYOUT_CONVS,
  "custom:swipe-card-pro": SWIPE_CONVS,
} as const;

describe("the layout's and the swipe card's editors", () => {
  it("write every docs example's options and places back as they were", () => {
    let n = 0;
    for (const { file, cfg } of docExamples())
      for (const c of withNested(cfg)) {
        const card = c as CardConfigBase;
        const convs = CONVS[String(card?.type) as keyof typeof CONVS];
        if (!convs) continue;
        expect(optionsFromForm(optionsToForm(card, convs), card, convs), file).toEqual(card);
        if (card.type === "custom:layout-card-pro")
          for (const child of (card.cards as CardConfigBase[]) ?? [])
            expect(placeFromForm(placeToForm(child), child), file).toEqual(child);
        n++;
      }
    expect(n).toBeGreaterThan(20);
  });

  it("writes tracks, lengths and breakpoints in their short spelling", () => {
    const base = { type: "custom:layout-card-pro" } as CardConfigBase;
    const data = {
      ...optionsToForm(base, LAYOUT_CONVS),
      columns: "1fr 2fr",
      gap: "8 16",
      breakpoints: [{ at: 2, columns: "3" }],
    };
    expect(optionsFromForm(data, base, LAYOUT_CONVS)).toEqual({
      type: "custom:layout-card-pro",
      columns: ["1fr", "2fr"],
      gap: [8, 16],
      breakpoints: { 2: { columns: 3 } },
    });
    // a place: columns and rows, full width
    const tile = { type: "custom:tile-card-pro", entity: "light.kitchen" } as CardConfigBase;
    expect(placeFromForm({ span_cols: 2, span_rows: 2 }, tile).view_layout).toEqual({
      span: [2, 2],
    });
    expect(placeFromForm({ span_full: true }, tile).view_layout).toEqual({ span: "full" });
    expect(placeFromForm({}, { ...tile, view_layout: { span: 2 } })).toEqual(tile);
  });
});

describe("the container cards' editor", () => {
  it("edits its cards: tabs, duplicate, move, delete, add, a card's place", async () => {
    await import("../../../src/layout-card.ts");
    await import("../../../src/tile-card.ts");
    await import("../../../src/poster-card.ts");
    const { defineElements } = await import("../../../docs/.vitepress/theme/ha-shim/elements.ts");
    const { snapshot } = await import("../../../docs/.vitepress/theme/ha-shim/hass.ts");
    defineElements();
    const tick = () => new Promise((r) => setTimeout(r, 0));
    const ed = document.createElement("layout-card-pro-editor") as HTMLElement & {
      setConfig(c: CardConfigBase): void;
      hass: unknown;
    };
    const tile = { type: "custom:tile-card-pro", entity: "light.kitchen" };
    const poster = { type: "custom:poster-card-pro", entity: "sensor.wind_speed" };
    ed.setConfig({ type: "custom:layout-card-pro", cards: [tile, poster] } as CardConfigBase);
    ed.hass = snapshot();
    document.body.appendChild(ed);
    await tick();
    const sent: CardConfigBase[] = [];
    ed.addEventListener("config-changed", (e) => sent.push((e as CustomEvent).detail.config));
    const root = ed.shadowRoot!;
    const tabs = () => [...root.querySelectorAll(".tab")].map((t) => t.textContent);
    const press = async (label: string) => {
      root.querySelector<HTMLButtonElement>(`button[title="${label}"]`)!.click();
      await tick();
    };
    const cards = () => sent.at(-1)!.cards as CardConfigBase[];
    expect(tabs()).toEqual(["1Tile Pro", "2Poster Pro"]);
    // the selected card's own editor
    expect(root.querySelector(".child hui-card-element-editor")).not.toBeNull();

    await press("Duplicate");
    expect(cards()).toEqual([tile, tile, poster]);
    await press("Move right");
    expect(cards().map((c) => c.type)).toEqual([tile.type, poster.type, tile.type]);
    await press("Delete");
    expect(cards()).toEqual([tile, poster]);

    // the picker behind "+" adds a card and selects it
    await press("Add a card");
    const picker = root.querySelector(".child hui-card-picker")!;
    expect(picker).not.toBeNull();
    picker.dispatchEvent(
      new CustomEvent("config-changed", { detail: { config: { type: "custom:tile-card-pro" } } }),
    );
    await tick();
    expect(cards()).toHaveLength(3);
    expect(tabs()).toHaveLength(3);

    // the selected card's place in the layout
    const place = root.querySelector<HTMLElement>(".place ha-form")!;
    place.dispatchEvent(new CustomEvent("value-changed", { detail: { value: { span_cols: 2 } } }));
    await tick();
    expect(cards()[2].view_layout).toEqual({ span: 2 });
    ed.remove();
  });
});
