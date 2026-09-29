#!/bin/sh
# Runs the visual regression suite inside the official Playwright image so baselines are always
# rendered on the same Linux font stack, locally and in CI. Extra args go to `playwright test`
# (e.g. --update-snapshots).
set -e
IMAGE="mcr.microsoft.com/playwright:v1.63.0-noble"
if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Start Docker Desktop and retry (visual tests need the Playwright image)." >&2
  exit 2
fi
exec docker run --rm -t \
  -v "$PWD":/work -w /work \
  -v pro-cards-node-modules:/work/node_modules \
  -e CI=1 \
  "$IMAGE" sh -c "npm ci --no-audit --no-fund >/dev/null && npx playwright test --project=visual $*"
