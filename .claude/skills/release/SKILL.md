---
name: release
description: Cut a Pro Cards release: version bump, changelog, bundle, tag; the GitHub workflow attaches the bundle and HACS picks it up.
---

# Release

Preconditions: `main` is clean, `npm run check` passes, visual suite passed for the last rendered change, the GitHub remote exists.

1. Decide the version (semver: options added → minor, behaviour of existing YAML changed → major, fixes → patch).
2. `npm version <x.y.z> --no-git-tag-version` (updates `package.json` and `package-lock.json`).
3. Move the `## Unreleased` items in `CHANGELOG.md` under `## <x.y.z> – <Title>` (a few words naming what the release is about) with today's date as `_YYYY-MM-DD_` on the next line. One short line per change a user would notice, the headline first; details belong on the card's docs page, not here. New cards and breaking changes are bold (`**New … card**`, `**Breaking:**`). The docs site splits the file into pages by its `## ` headings (`docs/changelog/[page].paths.ts`).
4. `npm run build` – the banner in `dist/pro-cards.js` carries the version. Commit: `Release <x.y.z>`.
5. `git tag v<x.y.z> && git push && git push --tags`. `.github/workflows/release.yml` builds, creates the GitHub release with generated notes and attaches `pro-cards.js`. HACS reads releases, so users see the update within a day.
6. Verify: the release page shows the asset; the docs workflow deployed (`v<x.y.z>` appears in the site's nav).

## Beta releases

For a change worth testing in real dashboards before the stable release (breaking defaults, new actions), cut pre-releases first. Betas live on a branch of their own, `v<x.y.z>-beta`, so `main` and the docs site (deployed on every push to `main`, `.github/workflows/docs.yml`) stay at the last stable release until the stable one ships:

1. Create the branch from `main` once: `git push origin main:refs/heads/v<x.y.z>-beta`. The version's PRs target it (`gh pr create --base v<x.y.z>-beta`, or `gh pr edit <n> --base v<x.y.z>-beta`), and its fixes land there too. A fix on `main` meanwhile is merged into the beta branch as well.
2. On the beta branch: `npm version <x.y.z>-beta.<n> --no-git-tag-version`; the changelog section is `## <x.y.z> – <Title>` with `_Beta_` in place of the date and keeps growing until the stable release renames it.
3. `npm run build`, commit `Release <x.y.z>-beta.<n>`, tag `v<x.y.z>-beta.<n>`, push the branch and the tag. The release workflow runs on the tag whatever its branch and marks any tag with a `-` as a pre-release, so HACS shows it only to users who turned on **Show beta versions** for Pro Cards. Nothing deploys the docs. Never re-tag a beta.
4. The stable release: merge the beta branch into `main` (a merge commit, so the betas' tags stay in `main`'s history), then follow the normal steps above on `main`; that push deploys the version's docs. Delete the beta branch afterwards.

Use `/Library/Developer/CommandLineTools/usr/bin/git` on this machine if `git` complains about the Xcode licence.
