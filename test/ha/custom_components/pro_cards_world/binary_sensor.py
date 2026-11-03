"""The demo world's binary sensor entities."""

from .entities import setup_for

async_setup_platform = setup_for("binary_sensor")
