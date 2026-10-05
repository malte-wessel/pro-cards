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
const examples = (md: string): CardConfigBase[] => {
  const out: CardConfigBase[] = [];
  for (const m of md.matchAll(/^::: live[^\n]*\n\n?```yaml\n([\s\S]*?)```/gm)) {
    const doc = yaml.load(m[1]) as CardConfigBase | CardConfigBase[];
    out.push(...(Array.isArray(doc) ? doc : [doc]));
  }
  for (const m of md.matchAll(/<DashboardGrid b64="([A-Za-z0-9+/=]+)"/g)) {
    const sections = yaml.load(Buffer.from(m[1], "base64").toString("utf8")) as {
      cards?: CardConfigBase[];
    }[];
    for (const s of sections) for (const c of s.cards || []) if (c.type !== "heading") out.push(c);
  }
  return out;
};

for (const file of walk("docs")) {
  const cards = examples(readFileSync(file, "utf8"));
  if (!cards.length) continue;
  test(`${file}: ${cards.length} cards render`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));
    const n = await mount(page, cards, { liveClock: true });
    expect(n).toBe(cards.length);
    const missing = await page.evaluate(() =>
      [...document.querySelectorAll("#root .cell > *")]
        .map((el) => el.shadowRoot?.textContent ?? "")
        .filter((t) => / not found/.test(t)),
    );
    expect(missing).toEqual([]);
    expect(errors).toEqual([]);
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
