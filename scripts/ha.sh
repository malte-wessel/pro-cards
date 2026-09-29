#!/bin/sh
# Runs a real Home Assistant with the repository's dev config (the same image and mounts as
# .devcontainer/, without VS Code): http://localhost:8123, user dev / dev, dashboard "Pro Cards".
# `scripts/ha.sh stop` removes the container. Rebuild with `npm run watch` and reload the browser.
set -e
NAME=pro-cards-ha
if [ "$1" = "stop" ]; then docker rm -f "$NAME" >/dev/null 2>&1 && echo "stopped" || echo "not running"; exit 0; fi
if ! docker info >/dev/null 2>&1; then echo "Docker is not running." >&2; exit 2; fi
docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" --env-file test/ha/.env -p 8123:8123 \
  -v "$PWD":/config/www/workspace \
  -v "$PWD/test/ha":/config/test \
  -v "$PWD/test/ha/configuration.yaml":/config/configuration.yaml \
  --entrypoint bash thomasloven/hass-custom-devcontainer -c 'sudo --preserve-env=PATH -E container' >/dev/null
echo "Home Assistant is starting (a few minutes on Apple silicon: the image is amd64)."
echo "Open http://localhost:8123 and log in as dev / dev; 'docker logs -f $NAME' shows progress."
