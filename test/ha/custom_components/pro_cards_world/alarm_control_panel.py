"""The demo world's alarm control panel entities."""

from .entities import setup_for

async_setup_platform = setup_for("alarm_control_panel")
