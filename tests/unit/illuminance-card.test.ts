import { describe, it, expect } from "vitest";
import {
  mergeZones,
  zoneOf,
  logOf,
  posOf,
  colorAnchors,
  colorAt,
  DEFAULT_ZONES,
} from "../../src/illuminance/zones.ts";
import { mixHex, hexToRgb, rgbToHex, resolveHex } from "../../src/shared/color.ts";
import { configToForm, formToConfig, editorSchema } from "../../src/illuminance/editor.ts";
import { IlluminanceCard } from "../../src/illuminance-card.ts";
import type { HomeAssistant } from "../../src/shared/ha.ts";

describe("illuminance-card zones and scale", () => {
  it("merges zone overrides and keeps defaults", () => {
    const z = mergeZones({
      day: { label: "Daylight", max: 40000, color: "orange" },
      sun: { color: "#ff0000" },
      night: { max: "" },
    });
    expect(z.map((x) => x.key)).toEqual(["night", "twilight", "overcast", "day", "sun"]);
    expect(z[3]).toMatchObject({ label: "Daylight", max: 40000, color: "orange" });
    expect(z[4]).toMatchObject({ label: "Sun", max: Infinity, color: "#ff0000" });
    expect(z[0].max).toBe(1);
    expect(mergeZones()).toEqual(DEFAULT_ZONES);
  });
  it("finds zones by value", () => {
    const z = mergeZones();
    expect(zoneOf(z, 0.5).key).toBe("night");
    expect(zoneOf(z, 1).key).toBe("twilight");
    expect(zoneOf(z, 9999).key).toBe("overcast");
    expect(zoneOf(z, 1e6).key).toBe("sun");
  });
  it("positions on a clamped log scale", () => {
    expect(logOf(0.01)).toBe(-1);
    expect(posOf(0.1, 0.1, 100000)).toBe(0);
    expect(posOf(100000, 0.1, 100000)).toBe(1);
    expect(posOf(100, 0.1, 100000)).toBeCloseTo(0.5, 5);
    expect(posOf(-5, 0.1, 100000)).toBe(0);
    expect(posOf(1e9, 0.1, 100000)).toBe(1);
  });
  it("blends colours between zone anchors", () => {
    const zones = mergeZones().map((z) => ({ ...z, hex: resolveHex(z.color) }));
    const a = colorAnchors(zones, 0.1, 100000);
    expect(a.length).toBe(5);
    expect(a[0].p).toBeLessThan(a[1].p);
    expect(a[4].p).toBeLessThanOrEqual(1);
    expect(colorAt(a, 0)).toBe(a[0].color);
    expect(colorAt(a, 1)).toBe(a[4].color);
    expect(colorAt(a, (a[0].p + a[1].p) / 2)).toBe(mixHex(a[0].color, a[1].color, 0.5));
    expect(mixHex("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(hexToRgb("#fff")).toEqual([255, 255, 255]);
    expect(rgbToHex(255, 0, 300)).toBe("#ff00ff");
    expect(resolveHex("rgb(1, 2, 3)")).toBe("#010203");
    expect(resolveHex("amber")).toBe("#ffc107");
    expect(resolveHex("nope-color")).toBe("#888888");
  });
});

describe("illuminance-card editor and element", () => {
  it("round-trips the form", () => {
    const cfg = {
      type: "custom:illuminance-card",
      entity: "sensor.lx",
      mode: "band",
      hours_to_show: 12,
      zones: { day: { label: "Daylight", max: 25000 } },
    };
    const data = configToForm(cfg);
    expect(data).toMatchObject({
      entity: "sensor.lx",
      mode: "band",
      hours_to_show: 12,
      bucket_minutes: 30,
      z_day_label: "Daylight",
      z_day_max: 25000,
      z_sun_label: "",
    });
    expect(formToConfig(data, cfg)).toEqual(cfg);
    expect(
      editorSchema({ mode: "arc" }).some((s) =>
        s.schema?.some?.((x) => x.name === "hours_to_show"),
      ),
    ).toBe(false);
    expect(
      editorSchema({ mode: "trend" }).some((s) =>
        s.schema?.some?.((x) => x.name === "hours_to_show"),
      ),
    ).toBe(true);
  });
  it("registers, validates and sizes", () => {
    expect(customElements.get("illuminance-card")).toBe(IlluminanceCard);
    expect(IlluminanceCard.getConfigElement().tagName.toLowerCase()).toBe(
      "illuminance-card-editor",
    );
    const el = new IlluminanceCard();
    expect(() => el.setConfig({})).toThrow(/entity/);
    el.setConfig({ entity: "sensor.lx", mode: "nope" });
    expect(el.getGridOptions()).toEqual({ columns: 12, rows: "auto", min_columns: 6 });
    expect(el.getCardSize()).toBe(4);
    expect(
      IlluminanceCard.getStubConfig(
        {
          states: {
            "sensor.a": { attributes: {} },
            "sensor.lx": { attributes: { device_class: "illuminance" } },
          },
        } as unknown as HomeAssistant,
        ["sensor.a", "sensor.lx"],
      ).entity,
    ).toBe("sensor.lx");
  });
});
