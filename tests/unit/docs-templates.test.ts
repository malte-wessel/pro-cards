// The docs site compiles every Markdown page into a Vue template, so a Jinja template written in
// the prose (inline code included) is a Vue expression: it throws when the page renders and takes
// the whole page down, while the build still passes. Templates belong in fences, the frontmatter
// or <code v-pre>; the changelog pages are generated from CHANGELOG.md the same way.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { walk } from "./docs-examples.ts";

// the lines of a page that Vue would read as an expression
const exposed = (md: string) =>
  md
    .replace(/^---\n[\s\S]*?\n---\n/, (m) => m.replace(/[^\n]/g, ""))
    .replace(/^(```|~~~)[\s\S]*?^\1/gm, (m) => m.replace(/[^\n]/g, ""))
    .replace(/<([a-zA-Z]+)[^>]*\bv-pre\b[^>]*>[\s\S]*?<\/\1>/g, (m) => m.replace(/[^\n]/g, ""))
    .split("\n")
    .flatMap((line, i) => (line.includes("{{") ? [`${i + 1}: ${line.trim().slice(0, 100)}`] : []));

describe("the docs site's Markdown", () => {
  it("writes Jinja templates in fences, the frontmatter or <code v-pre> only", () => {
    const found = [...walk("docs"), "CHANGELOG.md"].flatMap((file) =>
      exposed(readFileSync(file, "utf8")).map((l) => `${file}:${l}`),
    );
    expect(found).toEqual([]);
  });

  it("finds a template in the prose", () => {
    expect(exposed("A count: `value: \"{{ states('x') }}\"`.")).toHaveLength(1);
    expect(exposed("A count: <code v-pre>{{ states('x') }}</code>.")).toEqual([]);
    expect(exposed("```yaml\nvalue: \"{{ states('x') }}\"\n```")).toEqual([]);
  });
});
