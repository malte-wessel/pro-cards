"""The demo world's entities: one class per domain over a common base.

An entity starts from its state and attributes in world.json. The attributes a domain's own
properties draw (a light's brightness, a cover's position …) are read from there; the rest pass
through as they are (`extra_state_attributes`), so the cards see what the docs site has. A service
changes the state and attributes the way the device would.
"""

from __future__ import annotations

import base64
import random
from datetime import UTC, date, datetime, timedelta
from typing import Any

from homeassistant.components.alarm_control_panel import (
    AlarmControlPanelEntity,
    AlarmControlPanelEntityFeature,
    AlarmControlPanelState,
)
from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.components.button import ButtonEntity
from homeassistant.components.camera import Camera
from homeassistant.components.climate import (
    ATTR_HVAC_MODE,
    ClimateEntity,
    ClimateEntityFeature,
    HVACAction,
    HVACMode,
)
from homeassistant.components.cover import ATTR_POSITION, ATTR_TILT_POSITION, CoverEntity, CoverEntityFeature
from homeassistant.components.device_tracker import SourceType
from homeassistant.components.fan import FanEntity, FanEntityFeature
from homeassistant.components.lawn_mower import (
    LawnMowerActivity,
    LawnMowerEntity,
    LawnMowerEntityFeature,
)
from homeassistant.components.date import DateEntity
from homeassistant.components.humidifier import HumidifierEntity, HumidifierEntityFeature
from homeassistant.components.light import (
    ATTR_BRIGHTNESS,
    ATTR_COLOR_TEMP_KELVIN,
    ATTR_EFFECT,
    ATTR_HS_COLOR,
    ColorMode,
    LightEntity,
    LightEntityFeature,
)
from homeassistant.components.lock import LockEntity
from homeassistant.components.media_player import (
    MediaPlayerEntity,
    MediaPlayerEntityFeature,
    MediaPlayerState,
    MediaType,
)
from homeassistant.components.number import NumberEntity
from homeassistant.components.select import SelectEntity
from homeassistant.components.sensor import SensorEntity
from homeassistant.components.switch import SwitchEntity
from homeassistant.components.update import UpdateEntity, UpdateEntityFeature
from homeassistant.components.valve import ValveEntity, ValveEntityFeature
from homeassistant.components.water_heater import WaterHeaterEntity, WaterHeaterEntityFeature
from homeassistant.components.vacuum import StateVacuumEntity, VacuumActivity, VacuumEntityFeature
from homeassistant.components.weather import Forecast, WeatherEntity, WeatherEntityFeature
from homeassistant.const import ATTR_TEMPERATURE, UnitOfTemperature
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import Entity
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.util import dt as dt_util

from . import DOMAIN
from .meters import reading_at

HOUR = 3600
# set through the entity's own properties, never passed through
OWN = {
    "friendly_name",
    "icon",
    "entity_picture",
    "supported_features",
    "device_class",
    "unit_of_measurement",
    "state_class",
}


def _enum(cls, value, default=None):
    try:
        return cls(value)
    except ValueError:
        return default


def _iso(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


class World(Entity):
    """An entity of the demo world: its state, its attributes, a change written at once."""

    _attr_should_poll = False
    _attr_has_entity_name = False
    # the attributes the domain's properties draw
    own: frozenset[str] = frozenset()

    def __init__(self, item: dict, world: dict) -> None:
        super().__init__()
        a = dict(item["attributes"])
        self.entity_id = item["id"]
        self._attr_unique_id = f"pro_cards_world_{item['id']}"
        self._attr_name = a.get("friendly_name")
        self._attr_icon = a.get("icon")
        self._attr_device_class = a.get("device_class")
        self._attr_available = item["state"] != "unavailable"
        self._value: Any = item["state"]
        self._a = a
        self._world = world

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        skip = OWN | self.own
        return {k: v for k, v in self._a.items() if k not in skip} or None

    def _set(self, value: Any = None, **attrs: Any) -> None:
        if value is not None:
            self._value = value
        self._a.update(attrs)
        self.async_write_ha_state()


class WorldSensor(World, SensorEntity):
    """A sensor; a numeric one drifts within its band, an energy meter counts on."""

    def __init__(self, item: dict, world: dict) -> None:
        super().__init__(item, world)
        self._attr_native_unit_of_measurement = self._a.get("unit_of_measurement")
        self._attr_state_class = self._a.get("state_class")
        self._noise = item.get("noise")
        self._min, self._max = item.get("min"), item.get("max")
        self._decimals = item.get("decimals")
        self._meter = world["meters"].get(item["id"])
        # a time the world gave relative to when it was written moves with it
        self._shift = timedelta(seconds=dt_util.utcnow().timestamp() - world["generated"] / 1000)
        if self._meter:
            self.drift()

    @property
    def native_value(self) -> Any:
        v = self._value
        if self._attr_device_class == "timestamp":
            return _iso(v) + self._shift if isinstance(v, str) else None
        try:
            return float(v)
        except (TypeError, ValueError):
            return v

    def drift(self, write: bool = False) -> None:
        if self._meter:
            now = dt_util.utcnow().timestamp()
            self._value = reading_at(self._world, self._meter, now, self._decimals)
        elif self._noise and random.random() < 0.25 and isinstance(self.native_value, float):
            v = self.native_value + (random.random() - 0.5) * self._noise
            if self._min is not None:
                v = max(self._min, v)
            if self._max is not None:
                v = min(self._max, v)
            self._value = round(v, 1 if self._decimals is None else self._decimals)
        else:
            return
        if write:
            self.async_write_ha_state()


class WorldBinarySensor(World, BinarySensorEntity):
    @property
    def is_on(self) -> bool:
        return self._value == "on"


class WorldSwitch(World, SwitchEntity):
    @property
    def is_on(self) -> bool:
        return self._value == "on"

    async def async_turn_on(self, **kwargs: Any) -> None:
        self._set("on")

    async def async_turn_off(self, **kwargs: Any) -> None:
        self._set("off")


class WorldLight(World, LightEntity):
    own = frozenset(
        {
            "brightness",
            "color_mode",
            "hs_color",
            "rgb_color",
            "xy_color",
            "supported_color_modes",
            "color_temp_kelvin",
            "min_color_temp_kelvin",
            "max_color_temp_kelvin",
            "effect_list",
            "effect",
        }
    )

    def __init__(self, item: dict, world: dict) -> None:
        super().__init__(item, world)
        modes = self._a.get("supported_color_modes") or ["onoff"]
        self._attr_supported_color_modes = {ColorMode(m) for m in modes}
        self._mode = ColorMode(self._a.get("color_mode") or modes[0])
        self._attr_min_color_temp_kelvin = self._a.get("min_color_temp_kelvin", 2000)
        self._attr_max_color_temp_kelvin = self._a.get("max_color_temp_kelvin", 6500)
        self._attr_effect_list = self._a.get("effect_list")
        if self._attr_effect_list:
            self._attr_supported_features = LightEntityFeature.EFFECT

    @property
    def color_temp_kelvin(self) -> int | None:
        return self._a.get("color_temp_kelvin")

    @property
    def effect(self) -> str | None:
        return self._a.get("effect")

    @property
    def is_on(self) -> bool:
        return self._value == "on"

    @property
    def color_mode(self) -> ColorMode:
        return self._mode

    @property
    def brightness(self) -> int | None:
        return None if self._mode == ColorMode.ONOFF else self._a.get("brightness", 255)

    @property
    def hs_color(self) -> tuple[float, float] | None:
        hs = self._a.get("hs_color")
        return tuple(hs) if hs else None

    async def async_turn_on(self, **kwargs: Any) -> None:
        changes = {}
        if ATTR_BRIGHTNESS in kwargs:
            changes["brightness"] = kwargs[ATTR_BRIGHTNESS]
        if ATTR_HS_COLOR in kwargs:
            changes["hs_color"] = list(kwargs[ATTR_HS_COLOR])
            self._mode = ColorMode.HS
        if ATTR_COLOR_TEMP_KELVIN in kwargs:
            changes["color_temp_kelvin"] = kwargs[ATTR_COLOR_TEMP_KELVIN]
            self._mode = ColorMode.COLOR_TEMP
        if ATTR_EFFECT in kwargs:
            changes["effect"] = kwargs[ATTR_EFFECT]
        self._set("on", **changes)

    async def async_turn_off(self, **kwargs: Any) -> None:
        self._set("off")


class WorldCover(World, CoverEntity):
    own = frozenset({"current_position", "current_tilt_position"})

    def __init__(self, item: dict, world: dict) -> None:
        super().__init__(item, world)
        f = CoverEntityFeature.OPEN | CoverEntityFeature.CLOSE | CoverEntityFeature.STOP
        if "current_position" in self._a:
            f |= CoverEntityFeature.SET_POSITION
        if "current_tilt_position" in self._a:
            f |= (
                CoverEntityFeature.OPEN_TILT
                | CoverEntityFeature.CLOSE_TILT
                | CoverEntityFeature.STOP_TILT
                | CoverEntityFeature.SET_TILT_POSITION
            )
        self._attr_supported_features = f

    @property
    def current_cover_position(self) -> int | None:
        return self._a.get("current_position")

    @property
    def current_cover_tilt_position(self) -> int | None:
        return self._a.get("current_tilt_position")

    @property
    def is_closed(self) -> bool | None:
        return self._value == "closed" if self._value in ("open", "closed") else None

    @property
    def is_opening(self) -> bool:
        return self._value == "opening"

    @property
    def is_closing(self) -> bool:
        return self._value == "closing"

    def _position(self, value: str, position: int) -> None:
        if "current_position" in self._a:
            self._set(value, current_position=position)
        else:
            self._set(value)

    async def async_open_cover(self, **kwargs: Any) -> None:
        self._position("open", 100)

    async def async_close_cover(self, **kwargs: Any) -> None:
        self._position("closed", 0)

    async def async_set_cover_position(self, **kwargs: Any) -> None:
        p = kwargs[ATTR_POSITION]
        self._position("open" if p > 0 else "closed", p)

    async def async_stop_cover(self, **kwargs: Any) -> None:
        if self._value in ("opening", "closing"):
            self._set("open")

    async def async_open_cover_tilt(self, **kwargs: Any) -> None:
        self._set(current_tilt_position=100)

    async def async_close_cover_tilt(self, **kwargs: Any) -> None:
        self._set(current_tilt_position=0)

    async def async_set_cover_tilt_position(self, **kwargs: Any) -> None:
        self._set(current_tilt_position=kwargs[ATTR_TILT_POSITION])

    async def async_stop_cover_tilt(self, **kwargs: Any) -> None:
        return


class WorldClimate(World, ClimateEntity):
    own = frozenset(
        {
            "temperature",
            "current_temperature",
            "hvac_action",
            "hvac_modes",
            "min_temp",
            "max_temp",
            "target_temp_step",
            "preset_modes",
            "preset_mode",
            "fan_modes",
            "fan_mode",
            "swing_modes",
            "swing_mode",
        }
    )
    _attr_temperature_unit = UnitOfTemperature.CELSIUS

    def __init__(self, item: dict, world: dict) -> None:
        super().__init__(item, world)
        f = (
            ClimateEntityFeature.TARGET_TEMPERATURE
            | ClimateEntityFeature.TURN_ON
            | ClimateEntityFeature.TURN_OFF
        )
        if self._a.get("preset_modes"):
            f |= ClimateEntityFeature.PRESET_MODE
        if self._a.get("fan_modes"):
            f |= ClimateEntityFeature.FAN_MODE
        if self._a.get("swing_modes"):
            f |= ClimateEntityFeature.SWING_MODE
        self._attr_supported_features = f
        self._attr_fan_modes = self._a.get("fan_modes")
        self._attr_swing_modes = self._a.get("swing_modes")
        self._attr_hvac_modes = [HVACMode(m) for m in self._a.get("hvac_modes") or ["off"]]
        self._attr_preset_modes = self._a.get("preset_modes")
        for key, attr in (
            ("min_temp", "_attr_min_temp"),
            ("max_temp", "_attr_max_temp"),
            ("target_temp_step", "_attr_target_temperature_step"),
        ):
            if key in self._a:
                setattr(self, attr, self._a[key])

    @property
    def hvac_mode(self) -> HVACMode | None:
        return _enum(HVACMode, self._value)

    @property
    def hvac_action(self) -> HVACAction | None:
        return _enum(HVACAction, self._a.get("hvac_action"))

    @property
    def current_temperature(self) -> float | None:
        return self._a.get("current_temperature")

    @property
    def target_temperature(self) -> float | None:
        return self._a.get("temperature")

    @property
    def preset_mode(self) -> str | None:
        return self._a.get("preset_mode")

    def _action(self, mode: str, target: float | None) -> str:
        current = self.current_temperature
        if mode == "off" or current is None or target is None:
            return "off" if mode == "off" else "idle"
        if mode in ("heat", "auto") and current < target:
            return "heating"
        if mode in ("cool", "auto") and current > target:
            return "cooling"
        return "idle"

    async def async_set_temperature(self, **kwargs: Any) -> None:
        mode = kwargs.get(ATTR_HVAC_MODE, self._value)
        target = kwargs.get(ATTR_TEMPERATURE, self.target_temperature)
        self._set(str(mode), temperature=target, hvac_action=self._action(str(mode), target))

    async def async_set_hvac_mode(self, hvac_mode: HVACMode) -> None:
        self._set(str(hvac_mode), hvac_action=self._action(str(hvac_mode), self.target_temperature))

    async def async_set_preset_mode(self, preset_mode: str) -> None:
        self._set(preset_mode=preset_mode)

    @property
    def fan_mode(self) -> str | None:
        return self._a.get("fan_mode")

    @property
    def swing_mode(self) -> str | None:
        return self._a.get("swing_mode")

    async def async_set_fan_mode(self, fan_mode: str) -> None:
        self._set(fan_mode=fan_mode)

    async def async_set_swing_mode(self, swing_mode: str) -> None:
        self._set(swing_mode=swing_mode)

    async def async_turn_on(self) -> None:
        on = next((m for m in self._attr_hvac_modes if m != HVACMode.OFF), HVACMode.OFF)
        await self.async_set_hvac_mode(on)

    async def async_turn_off(self) -> None:
        await self.async_set_hvac_mode(HVACMode.OFF)


class WorldFan(World, FanEntity):
    own = frozenset(
        {"percentage", "percentage_step", "preset_modes", "preset_mode", "oscillating", "direction"}
    )

    def __init__(self, item: dict, world: dict) -> None:
        super().__init__(item, world)
        f = FanEntityFeature.TURN_ON | FanEntityFeature.TURN_OFF
        if "percentage" in self._a:
            f |= FanEntityFeature.SET_SPEED
        if self._a.get("preset_modes"):
            f |= FanEntityFeature.PRESET_MODE
        if "oscillating" in self._a:
            f |= FanEntityFeature.OSCILLATE
        if "direction" in self._a:
            f |= FanEntityFeature.DIRECTION
        self._attr_supported_features = f
        self._attr_preset_modes = self._a.get("preset_modes")
        step = self._a.get("percentage_step")
        self._attr_speed_count = round(100 / step) if step else 100
        self._last = self._a.get("percentage") or (step or 100)

    @property
    def is_on(self) -> bool:
        return self._value == "on"

    @property
    def percentage(self) -> int | None:
        return self._a.get("percentage") if "percentage" in self._a else None

    @property
    def preset_mode(self) -> str | None:
        return self._a.get("preset_mode")

    async def async_turn_on(
        self, percentage: int | None = None, preset_mode: str | None = None, **kwargs: Any
    ) -> None:
        changes: dict[str, Any] = {}
        if "percentage" in self._a:
            changes["percentage"] = percentage or self._last
        if preset_mode is not None:
            changes["preset_mode"] = preset_mode
        self._set("on", **changes)

    async def async_turn_off(self, **kwargs: Any) -> None:
        if self._a.get("percentage"):
            self._last = self._a["percentage"]
        self._set("off", **({"percentage": 0} if "percentage" in self._a else {}))

    async def async_set_percentage(self, percentage: int) -> None:
        if percentage:
            self._last = percentage
        self._set("on" if percentage else "off", percentage=percentage)

    async def async_set_preset_mode(self, preset_mode: str) -> None:
        self._set("on", preset_mode=preset_mode)

    @property
    def oscillating(self) -> bool | None:
        return self._a.get("oscillating")

    @property
    def current_direction(self) -> str | None:
        return self._a.get("direction")

    async def async_oscillate(self, oscillating: bool) -> None:
        self._set(oscillating=oscillating)

    async def async_set_direction(self, direction: str) -> None:
        self._set(direction=direction)


class WorldLock(World, LockEntity):
    @property
    def is_locked(self) -> bool:
        return self._value == "locked"

    @property
    def is_jammed(self) -> bool:
        return self._value == "jammed"

    @property
    def is_open(self) -> bool:
        return self._value == "open"

    @property
    def is_locking(self) -> bool:
        return self._value == "locking"

    @property
    def is_unlocking(self) -> bool:
        return self._value == "unlocking"

    async def async_lock(self, **kwargs: Any) -> None:
        self._set("locked")

    async def async_unlock(self, **kwargs: Any) -> None:
        self._set("unlocked")


class WorldAlarm(World, AlarmControlPanelEntity):
    own = frozenset({"code_arm_required", "code_format", "changed_by"})
    _attr_code_arm_required = False

    def __init__(self, item: dict, world: dict) -> None:
        super().__init__(item, world)
        self._attr_supported_features = AlarmControlPanelEntityFeature(
            self._a.get("supported_features", 3)
        )

    @property
    def alarm_state(self) -> AlarmControlPanelState | None:
        return _enum(AlarmControlPanelState, self._value)

    async def async_alarm_disarm(self, code: str | None = None) -> None:
        self._set("disarmed")

    async def async_alarm_arm_home(self, code: str | None = None) -> None:
        self._set("armed_home")

    async def async_alarm_arm_away(self, code: str | None = None) -> None:
        self._set("armed_away")

    async def async_alarm_arm_night(self, code: str | None = None) -> None:
        self._set("armed_night")

    async def async_alarm_trigger(self, code: str | None = None) -> None:
        self._set("triggered")


class WorldCamera(World, Camera):
    """A camera whose every frame is the world's snapshot."""

    def __init__(self, item: dict, world: dict) -> None:
        super().__init__(item, world)
        self._image = base64.b64decode(world["cameras"].get(item["id"], ""))

    async def async_camera_image(
        self, width: int | None = None, height: int | None = None
    ) -> bytes | None:
        return self._image or None


class WorldMediaPlayer(World, MediaPlayerEntity):
    own = frozenset(
        {
            "volume_level",
            "is_volume_muted",
            "media_title",
            "media_artist",
            "media_duration",
            "media_position",
            "media_position_updated_at",
            "app_name",
            "source_list",
            "source",
            "sound_mode_list",
            "sound_mode",
        }
    )
    _attr_supported_features = (
        MediaPlayerEntityFeature.PLAY
        | MediaPlayerEntityFeature.PAUSE
        | MediaPlayerEntityFeature.STOP
        | MediaPlayerEntityFeature.NEXT_TRACK
        | MediaPlayerEntityFeature.PREVIOUS_TRACK
        | MediaPlayerEntityFeature.SEEK
        | MediaPlayerEntityFeature.VOLUME_SET
        | MediaPlayerEntityFeature.VOLUME_STEP
        | MediaPlayerEntityFeature.VOLUME_MUTE
        | MediaPlayerEntityFeature.TURN_ON
        | MediaPlayerEntityFeature.TURN_OFF
    )
    _attr_media_image_remotely_accessible = True

    def __init__(self, item: dict, world: dict) -> None:
        super().__init__(item, world)
        self._updated = dt_util.utcnow()
        f = type(self)._attr_supported_features
        if self._a.get("source_list"):
            f |= MediaPlayerEntityFeature.SELECT_SOURCE
        if self._a.get("sound_mode_list"):
            f |= MediaPlayerEntityFeature.SELECT_SOUND_MODE
        self._attr_supported_features = f
        self._attr_source_list = self._a.get("source_list")
        self._attr_sound_mode_list = self._a.get("sound_mode_list")

    @property
    def source(self) -> str | None:
        return self._a.get("source")

    @property
    def sound_mode(self) -> str | None:
        return self._a.get("sound_mode")

    async def async_select_source(self, source: str) -> None:
        self._set(source=source)

    async def async_select_sound_mode(self, sound_mode: str) -> None:
        self._set(sound_mode=sound_mode)

    @property
    def state(self) -> MediaPlayerState | None:
        return _enum(MediaPlayerState, self._value)

    @property
    def volume_level(self) -> float | None:
        return self._a.get("volume_level")

    @property
    def is_volume_muted(self) -> bool | None:
        return self._a.get("is_volume_muted", False)

    @property
    def media_content_type(self) -> MediaType | None:
        return MediaType.MUSIC if self._a.get("media_title") else None

    @property
    def media_title(self) -> str | None:
        return self._a.get("media_title")

    @property
    def media_artist(self) -> str | None:
        return self._a.get("media_artist")

    @property
    def media_duration(self) -> int | None:
        return self._a.get("media_duration")

    @property
    def media_position(self) -> int | None:
        return self._a.get("media_position")

    @property
    def media_position_updated_at(self) -> datetime | None:
        return self._updated if "media_position" in self._a else None

    @property
    def media_image_url(self) -> str | None:
        return self._a.get("entity_picture")

    @property
    def app_name(self) -> str | None:
        return self._a.get("app_name")

    def _now_at(self) -> int | None:
        """The position now: it runs on while playing."""
        p = self.media_position
        if p is None or self._value != "playing":
            return p
        p += int((dt_util.utcnow() - self._updated).total_seconds())
        return min(p, self.media_duration or p)

    def _play(self, value: str, position: int | None = None) -> None:
        p = self._now_at() if position is None else position
        self._updated = dt_util.utcnow()
        self._set(value, **({"media_position": p} if p is not None else {}))

    async def async_media_play(self) -> None:
        self._play("playing")

    async def async_media_pause(self) -> None:
        self._play("paused")

    async def async_media_stop(self) -> None:
        self._play("idle", 0)

    async def async_media_next_track(self) -> None:
        self._play(self._value, 0)

    async def async_media_previous_track(self) -> None:
        self._play(self._value, 0)

    async def async_media_seek(self, position: float) -> None:
        self._play(self._value, int(position))

    async def async_set_volume_level(self, volume: float) -> None:
        self._set(volume_level=volume)

    async def async_mute_volume(self, mute: bool) -> None:
        self._set(is_volume_muted=mute)

    async def async_turn_on(self) -> None:
        self._play("idle")

    async def async_turn_off(self) -> None:
        self._play("off")


class WorldVacuum(World, StateVacuumEntity):
    own = frozenset({"fan_speed_list", "fan_speed"})
    _attr_supported_features = (
        VacuumEntityFeature.START
        | VacuumEntityFeature.PAUSE
        | VacuumEntityFeature.STOP
        | VacuumEntityFeature.RETURN_HOME
        | VacuumEntityFeature.STATE
        | VacuumEntityFeature.LOCATE
        | VacuumEntityFeature.CLEAN_SPOT
        | VacuumEntityFeature.FAN_SPEED
    )

    def __init__(self, item: dict, world: dict) -> None:
        super().__init__(item, world)
        self._attr_fan_speed_list = self._a.get("fan_speed_list") or []

    @property
    def fan_speed(self) -> str | None:
        return self._a.get("fan_speed")

    async def async_set_fan_speed(self, fan_speed: str, **kwargs: Any) -> None:
        self._set(fan_speed=fan_speed)

    async def async_locate(self, **kwargs: Any) -> None:
        return None

    async def async_clean_spot(self, **kwargs: Any) -> None:
        self._set("cleaning", status="Spot cleaning")

    @property
    def activity(self) -> VacuumActivity | None:
        return _enum(VacuumActivity, self._value)

    async def async_start(self) -> None:
        self._set("cleaning", status="Cleaning")

    async def async_pause(self) -> None:
        self._set("paused", status="Paused")

    async def async_stop(self, **kwargs: Any) -> None:
        self._set("idle", status="Idle")

    async def async_return_to_base(self, **kwargs: Any) -> None:
        self._set("returning", status="Returning")


class WorldLawnMower(World, LawnMowerEntity):
    _attr_supported_features = (
        LawnMowerEntityFeature.START_MOWING
        | LawnMowerEntityFeature.PAUSE
        | LawnMowerEntityFeature.DOCK
    )

    @property
    def activity(self) -> LawnMowerActivity | None:
        return _enum(LawnMowerActivity, self._value)

    async def async_start_mowing(self) -> None:
        self._set("mowing")

    async def async_pause(self) -> None:
        self._set("paused")

    async def async_dock(self) -> None:
        self._set("returning")


class WorldNumber(World, NumberEntity):
    own = frozenset({"min", "max", "step", "mode"})

    def __init__(self, item: dict, world: dict) -> None:
        super().__init__(item, world)
        self._attr_native_min_value = self._a.get("min", 0)
        self._attr_native_max_value = self._a.get("max", 100)
        self._attr_native_step = self._a.get("step", 1)
        self._attr_native_unit_of_measurement = self._a.get("unit_of_measurement")

    @property
    def native_value(self) -> float | None:
        try:
            return float(self._value)
        except (TypeError, ValueError):
            return None

    async def async_set_native_value(self, value: float) -> None:
        self._set(value)


class WorldSelect(World, SelectEntity):
    own = frozenset({"options"})

    def __init__(self, item: dict, world: dict) -> None:
        super().__init__(item, world)
        self._attr_options = self._a.get("options") or []

    @property
    def current_option(self) -> str | None:
        return self._value if self._value in self._attr_options else None

    async def async_select_option(self, option: str) -> None:
        self._set(option)


class WorldButton(World, ButtonEntity):
    async def async_press(self) -> None:
        return


class WorldWeather(World, WeatherEntity):
    """The weather with its forecasts, moved on to the hour and the day it is now."""

    own = frozenset(
        {
            "temperature",
            "temperature_unit",
            "apparent_temperature",
            "dew_point",
            "humidity",
            "pressure",
            "pressure_unit",
            "wind_speed",
            "wind_speed_unit",
            "wind_bearing",
            "wind_gust_speed",
            "cloud_coverage",
            "uv_index",
            "visibility",
            "visibility_unit",
            "precipitation_unit",
            "attribution",
        }
    )

    def __init__(self, item: dict, world: dict) -> None:
        super().__init__(item, world)
        a = self._a
        self._forecasts = world["forecasts"].get(item["id"], {})
        f = WeatherEntityFeature(0)
        if self._forecasts.get("daily"):
            f |= WeatherEntityFeature.FORECAST_DAILY
        if self._forecasts.get("hourly"):
            f |= WeatherEntityFeature.FORECAST_HOURLY
        self._attr_supported_features = f
        self._attr_attribution = a.get("attribution")
        self._attr_native_temperature_unit = a.get("temperature_unit")
        self._attr_native_pressure_unit = a.get("pressure_unit")
        self._attr_native_wind_speed_unit = a.get("wind_speed_unit")
        self._attr_native_visibility_unit = a.get("visibility_unit")
        self._attr_native_precipitation_unit = a.get("precipitation_unit")
        for key, attr in (
            ("temperature", "_attr_native_temperature"),
            ("apparent_temperature", "_attr_native_apparent_temperature"),
            ("dew_point", "_attr_native_dew_point"),
            ("humidity", "_attr_humidity"),
            ("pressure", "_attr_native_pressure"),
            ("wind_speed", "_attr_native_wind_speed"),
            ("wind_bearing", "_attr_wind_bearing"),
            ("wind_gust_speed", "_attr_native_wind_gust_speed"),
            ("cloud_coverage", "_attr_cloud_coverage"),
            ("uv_index", "_attr_uv_index"),
            ("visibility", "_attr_native_visibility"),
        ):
            setattr(self, attr, a.get(key))
        self._generated = world["generated"] / 1000

    @property
    def condition(self) -> str | None:
        return self._value

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()

        async def refresh(_now: datetime) -> None:
            await self.async_update_listeners(None)

        self.async_on_remove(
            async_track_time_interval(self.hass, refresh, timedelta(minutes=30))
        )

    def _shifted(self, kind: str, step: int) -> list[Forecast]:
        """The entries moved by whole steps (hours, days) since the world was written."""
        moved = int((dt_util.utcnow().timestamp() - self._generated) // step) * step
        start = dt_util.utcnow() - timedelta(seconds=step)
        out: list[Forecast] = []
        for e in self._forecasts.get(kind) or []:
            at = _iso(e["datetime"]) + timedelta(seconds=moved)
            if kind == "hourly" and at < start:
                continue
            out.append(
                Forecast(
                    datetime=at.astimezone(UTC).isoformat(),
                    condition=e.get("condition"),
                    native_temperature=e.get("temperature"),
                    native_templow=e.get("templow"),
                    native_precipitation=e.get("precipitation"),
                    precipitation_probability=e.get("precipitation_probability"),
                    humidity=e.get("humidity"),
                    native_wind_speed=e.get("wind_speed"),
                    wind_bearing=e.get("wind_bearing"),
                    cloud_coverage=e.get("cloud_coverage"),
                )
            )
        return out

    async def async_forecast_daily(self) -> list[Forecast] | None:
        return self._shifted("daily", 24 * HOUR)

    async def async_forecast_hourly(self) -> list[Forecast] | None:
        return self._shifted("hourly", HOUR)


class WorldHumidifier(World, HumidifierEntity):
    own = frozenset(
        {"humidity", "current_humidity", "min_humidity", "max_humidity", "available_modes", "mode"}
    )

    def __init__(self, item: dict, world: dict) -> None:
        super().__init__(item, world)
        self._attr_available_modes = self._a.get("available_modes")
        if self._attr_available_modes:
            self._attr_supported_features = HumidifierEntityFeature.MODES
        self._attr_min_humidity = self._a.get("min_humidity", 0)
        self._attr_max_humidity = self._a.get("max_humidity", 100)

    @property
    def is_on(self) -> bool:
        return self._value == "on"

    @property
    def target_humidity(self) -> float | None:
        return self._a.get("humidity")

    @property
    def current_humidity(self) -> float | None:
        return self._a.get("current_humidity")

    @property
    def mode(self) -> str | None:
        return self._a.get("mode")

    async def async_turn_on(self, **kwargs: Any) -> None:
        self._set("on")

    async def async_turn_off(self, **kwargs: Any) -> None:
        self._set("off")

    async def async_set_humidity(self, humidity: int) -> None:
        self._set(humidity=humidity)

    async def async_set_mode(self, mode: str) -> None:
        self._set(mode=mode)


class WorldWaterHeater(World, WaterHeaterEntity):
    own = frozenset(
        {"temperature", "current_temperature", "min_temp", "max_temp", "operation_list", "operation_mode"}
    )
    _attr_temperature_unit = UnitOfTemperature.CELSIUS
    _attr_supported_features = (
        WaterHeaterEntityFeature.TARGET_TEMPERATURE | WaterHeaterEntityFeature.OPERATION_MODE
    )

    def __init__(self, item: dict, world: dict) -> None:
        super().__init__(item, world)
        self._attr_operation_list = self._a.get("operation_list")
        self._attr_min_temp = self._a.get("min_temp", 40)
        self._attr_max_temp = self._a.get("max_temp", 65)

    @property
    def current_operation(self) -> str | None:
        return self._value

    @property
    def target_temperature(self) -> float | None:
        return self._a.get("temperature")

    @property
    def current_temperature(self) -> float | None:
        return self._a.get("current_temperature")

    async def async_set_temperature(self, **kwargs: Any) -> None:
        self._set(temperature=kwargs.get(ATTR_TEMPERATURE))

    async def async_set_operation_mode(self, operation_mode: str) -> None:
        self._set(operation_mode, operation_mode=operation_mode)


class WorldValve(World, ValveEntity):
    own = frozenset({"current_position"})
    _attr_reports_position = True

    def __init__(self, item: dict, world: dict) -> None:
        super().__init__(item, world)
        self._attr_supported_features = ValveEntityFeature(self._a.get("supported_features", 15))

    @property
    def current_valve_position(self) -> int | None:
        return self._a.get("current_position")

    async def async_open_valve(self) -> None:
        self._set("open", current_position=100)

    async def async_close_valve(self) -> None:
        self._set("closed", current_position=0)

    async def async_stop_valve(self) -> None:
        return None

    async def async_set_valve_position(self, position: int) -> None:
        self._set("open" if position else "closed", current_position=position)


class WorldUpdate(World, UpdateEntity):
    own = frozenset(
        {"installed_version", "latest_version", "title", "in_progress", "skipped_version"}
    )
    _attr_supported_features = UpdateEntityFeature.INSTALL

    @property
    def installed_version(self) -> str | None:
        return self._a.get("installed_version")

    @property
    def latest_version(self) -> str | None:
        return self._a.get("latest_version")

    @property
    def title(self) -> str | None:
        return self._a.get("title")

    async def async_install(self, version: str | None, backup: bool, **kwargs: Any) -> None:
        self._set(installed_version=self.latest_version)


class WorldDate(World, DateEntity):
    @property
    def native_value(self) -> date | None:
        try:
            return date.fromisoformat(str(self._value))
        except ValueError:
            return None

    async def async_set_value(self, value: date) -> None:
        self._set(value.isoformat())


CLASSES: dict[str, type[World]] = {
    "alarm_control_panel": WorldAlarm,
    "binary_sensor": WorldBinarySensor,
    "button": WorldButton,
    "camera": WorldCamera,
    "climate": WorldClimate,
    "cover": WorldCover,
    "date": WorldDate,
    "humidifier": WorldHumidifier,
    "fan": WorldFan,
    "lawn_mower": WorldLawnMower,
    "light": WorldLight,
    "lock": WorldLock,
    "media_player": WorldMediaPlayer,
    "number": WorldNumber,
    "select": WorldSelect,
    "sensor": WorldSensor,
    "switch": WorldSwitch,
    "update": WorldUpdate,
    "vacuum": WorldVacuum,
    "valve": WorldValve,
    "water_heater": WorldWaterHeater,
    "weather": WorldWeather,
}


def setup_for(domain: str):
    """The platform's setup: the world's entities of its domain."""

    async def async_setup_platform(
        hass: HomeAssistant,
        config: dict,
        async_add_entities: AddEntitiesCallback,
        discovery_info: dict | None = None,
    ) -> None:
        if discovery_info is None:
            return
        world = hass.data[DOMAIN]
        entities = [
            CLASSES[domain](item, world)
            for item in world["entities"]
            if item["id"].split(".")[0] == domain
        ]
        async_add_entities(entities)
        if domain == "sensor":
            # the drift of the docs site, slower: a recorder keeps every change
            async def tick(_now: datetime) -> None:
                for e in entities:
                    e.drift(write=True)

            async_track_time_interval(hass, tick, timedelta(seconds=60))

    return async_setup_platform


async def setup_trackers(hass: HomeAssistant, async_see) -> None:
    """The trackers (the world's, and one per person), through the legacy scanner."""
    world = hass.data[DOMAIN]
    items = [e for e in world["entities"] if e["id"].startswith("device_tracker.")]
    items += [
        {"id": p["id"], "state": p["state"], "attributes": {"friendly_name": p["name"]}}
        for p in world["people"]
    ]
    for item in items:
        await async_see(
            dev_id=item["id"].split(".", 1)[1],
            host_name=item["attributes"].get("friendly_name"),
            location_name=item["state"],
            source_type=SourceType.GPS,
        )
