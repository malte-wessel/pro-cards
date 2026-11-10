// An entity's options in the entity registry: fetched once for every card, told to the cards when
// they arrive, fetched again when the registry changes, null where they cannot be read.
import { afterEach, describe, expect, it, vi } from "vitest";
import type { HomeAssistant } from "../../../src/shared/ha.ts";
import {
  onRegistryOptions,
  registryOptions,
  resetRegistryOptions,
} from "../../../src/shared/registry-options.ts";

const flush = () => new Promise((r) => setTimeout(r, 0));
const hassWith = (answer: (id: string) => Promise<unknown>) => {
  let push: ((ev: unknown) => void) | null = null;
  const callWS = vi.fn((msg: { entity_id: string }) => answer(msg.entity_id));
  const hass = {
    callWS,
    connection: {
      subscribeMessage: vi.fn(async (cb: (ev: unknown) => void) => {
        push = cb;
        return () => {};
      }),
    },
  } as unknown as HomeAssistant;
  return { hass, callWS, push: (ev: unknown) => push?.(ev) };
};

afterEach(() => resetRegistryOptions());

describe("an entity's registry options", () => {
  it("are fetched once for every card and told when they arrive", async () => {
    const { hass, callWS } = hassWith(async () => ({
      options: { cover: { favorite_positions: [10, 90] } },
    }));
    const heard = vi.fn();
    const off = onRegistryOptions(heard);
    expect(registryOptions(hass, "cover.a")).toBeUndefined();
    expect(registryOptions(hass, "cover.a")).toBeUndefined();
    await flush();
    expect(callWS).toHaveBeenCalledTimes(1);
    expect(heard).toHaveBeenCalledTimes(1);
    expect(registryOptions(hass, "cover.a")).toEqual({ cover: { favorite_positions: [10, 90] } });
    off();
  });
  it("are null where they cannot be read: no entry, no access", async () => {
    const { hass } = hassWith(async (id) => {
      if (id === "light.denied") throw new Error("unauthorized");
      return null;
    });
    registryOptions(hass, "light.denied");
    registryOptions(hass, "light.none");
    await flush();
    expect(registryOptions(hass, "light.denied")).toBeNull();
    expect(registryOptions(hass, "light.none")).toBeNull();
    // without Home Assistant (a render before it) nothing is asked
    expect(registryOptions(undefined, "light.other")).toBeNull();
  });
  it("are fetched again when the registry says the entity changed", async () => {
    let n = 0;
    const { hass, callWS, push } = hassWith(async () => ({
      options: { timer: { presets: [++n] } },
    }));
    registryOptions(hass, "timer.a");
    await flush();
    push({ data: { action: "update", entity_id: "timer.a" } });
    await flush();
    expect(callWS).toHaveBeenCalledTimes(2);
    expect(registryOptions(hass, "timer.a")).toEqual({ timer: { presets: [2] } });
  });
});

describe("a registry fetch that failed", () => {
  it("is asked again after a minute, three times at most", async () => {
    vi.useFakeTimers();
    try {
      const { hass, callWS } = hassWith(async () => {
        throw new Error("dropped");
      });
      registryOptions(hass, "cover.b");
      await vi.advanceTimersByTimeAsync(0);
      expect(registryOptions(hass, "cover.b")).toBeNull();
      await vi.advanceTimersByTimeAsync(60e3);
      await vi.advanceTimersByTimeAsync(60e3);
      await vi.advanceTimersByTimeAsync(60e3);
      expect(callWS).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });
});
