# Energy Flow Card Pro

`custom:energy-flow-card-pro` shows where your energy came from and where it went over a period: today, yesterday, this week, this month or this year. It is the [power flow card](/cards/power-flow-card)'s tree (solar, battery and grid on the left, the home in the middle, rooms and devices on the right), drawn from energy meters instead of power sensors. The line above the tree names the period, what the grid imported and exported, and how self-sufficient the home was. YAML only.

## Sources and home

Every source is an energy meter: the solar production, a battery's `charge` and `discharge`, a grid's `import` and `export`. The card reads what each meter counted in the period from Home Assistant's long-term statistics, so the meters need them: `device_class: energy` with a `state_class` of `total` or `total_increasing`, the meters the Energy dashboard accepts. The unit does not matter (Wh, kWh, MWh, GJ …); the card converts to kWh. Meters that count something else (water in m³ or L, gas in m³) are shown in their own unit, the unit of the card's first meter, as written, and the summary line leaves out imported, exported and self-sufficient; all of the card's meters should count the same. What a meter counted since the last compiled hour comes from its live state, so the numbers move as the meters count.

::: live

```yaml
type: custom:energy-flow-card-pro
home: sensor.home_energy
sources:
  - { type: solar, entity: sensor.solar_energy }
  - type: battery
    charge: sensor.battery_charge_energy
    discharge: sensor.battery_discharge_energy
    soc: sensor.battery_soc
  - { type: grid, import: sensor.grid_import_energy, export: sensor.grid_export_energy }
```

:::

Over a period a battery both charges and discharges, and a grid both imports and exports, so their nodes show both values: what went in `↓` over what came out `↑`. `soc` still puts the battery's state of charge, as it is now, on its node as a ring. Without `home` the card adds the sources up: production, discharge and import, less charge and export.

The flows split the way Home Assistant's Energy dashboard splits them, hour by hour for a day and day by day for longer periods: what the grid imported beyond the home charged the battery; solar charged the battery, then covered the export, and the battery covered the rest of it; the grid charged what the battery still took; the home took what was left of solar, then of the battery, then the grid. A battery with `charge_from: solar` (or a list of solar entities) takes only those panels' energy and never the grid's.

## Periods

`period` picks the stretch of time the card shows (and comes back to, see the picker below): `today` (the default), `yesterday`, `week` (from Monday), `month` or `year`. The periods follow the calendar in Home Assistant's time zone (or the browser's, as your profile says), and the card turns over by itself at midnight, on Monday and on the first of the month.

::: live

```yaml
type: custom:energy-flow-card-pro
period: month
title: This month
icon: mdi:calendar-month
sources:
  - { type: solar, entity: sensor.solar_energy }
  - { type: battery, charge: sensor.battery_charge_energy, discharge: sensor.battery_discharge_energy }
  - { type: grid, import: sensor.grid_import_energy, export: sensor.grid_export_energy }
consumers:
  - { entity: sensor.heat_pump_energy, name: Heat pump }
  - { entity: sensor.ev_charger_energy, name: EV }
  - { entity: sensor.washer_energy, name: Washer }
  - { entity: sensor.office_energy, name: Office }
```

:::

### Picking the time frame

The header carries a picker: **‹** goes to the period before, **›** to the one after (up to the running one), and the button between them names the period shown (Today, Yesterday, Fri 23 Oct, 6 – 10 Oct, March 2026) and opens a calendar, as Home Assistant's date picker does. The button keeps one width whatever it names, so nothing in the header moves as you step; a long range is cut, its tooltip names it in full. Quick picks give today, yesterday, this week, month and year and the last 7 and 30 days; on the calendar two clicks pick any range of days, its first day and then its last (the same day twice: that day). The calendar's title opens the months and the years, to get to a far month quickly. A range that is exactly a day, a week (Monday to Sunday), a month or a year steps by it with ‹ ›, any other range by its own length. Nothing after today can be picked; the arrow keys move through the calendar, Page Up and Page Down turn its page, Escape closes it. The pick is the viewer's own and lasts while the page is open: after ten minutes without a touch, and on a reload, the card shows its `period` again, so a wall tablet comes back to today. `period_picker: false` leaves the picker out for a card that always shows its `period`; the summary line then names the period. Without a `title` the card is titled **Energy**.

::: live

```yaml
type: custom:energy-flow-card-pro
title: Energy
icon: mdi:lightning-bolt
period: week
sources:
  - { type: solar, entity: sensor.solar_energy }
  - { type: grid, import: sensor.grid_import_energy, export: sensor.grid_export_energy }
consumers:
  - { entity: sensor.heat_pump_energy, name: Heat pump }
  - { entity: sensor.ev_charger_energy, name: EV }
```

:::

## Consumers and rooms

Consumers, rooms, `consumer_style: list`, `direction`, `flow_style` (`none` keeps the links still), `idle_links`, `other` (`{ name, icon }` renames it), `icon_size` and `visibility` work as on the [power flow card](/cards/power-flow-card#consumers), with energy meters for the devices. The **Other** node takes what the home used beyond the consumers.

The dots move by each link's share of the home's total, so the busiest link is the one that carried the most. `idle_below` (default `0.05` kWh) leaves a link that carried less without motion, and `hide_consumers_below` (or a room's or device's `hide_below`) hides a device that used less in the period, in kWh. The card's `rules` match the home's energy in the period in kWh, and a source's or consumer's rules match its meter's energy in the period.

::: live

```yaml
type: custom:energy-flow-card-pro
hide_consumers_below: 0.2
sources:
  - { type: solar, entity: sensor.solar_energy }
  - { type: battery, charge: sensor.battery_charge_energy, discharge: sensor.battery_discharge_energy }
  - { type: grid, import: sensor.grid_import_energy, export: sensor.grid_export_energy }
consumers:
  - group: Utility room
    icon: mdi:washing-machine
    entities:
      - { entity: sensor.heat_pump_energy, name: Heat pump }
      - { entity: sensor.washer_energy, name: Washer }
  - { entity: sensor.ev_charger_energy, name: EV }
  - { entity: sensor.office_energy, name: Office }
rules:
  - { above: 20, label: Busy day, color: amber }
```

:::

## Power and energy side by side

The two cards take the same layout, so a power card for the moment and an energy card for the day read as a pair. In a sections dashboard give each half the width (`grid_options: { columns: 6 }`). (The demo's power sensors and energy meters are simulated apart, so their numbers do not match the way a real home's do.)

::: live width=full

```yaml
- type: custom:power-flow-card-pro
  title: Now
  icon: mdi:flash
  home: sensor.power_consumption
  sources:
    - { type: solar, entity: sensor.solar_power }
    - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
    - { type: grid, power: sensor.grid_power }
  grid_options: { columns: 6 }
- type: custom:energy-flow-card-pro
  title: Today
  icon: mdi:calendar-today
  home: sensor.home_energy
  sources:
    - { type: solar, entity: sensor.solar_energy }
    - type: battery
      charge: sensor.battery_charge_energy
      discharge: sensor.battery_discharge_energy
      soc: sensor.battery_soc
    - { type: grid, import: sensor.grid_import_energy, export: sensor.grid_export_energy }
  grid_options: { columns: 6 }
```

:::

## Heat distribution

The tree is not tied to electricity. A heat pump's heat meter as the source and the heat meters of the floors and the hot water as consumers show where the heat went. The source is a `solar` source with its own name and icon; `other: false` leaves out the **Other** node when the consumers account for all of it.

::: live

```yaml
type: custom:energy-flow-card-pro
title: Heat today
icon: mdi:fire
home: { name: Heating }
other: false
sources:
  - { type: solar, entity: sensor.heat_pump_heat_energy, name: Heat pump, icon: mdi:heat-pump }
consumers:
  - { entity: sensor.heating_ground_floor_energy, name: Ground floor }
  - { entity: sensor.heating_upper_floor_energy, name: Upper floor }
  - { entity: sensor.hot_water_energy, name: Hot water }
```

:::

## Reference

### Card options

| Option                                                                                | Default                | Description                                                                                                                                             |
| ------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sources`                                                                             | required               | Solar, battery and grid entries (below), in drawing order.                                                                                              |
| `period`                                                                              | `today`                | `today`, `yesterday`, `week` (from Monday), `month` or `year`, in Home Assistant's time zone.                                                           |
| `period_picker`                                                                       | `true`                 | The picker in the header: the viewer steps to another day, week, month or year; back to `period` after ten minutes untouched. `false`: always `period`. |
| `title`                                                                               | Energy                 | The header's text, templates allowed.                                                                                                                   |
| `home`                                                                                | sum of the sources     | The home's energy meter, or an entity object with `name`, `icon`, `rules` and actions.                                                                  |
| `consumers`                                                                           | –                      | Devices (`{ entity, name, icon }`) or rooms (`{ group, icon, entities }`) with energy meters, in drawing order.                                         |
| `idle_below`                                                                          | `0.05`                 | kWh below which a link is idle (no motion); `0` lets every trickle flow.                                                                                |
| `decimals`                                                                            | `{ kwh: 1, mwh: 2 }`   | Decimals of the values: one number for both units, or `{ kwh, mwh }`. Values show in MWh from 1000 kWh.                                                 |
| `hide_consumers_below`                                                                | –                      | Hides a consumer while it used less than this many kWh in the period. A room or consumer's own `hide_below` overrides it, `0` never hides.              |
| `rules`                                                                               | –                      | `[{ below, above, color, label, tint_card }]` on the home's energy in the period in kWh; first match wins.                                              |
| `consumer_style`, `other`, `direction`, `flow_style`, `idle_links`, `icon`, actions … | as the power flow card | See the [power flow card's options](/cards/power-flow-card#card-options).                                                                               |

### Sources

| Option                                       | Applies to | Description                                                                                                                                       |
| -------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`                                       | all        | `solar`, `battery` or `grid`.                                                                                                                     |
| `entity`                                     | solar      | Production: an energy meter.                                                                                                                      |
| `charge`, `discharge`                        | battery    | The energy into and out of the battery: two energy meters, both required.                                                                         |
| `import`, `export`                           | grid       | The energy from and to the grid: energy meters (`export` optional).                                                                               |
| `soc`                                        | battery    | State of charge in %, shown as the node's ring (as it is now).                                                                                    |
| `charge_from`                                | battery    | `solar`: only the panels charge this battery, never the grid. The entity of a solar source (or a list of them): only those panels. Default `any`. |
| `name`, `icon`, `color`, `rules`, `decimals` | all        | As on every entity; `rules` match the meter's energy in the period (kWh).                                                                         |
| `secondary`, `icon_size`, `visibility`       | all        | As on the [power flow card](/cards/power-flow-card#sources).                                                                                      |

The power flow card's `power`, `both_ways`, `invert`, `peak`, `price`, `offline`, `generator` and `fossil` describe a moment and are not options here; the card says so when it meets one.
