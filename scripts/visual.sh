#!/bin/sh
# Runs the visual regression suite inside the official Playwright image so baselines are always
# rendered on the same Linux font stack, locally and in CI. Extra args go to `playwright test`
# (e.g. --update-snapshots). VISUAL_THEMES=dark draws one theme only (a quick look while working);
# CI is passed on only when it is set, so a local run fails a changed snapshot once, without the
# retry CI makes.
set -e
IMAGE="mcr.microsoft.com/playwright:v1.63.0-noble"
if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Start Docker Desktop and retry (visual tests need the Playwright image)." >&2
  exit 2
fi
# node_modules lives in a volume: installed again only when the lockfile changed
exec docker run --rm -t \
  -v "$PWD":/work -w /work \
  -v pro-cards-node-modules:/work/node_modules \
  ${CI:+-e CI=1} \
  ${VISUAL_THEMES:+-e VISUAL_THEMES="$VISUAL_THEMES"} \
  "$IMAGE" sh -c '
    lock=$(sha1sum package-lock.json | cut -d" " -f1)
    if [ "$(cat node_modules/.lock-sha 2>/dev/null)" != "$lock" ]; then
      npm ci --no-audit --no-fund >/dev/null && echo "$lock" > node_modules/.lock-sha
    fi
    npx playwright test --project=visual "$@"' visual "$@"
