# Contributing

Thanks for helping with Pro Cards. The short version:

1. Fork, branch from `main`, `npm install` (Node 22.18 or newer: the build and scripts are TypeScript run directly by Node).
2. Change cards in `src/`, run `npm run build`, commit the updated `dist/pro-cards.js` with your change.
3. Add or update tests (`docs/guide/testing.md` explains the three layers) and docs (`docs/cards/`).
4. The sources are TypeScript (`strict`); `npm run typecheck` must pass. Formatting is Prettier; the pre-commit hook formats and lints staged files, or run `npm run format` yourself.
5. Run `npm run check` before opening the pull request. Run `npm run test:visual` (Docker) if anything rendered changed, and commit updated baselines only when the change is intended.
6. Add a line to `CHANGELOG.md` under the next version.

Working with an AI coding agent? `AGENTS.md` holds the project rules and `.claude/skills/` the common workflows.

Card design rules: dependency-free web components, theme tokens only, no fixed widths, `getGridOptions` for every layout, no breaking changes to existing YAML options without a changelog note.
