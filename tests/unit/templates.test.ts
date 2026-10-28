import { afterEach, describe, it, expect, vi } from "vitest";
import {
  renderTemplate,
  makeScope,
  strftime,
} from "../../docs/.vitepress/theme/ha-shim/templates.ts";
import type { HassEntity } from "../../src/shared/ha.ts";

// the states proxy of the shim's template scope: callable, with one array per domain
interface ShimScope {
  states: ((id: string) => string) & Record<string, HassEntity[] & Record<string, HassEntity>>;
  has_value: (id: string) => boolean;
  is_state_attr: (id: string, attr: string, value: unknown) => boolean;
}

const st = (id: string, state: string, attributes: Record<string, unknown> = {}) =>
  ({ entity_id: id, state: String(state), attributes }) as unknown as HassEntity;
const states = {
  "sensor.t": st("sensor.t", "17.4", { unit_of_measurement: "°C" }),
  "sensor.dew": st("sensor.dew", "12.1"),
  "light.a": st("light.a", "on", { brightness: 200, friendly_name: "A" }),
  "light.b": st("light.b", "off"),
  "light.c": st("light.c", "on"),
  "binary_sensor.w1": st("binary_sensor.w1", "on", { device_class: "window" }),
  "binary_sensor.w2": st("binary_sensor.w2", "off", { device_class: "window" }),
  "binary_sensor.m": st("binary_sensor.m", "on", { device_class: "motion" }),
  "person.alex": st("person.alex", "home"),
};
const r = (tpl: string) => renderTemplate(tpl, states);

describe("renderTemplate", () => {
  it("renders states() and leaves plain text", () => {
    expect(r("{{ states('sensor.t') }} °C now")).toEqual({ ok: true, result: "17.4 °C now" });
    expect(r("no template")).toEqual({ ok: true, result: "no template" });
    expect(r("{{ states('sensor.nope') }}").result).toBe("unknown");
  });
  it("applies filters with Jinja precedence (filter binds tighter than arithmetic)", () => {
    expect(r("{{ states('sensor.t') | float(0) - states('sensor.dew') | float(0) }}").result).toBe(
      "5.3",
    );
    expect(r("{{ (states('sensor.t') | float - 0.4) | round(0) }}").result).toBe("17");
    expect(r("{{ 'abc' | upper }} {{ 'ABC' | lower }} {{ 'a b' | title }}").result).toBe(
      "ABC abc A B",
    );
    expect(r("{{ 'x_y' | replace('_', ' ') }}").result).toBe("x y");
    expect(r("{{ none | default('d') }} {{ 5 | default(1) }}").result).toBe("d 5");
    expect(
      r("{{ [3, 1, 2] | sort | join(',') }} {{ [1, 2, 3] | sum }} {{ [1, 5] | max }}").result,
    ).toBe("1,2,3 6 5");
    expect(
      r("{{ 'abc' | length }} {{ [1,2] | count }} {{ [1,2,3] | first }} {{ [1,2,3] | last }}")
        .result,
    ).toBe("3 2 1 3");
    expect(r("{{ (-2.5) | abs }} {{ '7' | int + 1 }}").result).toBe("2.5 8");
  });
  it("iterates domains via states.<domain>", () => {
    expect(
      r(
        "{{ states.light | selectattr('state', 'eq', 'on') | list | count }} of {{ states.light | list | count }}",
      ).result,
    ).toBe("2 of 3");
    expect(
      r(
        "{{ states.light | rejectattr('state', 'eq', 'on') | map(attribute='entity_id') | join(', ') }}",
      ).result,
    ).toBe("light.b");
    expect(
      r(
        "{{ states.binary_sensor | selectattr('attributes.device_class', 'eq', 'window') | selectattr('state', 'eq', 'on') | list | count }}",
      ).result,
    ).toBe("1");
    expect(r("{{ states.light.a.attributes.brightness }}").result).toBe("200");
  });
  it("supports state_attr, is_state and boolean logic", () => {
    expect(r("{{ state_attr('light.a', 'brightness') / 255 * 100 | round(0) }}").result).toBe(
      "78.431373",
    );
    expect(r("{{ (state_attr('light.a', 'brightness') / 255 * 100) | round(0) }}").result).toBe(
      "78",
    );
    expect(
      r("{{ is_state('person.alex', 'home') and not is_state('light.b', 'on') }}").result,
    ).toBe("True");
    expect(r("{{ is_state('person.alex', ['home', 'work']) or False }}").result).toBe("True");
    expect(r("{{ states('sensor.t') | float > 10 }} {{ 3 == 3.0 }} {{ 'a' != 'b' }}").result).toBe(
      "True True True",
    );
  });
  it("supports inline if/else, in and is tests", () => {
    expect(r("{{ 'warm' if states('sensor.t') | float > 15 else 'cold' }}").result).toBe("warm");
    expect(r("{{ 'x' if false }}").result).toBe("None");
    expect(r("{{ 'on' in ['on', 'off'] }} {{ 'zz' not in ['on'] }}").result).toBe("True True");
    expect(
      r("{{ states('sensor.t') is number }} {{ none is none }} {{ 5 is defined }}").result,
    ).toBe("True True True");
    expect(r("{{ [1, 2, 3, 4] | select('gt', 2) | list | count }}").result).toBe("2");
  });
  it("handles string concatenation, numbers and formatting", () => {
    expect(
      r("{{ 'a' ~ 1 ~ 'b' }} {{ 1 + 2 }} {{ 'x' + 'y' }} {{ 7 // 2 }} {{ 7 % 3 }} {{ 2 * 3.5 }}")
        .result,
    ).toBe("a1b 3 xy 3 1 7");
    expect(r("{{ 1/3 }}").result).toBe("0.333333");
  });
  it("reports unsupported statements and syntax errors without throwing", () => {
    expect(r("{% if true %}x{% endif %}")).toMatchObject({ ok: false });
    expect(r("{{ states('a' }}")).toMatchObject({ ok: false });
    expect(r("{{ 1 | nosuchfilter }}")).toMatchObject({ ok: false });
    expect(r("{{ states('a' }}").result).toBe("{{ states('a' }}");
  });
});

describe("makeScope", () => {
  it("exposes helpers and a callable states proxy", () => {
    const S = makeScope(states) as unknown as ShimScope;
    expect(S.states("light.a")).toBe("on");
    expect(S.states.light.length).toBe(3);
    expect(S.states.light.a.state).toBe("on");
    expect(S.has_value("light.a")).toBe(true);
    expect(S.has_value("light.zzz")).toBe(false);
    expect(S.is_state_attr("light.a", "brightness", 200)).toBe(true);
  });
});

describe("strftime", () => {
  // a Wednesday afternoon, local time
  const d = new Date(2026, 6, 1, 9, 5, 7);
  it("formats the time and the date codes in local time", () => {
    expect(strftime(d, "%H:%M:%S")).toBe("09:05:07");
    expect(strftime(d, "%d.%m.%Y")).toBe("01.07.2026");
    expect(strftime(d, "%e")).toBe("1");
    expect(strftime(new Date(2026, 6, 14, 23, 59), "%e %H:%M")).toBe("14 23:59");
  });
  it("names the day and the month in English, long and short", () => {
    expect(strftime(d, "%A, %B")).toBe("Wednesday, July");
    expect(strftime(d, "%a %b")).toBe("Wed Jul");
    expect(strftime(new Date(2026, 0, 4), "%A %B")).toBe("Sunday January");
  });
  it("writes %% as a percent sign and leaves other text alone", () => {
    expect(strftime(d, "100%% at %H h")).toBe("100% at 09 h");
    expect(strftime(d, "%Q")).toBe("%Q");
  });
});

describe("now() in a template", () => {
  afterEach(() => {
    vi.useRealTimers();
  });
  it("formats the time with strftime", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 1, 7, 30));
    expect(r("{{ now().strftime('%H:%M') }}")).toEqual({ ok: true, result: "07:30" });
    expect(r("It is {{ now().strftime('%A') }}").result).toBe("It is Wednesday");
    expect(r("{{ utcnow().strftime('%Y') }}").result).toBe("2026");
  });
});
