import { readFileSync } from "node:fs";
import * as esbuild from "esbuild";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
const watch = process.argv.includes("--watch");

const options: esbuild.BuildOptions = {
  entryPoints: ["src/index.ts"],
  outfile: "dist/pro-cards.js",
  bundle: true,
  format: "iife",
  target: "es2022",
  minify: true,
  sourcemap: false,
  legalComments: "none",
  define: { __VERSION__: JSON.stringify(version) },
  banner: { js: `/* pro-cards v${version} | MIT | https://github.com/malte-wessel/pro-cards */` },
  logLevel: "info",
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
