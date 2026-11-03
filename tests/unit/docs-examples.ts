// Every card config the docs site renders, for the tests that check them all (the schema, the
// editors' round trip): ::: live fences, DashboardGrid sections, the home page's hero backdrop
// (`hero.dashboard` in the frontmatter) and its feature rows (`feature_rows`).
import yaml from "js-yaml";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export const walk = (d: string): string[] =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory()
      ? f.startsWith(".")
        ? []
        : walk(p)
      : p.endsWith(".md")
        ? [p]
        : [];
  });

// Home Assistant's own cards the docs shim has: not ours to validate
const CORE = new Set(["heading", "energy-date-selection"]);
const core = (c: unknown) => CORE.has(String((c as { type?: unknown } | null)?.type));

// every card config the docs site renders: ::: live fences, DashboardGrid sections, the home page embeds DashboardGrids too,
// the home hero's backdrop (`hero.dashboard` in the frontmatter) and its feature rows (`feature_rows`)
export const docExamples = () => {
  const out: { file: string; cfg: unknown }[] = [];
  for (const file of walk("docs")) {
    const md = readFileSync(file, "utf8");
    const front = /^---\n([\s\S]*?)\n---/.exec(md);
    const fm = front
      ? (yaml.load(front[1]) as { hero?: { dashboard?: unknown }; feature_rows?: unknown } | null)
      : null;
    if (Array.isArray(fm?.hero?.dashboard))
      for (const s of fm.hero.dashboard as { cards?: unknown[] }[])
        for (const c of s.cards || []) if (!core(c)) out.push({ file, cfg: c });
    if (Array.isArray(fm?.feature_rows))
      for (const t of fm.feature_rows as { cards?: unknown[] }[])
        for (const c of t.cards || []) if (!core(c)) out.push({ file, cfg: c });
    for (const m of md.matchAll(/^::: live[^\n]*\n\n?```yaml\n([\s\S]*?)```/gm)) {
      const doc = yaml.load(m[1]);
      for (const c of Array.isArray(doc) ? doc : [doc]) if (!core(c)) out.push({ file, cfg: c });
    }
    for (const m of md.matchAll(/<DashboardGrid b64="([A-Za-z0-9+/=]+)"/g)) {
      const sections = yaml.load(Buffer.from(m[1], "base64").toString("utf8")) as {
        cards?: { type?: string }[];
      }[];
      for (const s of sections)
        for (const c of s.cards || []) if (!core(c)) out.push({ file, cfg: c });
    }
  }
  return out;
};

// the cards inside a card too (a layout's or a swipe card's `cards`), depth first
export const withNested = (cfg: unknown): unknown[] => {
  const c = cfg as { cards?: unknown };
  return [cfg, ...(Array.isArray(c?.cards) ? c.cards.flatMap(withNested) : [])];
};
