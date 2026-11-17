// UIX and card-mod style a card that no hui-card holds (a tile in a tile group) by its `ha-card`:
// they read their key from the card element's `config`, then its `_config`. A card keeps the
// config as written there, so a tile in a group is styled as a tile on its own.
import { afterEach, describe, expect, it } from "vitest";
import "../../src/tile-card.ts";
import { TileGroupCard } from "../../src/tile-group-card.ts";
import { MultiTrendCard } from "../../src/multi-trend-card.ts";
import { snapshot } from "../../docs/.vitepress/theme/ha-shim/hass.ts";

// UIX's lookup from a card's ha-card up to the element that holds its config
const findConfig = (node: Node | null): Record<string, unknown> | null => {
  for (let n = node; n;) {
    const c = n as unknown as { config?: unknown; _config?: unknown; host?: Node };
    if (c.config) return c.config as Record<string, unknown>;
    if (c._config) return c._config as Record<string, unknown>;
    n = c.host ?? n.parentNode;
  }
  return null;
};

const cards: HTMLElement[] = [];
afterEach(() => {
  for (const c of cards.splice(0)) c.remove();
});

describe("the config as written", () => {
  it("is where UIX and card-mod find it on a tile in a tile group", () => {
    const style = { style: "ha-card { --ha-card-border-width: 0; }" };
    const el = new TileGroupCard();
    el.setConfig({
      type: "custom:tile-group-card-pro",
      tiles: [
        { entity: "light.kitchen", uix: style },
        { entity: "light.hallway", card_mod: style },
      ],
    });
    document.body.appendChild(el);
    el.hass = snapshot() as never;
    cards.push(el);
    const found = [...el.shadowRoot!.querySelectorAll("tile-card-pro")].map((t) =>
      findConfig(t.shadowRoot!.querySelector("ha-card")),
    );
    expect(found[0]).toMatchObject({ type: "custom:tile-card-pro", uix: style });
    expect(found[1]).toMatchObject({ type: "custom:tile-card-pro", card_mod: style });
  });

  it("is kept by the multi trend card beside its normalized one", () => {
    const config = {
      type: "custom:multi-trend-card-pro",
      entities: ["sensor.outdoor_temperature"],
      uix: { style: "" },
    };
    const el = new MultiTrendCard();
    el.setConfig(config);
    expect(el.config).toBe(config);
  });
});
