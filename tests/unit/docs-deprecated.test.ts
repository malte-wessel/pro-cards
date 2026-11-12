// No example on the docs site is a deprecated card or writes a deprecated key (its card says so in
// the console), outside the pages of the deprecated cards (the sidebar's older cards) and the
// migration guide, which show them on purpose.
import { describe, expect, it, vi } from "vitest";
import "../../src/index.ts";
import { resetDeprecatedKeys } from "../../src/shared/card.ts";
import { docExamples, withNested } from "./docs-examples.ts";

const OLD =
  /^docs\/(guide\/migrating|cards\/(entity-card|entity-group-card|entity-sections-card|entity-options|entity-controls|wind-card|rain-card|illuminance-card))\.md$/;

describe("the docs' examples", () => {
  it("write no deprecated key", () => {
    const found: string[] = [];
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      for (const { file, cfg } of docExamples()) {
        if (OLD.test(file)) continue;
        for (const c of withNested(cfg)) {
          const type = String((c as { type?: unknown })?.type ?? "");
          if (!type.startsWith("custom:")) continue;
          resetDeprecatedKeys();
          warn.mockClear();
          const el = document.createElement(type.slice(7)) as HTMLElement & {
            setConfig?: (c: unknown) => void;
          };
          el.setConfig?.(c);
          for (const [m] of warn.mock.calls)
            if (/is deprecated and goes in 4\.0/.test(String(m))) found.push(`${file}: ${m}`);
        }
      }
    } finally {
      warn.mockRestore();
    }
    expect(found).toEqual([]);
  });
});
