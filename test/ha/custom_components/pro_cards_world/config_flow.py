"""One entry for the demo world, made on start (__init__.py): devices need a config entry."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult

from . import DOMAIN


class WorldFlow(ConfigFlow, domain=DOMAIN):
    """The world's entry, imported from configuration.yaml."""

    VERSION = 1

    async def async_step_import(self, _data: dict[str, Any]) -> ConfigFlowResult:
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        return self.async_create_entry(title="Pro Cards demo world", data={})
