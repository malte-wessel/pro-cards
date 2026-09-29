---
name: release
description: Cut a Pro Cards release: version bump, changelog, bundle, tag; the GitHub workflow attaches the bundle and HACS picks it up.
---

# Release

Preconditions: `main` is clean, `npm run check` passes, visual suite passed for the last rendered change, the GitHub remote exists.

1. Decide the version (semver: options added → minor, behaviour of existing YAML changed → major, fixes → patch).
2. `npm version <x.y.z> --no-git-tag-version` (updates `package.json` and `package-lock.json`).
3. Move the `## Unreleased` items in `CHANGELOG.md` under `## <x.y.z>` with today's date. Every user-visible change gets a line; breaking changes get a **Breaking:** prefix.
4. `npm run build` – the banner in `dist/pro-cards.js` carries the version. Commit: `Release <x.y.z>`.
5. `git tag v<x.y.z> && git push && git push --tags`. `.github/workflows/release.yml` builds, creates the GitHub release with generated notes and attaches `pro-cards.js`. HACS reads releases, so users see the update within a day.
6. Verify: the release page shows the asset; the docs workflow deployed (`v<x.y.z>` appears in the site's nav).

## Beta releases

For a change worth testing in real dashboards before the stable release (breaking defaults, new actions), cut a pre-release first:

1. `npm version <x.y.z>-beta.1 --no-git-tag-version`; the changelog section is `## <x.y.z> (beta)` and keeps growing until the stable release renames it.
2. `npm run build`, commit `Release <x.y.z>-beta.1`, tag `v<x.y.z>-beta.1` and push the tag. The workflow marks any tag with a `-` as a pre-release, so HACS shows it only to users who turned on **Show beta versions** for Pro Cards.
3. Fixes go into `-beta.2`, `-beta.3` …; the stable `v<x.y.z>` tag follows the normal steps above. Never re-tag a beta.

Use `/Library/Developer/CommandLineTools/usr/bin/git` on this machine if `git` complains about the Xcode licence.
