// ESLint: the recommended JS and TypeScript rules only; types are checked by `npm run typecheck`.
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/",
      "docs/.vitepress/dist/",
      "docs/.vitepress/cache/",
      "node_modules/",
      "**/*.vue",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", caughtErrors: "none" },
      ],
    },
  },
  {
    // browser code: the cards, the docs shim and the test harness
    files: ["src/**/*.ts", "docs/.vitepress/theme/**/*.ts", "tests/harness/**/*.ts"],
    languageOptions: { globals: { ...globals.browser, __VERSION__: "readonly" } },
  },
  {
    // node code: build, scripts, test runners and their specs
    files: [
      "*.ts",
      "*.mts",
      "scripts/**/*.ts",
      "docs/.vitepress/config.mts",
      "tests/e2e/**/*.ts",
      "tests/visual/**/*.ts",
      "tests/unit/**/*.ts",
    ],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
);
