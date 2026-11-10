"""The demo world's water heater entities."""

from .entities import setup_for

async_setup_platform = setup_for("water_heater")
