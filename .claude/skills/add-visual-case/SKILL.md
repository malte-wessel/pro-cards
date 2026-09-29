---
name: add-visual-case
description: Add or update a visual regression case and regenerate the Linux baselines in Docker.
---

# Add a visual regression case

1. Append an entry to `CASES` in `tests/visual/cards.spec.ts`. The key becomes the PNG name; light and dark variants are generated automatically. Use demo-world entities only.
2. Baselines are rendered on Linux only. Start Docker Desktop, then:
   ```sh
   npm run test:visual:update -- -g "<case name>"   # only the new/changed case
   npm run test:visual                              # whole suite must pass twice in a row
   ```
   Never run `npx playwright test --update-snapshots` natively; macOS fonts would produce wrong baselines and CI fails.
3. Open the new PNGs in `tests/visual/__snapshots__/` and check they show what the case intends (colours, tint, dark theme). `git diff --stat` should list only the PNGs you meant to change.
4. If an existing baseline changed unexpectedly, the card changed; decide whether that is intended before updating.
5. Commit the spec and the PNGs together.
