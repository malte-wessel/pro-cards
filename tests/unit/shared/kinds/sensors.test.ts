import { afterEach, describe, it, expect } from "vitest";
import { extentOf } from "../../../../src/shared/kinds/sensors.ts";
import { PosterCard } from "../../../../src/poster-card.ts";
import { TileCard } from "../../../../src/tile-card.ts";
import { snapshot } from "../../../../docs/.vitepress/theme/ha-shim/hass.ts";

describe("today's low and high", () => {
  it("are the lowest and the highest value, the one now among them", () => {
    expect(extentOf([{ v: 18 }, { v: null }, { v: 23.5 }, { v: 20 }])).toEqual({
      lo: 18,
      hi: 23.5,
    });
    expect(extentOf([{ v: 18 }], 25)).toEqual({ lo: 18, hi: 25 });
    expect(extentOf([], 21)).toEqual({ lo: 21, hi: 21 });
    expect(extentOf([{ v: null }])).toBeNull();
  });
});

describe("the history the home's sensors fetch", () => {
  const cards: HTMLElement[] = [];
  afterEach(() => {
    for (const c of cards.splice(0)) c.remove();
  });
  const draw = (El: typeof PosterCard | typeof TileCard, cfg: Record<string, unknown>) => {
    const el = new El();
    el.setConfig(cfg);
    document.body.appendChild(el);
    el.hass = snapshot() as never;
    cards.push(el);
    return el;
  };
  const T = "sensor.living_room_temperature";
  const L = "sensor.illuminance";

  it("is a poster's day for today's low and high, with or without its line", () => {
    const off = draw(PosterCard, { entity: T, visual: false });
    expect(off._historyIds).toEqual([T]);
    // a day back, whatever window its line draws
    expect(
      draw(PosterCard, { entity: T, visual: { type: "sparkline", hours: 6 } })._config,
    ).toMatchObject({ fetchHours: 24 });
  });

  it("is nothing on a tile without a plot, the plot's own with one", () => {
    expect(draw(TileCard, { entity: T })._historyIds).toEqual([]);
    expect(draw(TileCard, { entity: L })._historyIds).toEqual([]);
    expect(draw(TileCard, { entity: T, visual: "sparkline" })._historyIds).toEqual([T]);
    // the light level's poster fetches its line
    expect(draw(PosterCard, { entity: L })._historyIds).toEqual([L]);
  });
});
