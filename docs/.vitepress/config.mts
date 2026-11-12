import { defineConfig, type MarkdownOptions } from "vitepress";
import container from "markdown-it-container";
import { cpSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));

// markdown-it as VitePress hands it to `markdown.config`, and its tokens
type MarkdownIt = Parameters<NonNullable<MarkdownOptions["config"]>>[0];
type Token = ReturnType<MarkdownIt["parse"]>[number];
// @types/markdown-it-container types `md` against the CommonJS copy of markdown-it's typings,
// VitePress against the ESM copy; the two declare different `Utils`, so neither is assignable
// to the other although they describe the same object
const containerPlugin = container as unknown as Parameters<MarkdownIt["use"]>[0];

// ::: live [width=<px|full>] [mode=auto|light|dark] [theme=default|graphite|large] [height=<px>]
//   ```yaml … ```
// :::
// renders the fenced YAML as a live card above the (highlighted) code block.
const liveContainer = (md: MarkdownIt) => {
  md.use(containerPlugin, "live", {
    validate: (params: string) => /^live(\s|$)/.test(params.trim()),
    render(tokens: Token[], idx: number) {
      const tok = tokens[idx];
      if (tok.nesting === 1) {
        const opts: Record<string, string> = {};
        for (const m of tok.info
          .trim()
          .slice(4)
          .matchAll(/(\w+)=([^\s]+)/g))
          opts[m[1]] = m[2];
        let yaml = "";
        for (let i = idx + 1; i < tokens.length; i++) {
          if (tokens[i].type === "container_live_close") break;
          if (tokens[i].type === "fence") {
            yaml = tokens[i].content;
            break;
          }
        }
        const b64 = Buffer.from(yaml, "utf8").toString("base64");
        const attrs = Object.entries(opts)
          .map(([k, v]) => ` ${k}="${md.utils.escapeHtml(v)}"`)
          .join("");
        return `<LiveCard b64="${b64}"${attrs}>`;
      }
      return "</LiveCard>\n";
    },
  });
};

const base = "/pro-cards/";
const site = `https://malte-wessel.github.io${base}`;
const description =
  "Beautiful, customizable cards for Home Assistant dashboards: tiles, posters and tile groups for every kind of entity, headings, layout and swipe cards, weather, multi trend, sun path and power and energy flow cards that look like they belong in Home Assistant.";

// the site's sections: the sidebar lists them all, the nav the same without the old cards. The
// tile and the poster share their topic pages: each concept once, shown on both
const getStarted = [
  { text: "Introduction", link: "/guide/introduction" },
  { text: "Install & first card", link: "/guide/getting-started" },
  { text: "Moving to 3.0", link: "/guide/migrating" },
];
const tilePoster = [
  { text: "Tile", link: "/cards/tile-card" },
  { text: "Poster", link: "/cards/poster-card" },
  { text: "Tile group", link: "/cards/tile-group-card" },
  { text: "Kinds", link: "/cards/kinds" },
  { text: "Look", link: "/cards/look" },
  { text: "Controls", link: "/cards/controls" },
  { text: "Badges", link: "/cards/badges" },
  { text: "Actions & hover", link: "/cards/actions" },
  { text: "Sizes", link: "/cards/sizes" },
];
const arrange = [
  { text: "Heading", link: "/cards/heading-card" },
  { text: "Layout", link: "/cards/layout-card" },
  { text: "Swipe", link: "/cards/swipe-card" },
];
const energy = [
  { text: "Power flow", link: "/cards/power-flow-card" },
  { text: "Energy flow", link: "/cards/energy-flow-card" },
];
const moreCards = [
  { text: "Weather", link: "/cards/weather-card" },
  { text: "Sun path", link: "/cards/sun-path-card" },
  { text: "Sun azimuth", link: "/cards/sun-azimuth-card" },
  { text: "Multi trend", link: "/cards/multi-trend-card" },
];
const guides = [
  { text: "Themes & colours", link: "/guide/colours" },
  { text: "Sizing in sections", link: "/guide/sizing" },
  { text: "Visibility", link: "/guide/visibility" },
  { text: "Languages", link: "/guide/languages" },
  { text: "Changelog", link: "/changelog/" },
];
// still working in 3.0, gone in 4.0 (Moving to 3.0 names what takes over)
const olderCards = [
  { text: "Entity card", link: "/cards/entity-card" },
  { text: "Entity group card", link: "/cards/entity-group-card" },
  { text: "Entity sections card", link: "/cards/entity-sections-card" },
  { text: "Entity options", link: "/cards/entity-options" },
  { text: "Controls of the entity cards", link: "/cards/entity-controls" },
  { text: "Wind card", link: "/cards/wind-card" },
  { text: "Rain card", link: "/cards/rain-card" },
  { text: "Illuminance card", link: "/cards/illuminance-card" },
];

// the showcase dashboards, linked from the home page
const showcase = [
  { text: "Home", link: "/showcase/home" },
  { text: "Posters", link: "/showcase/posters" },
  { text: "Energy", link: "/showcase/energy" },
  { text: "Living room", link: "/showcase/living-room" },
  { text: "Weather", link: "/showcase/weather" },
];

export default defineConfig({
  title: "Pro Cards",
  description,
  base,
  lang: "en-US",
  lastUpdated: true,
  cleanUrls: true,
  head: [
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Roboto:wght@300..900&display=swap",
      },
    ],
    ["link", { rel: "icon", href: `${base}favicon.svg`, type: "image/svg+xml" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "Pro Cards" }],
    ["meta", { property: "og:title", content: "Pro Cards" }],
    ["meta", { property: "og:description", content: description }],
    ["meta", { property: "og:url", content: site }],
    ["meta", { property: "og:image", content: `${site}og.png` }],
    ["meta", { property: "og:image:width", content: "1200" }],
    ["meta", { property: "og:image:height", content: "630" }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:title", content: "Pro Cards" }],
    ["meta", { name: "twitter:description", content: description }],
    ["meta", { name: "twitter:image", content: `${site}og.png` }],
    ["meta", { name: "theme-color", content: "#ffffff", media: "(prefers-color-scheme: light)" }],
    ["meta", { name: "theme-color", content: "#111111", media: "(prefers-color-scheme: dark)" }],
  ],
  markdown: { config: liveContainer },
  // the JSON Schemas ship with the site, so a YAML language server can point at
  // <site>/schema/pro-cards.schema.json (README and the getting started page name that URL)
  buildEnd({ outDir }) {
    cpSync(fileURLToPath(new URL("../../schema", import.meta.url)), `${outDir}/schema`, {
      recursive: true,
    });
  },
  vite: {
    define: { __VERSION__: JSON.stringify(pkg.version) },
    optimizeDeps: { include: ["js-yaml", "@mdi/js"] },
  },
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) =>
          tag.startsWith("ha-") || tag.endsWith("-card") || tag.endsWith("-card-pro"),
      },
    },
  },
  themeConfig: {
    logo: "/logo.svg",
    nav: [
      { text: "Get started", items: getStarted },
      {
        text: "Cards",
        items: [
          { text: "Tile & poster", items: tilePoster },
          { text: "Energy", items: energy },
          { text: "Arrange", items: arrange },
          { text: "More cards", items: moreCards },
        ],
      },
      { text: "Guides", items: guides },
      {
        text: "Showcase",
        items: showcase,
      },
      { text: "Playground", link: "/playground" },
      { text: `v${pkg.version}`, link: "https://github.com/malte-wessel/pro-cards/releases" },
    ],
    sidebar: [
      { text: "Get started", items: getStarted },
      { text: "Tile & poster", items: tilePoster },
      { text: "Energy", items: energy },
      { text: "Arrange", items: arrange },
      { text: "More cards", items: moreCards },
      { text: "Guides", items: guides },
      { text: "Showcase", items: showcase },
      { text: "Older cards (deprecated)", collapsed: true, items: olderCards },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/malte-wessel/pro-cards" }],
    search: { provider: "local" },
    editLink: { pattern: "https://github.com/malte-wessel/pro-cards/edit/main/docs/:path" },
    footer: { message: "Released under the MIT License.", copyright: "© 2026 Malte Wessel" },
    outline: { level: [2, 3] },
  },
});
