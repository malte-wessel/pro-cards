import { describe, it, expect } from "vitest";
import { ruleHints } from "../../../../src/shared/kinds/rule-hints.ts";

describe("the hints on a card's rules", () => {
  it("say nothing of rules that each match something of their own", () => {
    expect(ruleHints([{ below: 10 }, { below: 20 }, { above: 20 }])).toEqual([]);
    expect(ruleHints([{ state: "on", color: "amber" }, { state: "off" }])).toEqual([]);
    // the last rule with no condition is the default
    expect(ruleHints([{ state: "on" }, { color: "grey" }])).toEqual([]);
    expect(ruleHints(undefined)).toEqual([]);
  });

  it("find a rule that never matches", () => {
    expect(ruleHints([{ above: 30, below: 10 }])).toEqual([{ kind: "never", rule: 0 }]);
    expect(ruleHints([{ above: 10, below: 10 }])).toEqual([{ kind: "never", rule: 0 }]);
  });

  it("find a rule that matches everything before others", () => {
    // (the rules after it are not named again: the hint says they never apply)
    expect(ruleHints([{ color: "red" }, { below: 10 }])).toEqual([{ kind: "always", rule: 0 }]);
  });

  it("find a rule an earlier one covers", () => {
    // the bands in the wrong order
    expect(ruleHints([{ below: 20 }, { below: 10 }])).toEqual([
      { kind: "covered", rule: 1, by: 0 },
    ]);
    expect(ruleHints([{ above: 10 }, { above: 30, color: "red" }])).toEqual([
      { kind: "covered", rule: 1, by: 0 },
    ]);
    // a state named twice; a band that only part of covers is fine
    expect(ruleHints([{ state: "on" }, { state: "on", above: 50 }])).toEqual([
      { kind: "covered", rule: 1, by: 0 },
    ]);
    expect(ruleHints([{ below: 20 }, { above: 10, below: 30 }])).toEqual([]);
  });
});
