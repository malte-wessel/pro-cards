#!/bin/sh
# Runs a real Home Assistant (official image, version from test/ha/.env) with the built bundle
# mounted: http://localhost:8123, user dev / dev, dashboard "Pro Cards". The config (`.storage`)
# lives in the Docker volume pro-cards-ha-config and survives restarts; `scripts/ha.sh reset`
# wipes it.
#   scripts/ha.sh         start (or restart) the container and run the first-time setup
#   scripts/ha.sh stop    remove the container
#   scripts/ha.sh reset   remove the container and its config volume
# Rebuild the bundle with `npm run watch` and reload the browser.
set -e
NAME=pro-cards-ha
VOLUME=pro-cards-ha-config
cd "$(dirname "$0")/.."
REQUESTED_VERSION="$HA_VERSION" # the command line wins over test/ha/.env
# shellcheck disable=SC1091
. ./test/ha/.env
HA_VERSION="${REQUESTED_VERSION:-${HA_VERSION:-stable}}"
case "$1" in
  stop)
    docker rm -f "$NAME" >/dev/null 2>&1 && echo "stopped" || echo "not running"; exit 0 ;;
  reset)
    docker rm -f "$NAME" >/dev/null 2>&1 || true
    docker volume rm "$VOLUME" >/dev/null 2>&1 && echo "config volume removed" || echo "no config volume"; exit 0 ;;
esac
if ! docker info >/dev/null 2>&1; then echo "Docker is not running." >&2; exit 2; fi
[ -f dist/pro-cards.js ] || npm run build >/dev/null
docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" -p 8123:8123 -e TZ=Europe/Berlin \
  -v "$VOLUME":/config \
  -v "$PWD/dist":/config/www/pro-cards:ro \
  -v "$PWD/test/ha":/config/test \
  -v "$PWD/test/ha/configuration.yaml":/config/configuration.yaml \
  "ghcr.io/home-assistant/home-assistant:$HA_VERSION" >/dev/null
echo "Home Assistant $HA_VERSION is starting…"
i=0
until curl -s -o /dev/null -w '%{http_code}' http://localhost:8123/api/ 2>/dev/null | grep -qE '^(401|200)$'; do
  i=$((i + 1))
  if [ "$i" -gt 120 ]; then echo "Home Assistant did not come up; 'docker logs $NAME' shows why." >&2; exit 1; fi
  sleep 2
done
HASS_USERNAME="$HASS_USERNAME" HASS_PASSWORD="$HASS_PASSWORD" node scripts/ha-setup.mjs
