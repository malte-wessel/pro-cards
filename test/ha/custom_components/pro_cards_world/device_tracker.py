"""The demo world's trackers, one per person too, through the legacy scanner."""

from homeassistant.core import HomeAssistant

from .entities import setup_trackers


async def async_setup_scanner(hass: HomeAssistant, config, async_see, discovery_info=None) -> bool:
    """See every tracker once, at its state."""
    if discovery_info is None:
        return False
    await setup_trackers(hass, async_see)
    return True
