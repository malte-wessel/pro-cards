import { readFileSync } from "node:fs";

// The changelog pages are the repository's CHANGELOG.md, so a release is written once:
// its `## ` releases, newest first, split into pages of PER_PAGE. Page 1 is /changelog/,
// page n is /changelog/n.
const PER_PAGE = 7;

export default {
  paths() {
    const text = readFileSync(new URL("../../CHANGELOG.md", import.meta.url), "utf8");
    const releases = text
      .split(/^(?=## )/m)
      .slice(1)
      .map((r) => r.trim());
    const pages: string[][] = [];
    for (let i = 0; i < releases.length; i += PER_PAGE) pages.push(releases.slice(i, i + PER_PAGE));
    // "2.8.0 – 2.3.1": the newest and the oldest version on a page, for the pager
    const version = (release: string) => release.match(/^## (\S+)/)?.[1] ?? "";
    const ranges = pages.map((p) => `${version(p[0])} – ${version(p[p.length - 1])}`);
    return pages.map((p, i) => ({
      params: { page: i === 0 ? "index" : String(i + 1), index: i, ranges },
      content: [i === 0 ? "# Changelog" : `# Changelog · ${ranges[i]}`, ...p].join("\n\n"),
    }));
  },
};
