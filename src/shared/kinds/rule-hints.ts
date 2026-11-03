// What is wrong with a card's rules as written (pure), for the editor's hints: rules match in the
// order written and the first match wins, so a rule can never match (`above` not below `below`),
// match everything (no condition: the rules after it never apply), or be covered by an earlier
// one (a `below: 10` after a `below: 20`, a state named twice).
export type RuleHint =
  | { kind: "never"; rule: number }
  | { kind: "always"; rule: number }
  | { kind: "covered"; rule: number; by: number };

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
// a rule's condition: the state it names, the values from `above` (inclusive) to `below`
const conditionOf = (r: unknown) => {
  const o = (r && typeof r === "object" ? r : {}) as Record<string, unknown>;
  const state = o.state === undefined || o.state === null ? null : String(o.state);
  return { state, above: num(o.above), below: num(o.below) };
};

export const ruleHints = (rules: unknown): RuleHint[] => {
  if (!Array.isArray(rules)) return [];
  const out: RuleHint[] = [];
  const all = rules.map(conditionOf);
  all.forEach((c, i) => {
    if (c.above !== null && c.below !== null && c.above >= c.below) {
      out.push({ kind: "never", rule: i });
      return;
    }
    const none = c.state === null && c.above === null && c.below === null;
    // the last rule may match everything: it is the default then
    if (none && i < all.length - 1) out.push({ kind: "always", rule: i });
    // an earlier rule that matches every value this one does
    for (let j = 0; j < i; j++) {
      const e = all[j];
      const sameState = e.state === null || e.state === c.state;
      const lo = e.above === null || (c.above !== null && c.above >= e.above);
      const hi = e.below === null || (c.below !== null && c.below <= e.below);
      if (sameState && lo && hi && !(e.state === null && e.above === null && e.below === null)) {
        out.push({ kind: "covered", rule: i, by: j });
        break;
      }
    }
  });
  return out;
};
