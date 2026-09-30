import { describe, it, expect } from "vitest";
import en from "../../../src/i18n/en.ts";
import { LANGUAGES, stringsFor, t } from "../../../src/shared/i18n.ts";
import type { HomeAssistant } from "../../../src/shared/ha.ts";

const hass = (language?: string) =>
  ({ states: {}, locale: language ? { language } : undefined }) as unknown as HomeAssistant;

describe("i18n", () => {
  it("picks the language of hass.locale, by base language, and falls back to English", () => {
    expect(t(hass("de"), "common.now")).toBe("jetzt");
    expect(t(hass("de-DE"), "common.now")).toBe("jetzt");
    expect(t(hass("de-AT"), "sun.label.sunrise")).toBe("Sonnenaufgang");
    expect(t(hass("en-GB"), "common.now")).toBe("now");
    expect(t(hass("fr"), "common.now")).toBe("maintenant");
    expect(t(hass("pt-BR"), "common.now")).toBe("agora");
    expect(t(hass("fi"), "common.now")).toBe("now");
    expect(stringsFor(hass("fi"))).toBe(en);
  });
  it("uses the browser language without hass and shows English for an unknown one", () => {
    expect(typeof t(undefined, "common.now")).toBe("string");
    expect(t(null, "common.no_data").length).toBeGreaterThan(0);
  });
  it("falls back per key so a partial translation never shows a key", () => {
    const partial = { ...LANGUAGES.de };
    delete partial["entity.peak"];
    LANGUAGES.xx = partial;
    try {
      expect(t(hass("xx"), "common.now")).toBe("jetzt");
      expect(t(hass("xx"), "entity.peak")).toBe("Peak");
    } finally {
      delete LANGUAGES.xx;
    }
  });
  it("fills placeholders", () => {
    expect(t(hass("en"), "common.not_found", { entity: "sensor.x" })).toBe("sensor.x not found");
    expect(t(hass("de"), "editor.default", { value: "Nacht" })).toBe("Standard: Nacht");
    expect(t(hass("de"), "editor.illuminance.zone_max", { zone: "Tag" })).toBe("Tag: bis");
  });
  it("ships complete, non-empty tables", () => {
    const keys = Object.keys(en);
    expect(keys.length).toBeGreaterThan(50);
    for (const k of keys) expect(en[k as keyof typeof en]).not.toBe("");
    // every shipped language: full key set, no empty value, every placeholder of the English text kept
    for (const [code, table] of Object.entries(LANGUAGES)) {
      expect(Object.keys(table).sort(), code).toEqual([...keys].sort());
      for (const [k, v] of Object.entries(table)) {
        expect(v, `${code} ${k}`).not.toBe("");
        const ph = en[k as keyof typeof en].match(/\{\w+\}/g) || [];
        for (const p of ph) expect(v, `${code} ${k}`).toContain(p);
      }
    }
  });
});
