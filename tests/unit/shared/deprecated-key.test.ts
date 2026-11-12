// A key with a new spelling: read as the new one until 4.0, said once per card type and key;
// both written is an error.
import { afterEach, describe, expect, it, vi } from "vitest";
import { renamedKey, warnDeprecatedKey } from "../../../src/shared/card.ts";

afterEach(() => vi.restoreAllMocks());

describe("a deprecated key", () => {
  it("is said once per card type and key, with what to write and the guide's section", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnDeprecatedKey("a-card", "old_key", "write new_key", "a-card");
    warnDeprecatedKey("a-card", "old_key", "write new_key", "a-card");
    warnDeprecatedKey("b-card", "old_key", "write new_key");
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[0][0]).toBe(
      "a-card: old_key is deprecated and goes in 4.0: write new_key (https://malte-wessel.github.io/pro-cards/guide/migrating#a-card)",
    );
  });
  it("is read as the new one; the new one wins nothing by being written twice", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(renamedKey({ hours: 6 }, "c-card", "hours", "hours_to_show")).toBe(6);
    expect(renamedKey({ hours_to_show: 12 }, "c-card", "hours", "hours_to_show")).toBe(12);
    expect(renamedKey({}, "c-card", "hours", "hours_to_show")).toBeUndefined();
    expect(() =>
      renamedKey({ hours: 6, hours_to_show: 12 }, "c-card", "hours", "hours_to_show"),
    ).toThrow("c-card: hours_to_show is hours: write hours only");
  });
});
