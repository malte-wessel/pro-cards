// Every card the docs site renders (`::: live` fences and DashboardGrid dashboards) mounts in the
// harness without a console error and without an entity the demo home lacks: a broken example
// looks like a bug in the card. The schema test only checks the YAML; this one runs it.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import { test, expect, mount } from "./util";
import type { CardConfigBase } from "../../src/shared/ha.ts";

const walk = (d: string): string[] =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    if (statSync(p).isDirectory()) return f.startsWith(".") ? [] : walk(p);
    return p.endsWith(".md") ? [p] : [];
  });
// the cards of a page in mounts: each `::: live` example at one section's width, each dashboard
// section at the width the docs grid gives it (about 400 px per column it spans)
interface Mount {
  cards: CardConfigBase[];
  width?: number;
}
const SECTION_W = 400;
const mountsOf = (md: string): Mount[] => {
  const out: Mount[] = [];
  for (const m of md.matchAll(/^::: live[^\n]*\n\n?```yaml\n([\s\S]*?)```/gm)) {
    const doc = yaml.load(m[1]) as CardConfigBase | CardConfigBase[];
    out.push({ cards: Array.isArray(doc) ? doc : [doc] });
  }
  for (const m of md.matchAll(/<DashboardGrid b64="([A-Za-z0-9+/=]+)"/g)) {
    const sections = yaml.load(Buffer.from(m[1], "base64").toString("utf8")) as {
      column_span?: number;
      cards?: CardConfigBase[];
    }[];
    for (const s of sections) {
      const cards = (s.cards || []).filter((c) => c.type !== "heading");
      const span = Math.min(3, Number(s.column_span) || 1);
      if (cards.length) out.push({ cards, width: span * SECTION_W });
    }
  }
  return out;
};
const examples = (md: string) => mountsOf(md).flatMap((m) => m.cards);

for (const file of walk("docs")) {
  const mounts = mountsOf(readFileSync(file, "utf8"));
  if (!mounts.length) continue;
  for (const [k, { cards, width }] of mounts.entries())
    test(`${file} #${k + 1}: ${cards.length} cards render`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      page.on("pageerror", (e) => errors.push(String(e)));
      const n = await mount(page, cards, { liveClock: true, width });
      expect(n).toBe(cards.length);
      const missing = await page.evaluate(() =>
        [...document.querySelectorAll("#root .cell > *")]
          .map((el) => el.shadowRoot?.textContent ?? "")
          .filter((t) => / not found/.test(t)),
      );
      expect(missing).toEqual([]);
      expect(errors).toEqual([]);
      // no control spills past its card (clipped by the card's overflow) at a section's width
      const spilled = await page.evaluate(() =>
        [...document.querySelectorAll("#root .cell > *")].flatMap((el, i) => {
          const root = el.shadowRoot;
          const card = root?.querySelector("ha-card")?.getBoundingClientRect();
          if (!root || !card) return [];
          return [...root.querySelectorAll<HTMLElement>(".ctl, .toggle")]
            .filter((c) => {
              const b = c.getBoundingClientRect();
              return b.width > 0 && (b.right > card.right + 0.5 || b.bottom > card.bottom + 0.5);
            })
            .map((c) => `card ${i}: ${c.className}`);
        }),
      );
      expect(spilled).toEqual([]);
    });
}

test("the controls page draws working controls", async ({ page }) => {
  const cards = examples(readFileSync("docs/cards/controls.md", "utf8"));
  await mount(page, cards, { liveClock: true });
  const count = await page.evaluate(() =>
    [...document.querySelectorAll("#root .cell > *")].reduce(
      (a, el) => a + (el.shadowRoot?.querySelectorAll(".ctl, .toggle, .lead.tap").length ?? 0),
      0,
    ),
  );
  expect(count).toBeGreaterThan(60);
});
