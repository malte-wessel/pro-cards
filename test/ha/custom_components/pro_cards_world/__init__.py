"""The docs' demo home as real entities, for the dev Home Assistant (`npm run ha`).

`scripts/ha-world.ts` writes the world to test/world/world.json: every entity with its state and
attributes, the weather's forecasts, the energy meters' hourly readings and the camera's picture.
This integration makes an entity of each (entities.py), answers their services by changing their
state, lets the numeric sensors drift as on the docs site, counts the meters on by their readings
and imports the meters' past hours as long-term statistics, so the energy flow card has periods.
"""

from __future__ import annotations

import json
import logging

from homeassistant.components.recorder import get_instance
from homeassistant.components.recorder.db_schema import StatisticsShortTerm
from homeassistant.components.recorder.models import StatisticMeanType, StatisticMetaData
from homeassistant.components.recorder.statistics import async_import_statistics
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.discovery import async_load_platform
from homeassistant.helpers.typing import ConfigType
from homeassistant.util import dt as dt_util

from .meters import meter_statistics

DOMAIN = "pro_cards_world"
_LOGGER = logging.getLogger(__name__)

PLATFORMS = [
    Platform.ALARM_CONTROL_PANEL,
    Platform.BINARY_SENSOR,
    Platform.BUTTON,
    Platform.CAMERA,
    Platform.CLIMATE,
    Platform.COVER,
    Platform.DATE,
    Platform.DEVICE_TRACKER,
    Platform.FAN,
    Platform.HUMIDIFIER,
    Platform.LAWN_MOWER,
    Platform.LIGHT,
    Platform.LOCK,
    Platform.MEDIA_PLAYER,
    Platform.NUMBER,
    Platform.SELECT,
    Platform.SENSOR,
    Platform.SWITCH,
    Platform.UPDATE,
    Platform.VACUUM,
    Platform.VALVE,
    Platform.WATER_HEATER,
    Platform.WEATHER,
]


def _load(path: str) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Load the world and set up an entity platform per domain."""
    world = await hass.async_add_executor_job(_load, hass.config.path("test/world/world.json"))
    hass.data[DOMAIN] = world
    for platform in PLATFORMS:
        hass.async_create_task(
            async_load_platform(hass, platform, DOMAIN, {}, config), eager_start=True
        )
    _import_statistics(hass, world)
    return True


def _import_statistics(hass: HomeAssistant, world: dict) -> None:
    """The meters' compiled hours up to the last full one, as the recorder would have them, and
    their last five minutes, which the recorder's own statistics count on from (meters.py)."""
    now = dt_util.utcnow().timestamp()
    decimals = {item["id"]: item.get("decimals") for item in world["entities"]}
    for statistic_id, meter in world["meters"].items():
        hours, short = meter_statistics(world, meter, now, decimals.get(statistic_id))
        metadata: StatisticMetaData = {
            "mean_type": StatisticMeanType.NONE,
            "has_sum": True,
            "name": meter["name"],
            "source": "recorder",
            "statistic_id": statistic_id,
            "unit_class": "energy",
            "unit_of_measurement": meter["unit"],
        }
        async_import_statistics(hass, metadata, hours)
        # Home Assistant's public import takes hours only; the recorder's own takes either table
        get_instance(hass).async_import_statistics(metadata, [short], StatisticsShortTerm)
    _LOGGER.info("imported the statistics of %d meters", len(world["meters"]))
