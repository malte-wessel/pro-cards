import { describe, it, expect } from "vitest";
import { depsChanged } from "../../../src/shared/deps.ts";

describe("depsChanged", () => {
  it("tells a first draw and every changed input, element by element", () => {
    const store = new WeakMap<object, readonly unknown[]>();
    const key = {},
      st = { state: "1" };
    expect(depsChanged(store, key, [st, 1, "en"])).toBe(true);
    expect(depsChanged(store, key, [st, 1, "en"])).toBe(false);
    // another state object with the same content is another state
    expect(depsChanged(store, key, [{ state: "1" }, 1, "en"])).toBe(true);
    expect(depsChanged(store, key, [{ state: "1" }, 1, "en"])).toBe(true);
    expect(depsChanged(store, key, [st, 1, "de"])).toBe(true);
    expect(depsChanged(store, key, [st, 1, "de", undefined])).toBe(true);
    expect(depsChanged(store, key, [st, 1, "de", undefined])).toBe(false);
    // NaN is the same NaN
    expect(depsChanged(store, key, [NaN])).toBe(true);
    expect(depsChanged(store, key, [NaN])).toBe(false);
    // each key keeps its own
    expect(depsChanged(store, {}, [NaN])).toBe(true);
  });
});
