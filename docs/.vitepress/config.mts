import { defineConfig, type MarkdownOptions } from "vitepress";
import container from "markdown-it-container";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));

// markdown-it as VitePress hands it to `markdown.config`, and its tokens
type MarkdownIt = Parameters<NonNullable<MarkdownOptions["config"]>>[0];
type Token = ReturnType<MarkdownIt["parse"]>[number];
// @types/markdown-it-container types `md` against the CommonJS copy of markdown-it's typings,
// VitePress against the ESM copy; the two declare different `Utils`, so neither is assignable
// to the other although they describe the same object
const containerPlugin = container as unknown as Parameters<MarkdownIt["use"]>[0];

// ::: live [width=<px|full>] [mode=auto|light|dark] [theme=default|graphite] [height=<px>]
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
  "Beautiful, customizable cards for Home Assistant dashboards: entity, group and sections cards, multi trend, sun path, illuminance, weather, wind, rain and power flow cards that look like they belong in Home Assistant.";

// the cards by category; the nav dropdown and the sidebar both list them this way
const cardGroups = [
  {
    text: "Entities",
    items: [
      { text: "Entity Card Pro", link: "/cards/entity-card" },
      { text: "Entity Group Card Pro", link: "/cards/entity-group-card" },
      { text: "Entity Sections Card Pro", link: "/cards/entity-sections-card" },
      { text: "Entity Options", link: "/cards/entity-options" },
      { text: "Multi Trend Card Pro", link: "/cards/multi-trend-card" },
    ],
  },
  { text: "Energy", items: [{ text: "Power Flow Card Pro", link: "/cards/power-flow-card" }] },
  {
    text: "Weather",
    items: [
      { text: "Weather Card Pro", link: "/cards/weather-card" },
      { text: "Wind Card Pro", link: "/cards/wind-card" },
      { text: "Rain Card Pro", link: "/cards/rain-card" },
      { text: "Sun Path Card Pro", link: "/cards/sun-path-card" },
      { text: "Illuminance Card Pro", link: "/cards/illuminance-card" },
    ],
  },
];

// the showcase dashboards, grown from the homepage examples
const showcase = [
  { text: "Energy", link: "/showcase/energy" },
  { text: "Overview", link: "/showcase/overview" },
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
        href: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap",
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
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Cards", items: cardGroups },
      {
        text: "Showcase",
        items: showcase,
      },
      { text: "Playground", link: "/playground" },
      { text: `v${pkg.version}`, link: "https://github.com/malte-wessel/pro-cards/releases" },
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting started", link: "/guide/getting-started" },
          { text: "Look & themes", link: "/guide/colours" },
          { text: "Sizing in sections", link: "/guide/sizing" },
          { text: "Languages", link: "/guide/languages" },
        ],
      },
      { text: "Cards", items: cardGroups },
      {
        text: "Showcase",
        items: showcase,
      },
      { text: "Playground", link: "/playground" },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/malte-wessel/pro-cards" }],
    search: { provider: "local" },
    editLink: { pattern: "https://github.com/malte-wessel/pro-cards/edit/main/docs/:path" },
    footer: { message: "Released under the MIT License.", copyright: "© 2026 Malte Wessel" },
    outline: { level: [2, 3] },
  },
});
