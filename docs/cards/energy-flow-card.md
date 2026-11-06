# Energy flow

`custom:energy-flow-card-pro` shows where your energy came from and where it went over a period: today, yesterday, this week, month or year. It draws the [power flow card](/cards/power-flow-card)'s tree from energy meters instead of power sensors; consumers, rooms, direction, flow style, node sizes, visibility and actions work as they do there.

## Energy meters

Every source is an energy meter: a solar array's production, a battery's `charge` and `discharge`, a grid's `import` and `export`. The card reads what each meter counted in the period from Home Assistant's long-term statistics, so the meters are the ones the Energy dashboard accepts: `device_class: energy` with a `state_class` of `total` or `total_increasing`. Any energy unit works; the card shows kWh, and MWh from 1000 kWh. The numbers move as the meters count.

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

Over a period a battery both charges and discharges, and a grid both imports and exports, so their nodes show both values, in `↓` and out `↑`. `soc` draws the battery's charge as it is now. Without `home` the card adds the sources up. The flows split the way Home Assistant's Energy dashboard splits them, hour by hour for a day and day by day for longer periods. A battery with `charge_from: solar` (or the entities of some solar sources) takes only the panels' energy.

The line above the tree names what the grid imported and exported and how self-sufficient the home was. Meters that count something else, such as water in m³, show in the unit of the card's first meter, and the line leaves those out.

## Periods and the picker

`period` sets what the card shows: `today` (the default), `yesterday`, `week` (from Monday), `month` or `year`, following the calendar in the time zone of your Home Assistant profile.

The header carries a picker. **‹** and **›** step to the period before and after, and the button between them opens a calendar: quick picks for today, yesterday, this week, month and year and the last 7 and 30 days, or any range of days with two clicks. The pick is the viewer's own: after ten minutes untouched, or on a reload, the card goes back to its `period`, so a wall tablet returns to today. `period_picker: false` leaves the picker out. Without a `title` the card is titled **Energy**.

::: live

```yaml
type: custom:energy-flow-card-pro
title: Energy
icon: mdi:lightning-bolt
period: week
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

## Following the dashboard's period

On a dashboard with Home Assistant's energy date picker (the `energy-date-selection` card), `period: dashboard` shows the period picked there, as Home Assistant's own energy cards do. The card then has no picker of its own, and without a date picker on the dashboard it shows today. `collection_key` follows the picker with that `collection_key` (it starts with `energy_`).

::: live width=full

```yaml
- type: energy-date-selection
- type: custom:energy-flow-card-pro
  period: dashboard
  sources:
    - { type: solar, entity: sensor.solar_energy }
    - { type: grid, import: sensor.grid_import_energy, export: sensor.grid_export_energy }
  consumers:
    - { entity: sensor.heat_pump_energy, name: Heat pump }
    - { entity: sensor.ev_charger_energy, name: EV }
  grid_options: { columns: 6 }
```

:::

## Consumers and rooms

Consumers and rooms take energy meters and work as on the [power flow card](/cards/power-flow-card#consumers). The thresholds read kWh in the period: `hide_consumers_below` hides a device that used less, `idle_below` (0.05 kWh) keeps a link still, and the card's `rules` match the home's energy. The dots move by each link's share of the home, so the busiest link is the one that carried the most.

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

The two cards share their layout, so a power card for the moment and an energy card for the day read as a pair. In a sections view give each half the width. (The demo's power and energy sensors are simulated apart, so their numbers do not match.)

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

The tree is not tied to electricity. A heat pump's heat meter as a `solar` source with its own name and icon, and the floors' heat meters as consumers, show where the heat went. `other: false` drops the **Other** node when the consumers account for everything.

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

## Header

`badges` sit at the end of the title line, beside the picker, and take the [badge keys](/cards/badges#badge-keys). They show the state now, not the period's. On a narrow card the picker takes most of the line, so keep them few. `hover: true` brightens a node under the pointer, as on the power flow card.

## The visual editor

Home Assistant's card editor shows the same form as the [power flow card's](/cards/power-flow-card#the-visual-editor), with energy meters in place of power sensors: the period and its picker at the top (with the energy dashboard's date picker to follow for **As the energy dashboard**), the home, the consumers, the drawing and the values in kWh, and each source in a tab: a solar array's meter, a battery's charge and discharge meters with its level, a grid's import and export. Try it in the [Playground](/playground), or with **Edit** under any example.

## Reference

### Card options

| Option                                                                                                                                                                  | Default                | Description                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `sources`                                                                                                                                                               | required               | Solar, battery and grid entries ([below](#sources)), in drawing order.                                                                 |
| `home`                                                                                                                                                                  | sum of the sources     | The home's energy meter, or an object with `entity`, `name`, `icon`, `rules`, `icon_size` and actions.                                 |
| `consumers`                                                                                                                                                             | –                      | Devices and rooms with energy meters, as on the [power flow card](/cards/power-flow-card#home-consumers-and-rooms) (without `invert`). |
| `period`                                                                                                                                                                | `today`                | `today`, `yesterday`, `week`, `month`, `year`, or `dashboard` to follow the dashboard's energy date picker.                            |
| `collection_key`                                                                                                                                                        | the dashboard's        | With `period: dashboard`: the `collection_key` of the date picker to follow.                                                           |
| `period_picker`                                                                                                                                                         | `true`                 | The picker in the header; `false` always shows `period`.                                                                               |
| `title`                                                                                                                                                                 | Energy                 | The header's text. Template allowed.                                                                                                   |
| `idle_below`                                                                                                                                                            | `0.05`                 | kWh below which a link is idle; `0` lets every trickle flow.                                                                           |
| `decimals`                                                                                                                                                              | `{ kwh: 1, mwh: 2 }`   | Decimals of the values: one number for both units, or `{ kwh, mwh }`.                                                                  |
| `hide_consumers_below`                                                                                                                                                  | –                      | Hides a consumer that used less than this many kWh in the period; its energy counts in **Other**.                                      |
| `rules`                                                                                                                                                                 | –                      | `{ below, above, color, label, tint_card }` on the home's energy in the period in kWh; the first match wins.                           |
| `consumer_style`, `other`, `direction`, `flow_style`, `idle_links`, `icon`, `title_tap_action`, `badges`, `header_entities`, `hours_to_show` …, `tap_action` …, `hover` | as the power flow card | See the [power flow card's options](/cards/power-flow-card#card-options).                                                              |

### Sources

| Option                                                                               | Applies to | Description                                                                                       |
| ------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `type`                                                                               | all        | `solar`, `battery` or `grid`.                                                                     |
| `entity`                                                                             | solar      | The production meter.                                                                             |
| `charge`, `discharge`                                                                | battery    | The energy into and out of the battery; both required.                                            |
| `soc`                                                                                | battery    | The state of charge in %, drawn as the node's ring (as it is now).                                |
| `charge_from`                                                                        | battery    | `any` (default); `solar`: only the panels charge it; or the entity of a solar source (or a list). |
| `import`, `export`                                                                   | grid       | The energy from and to the grid; `export` is optional.                                            |
| `rules`                                                                              | all        | Colour and icon of the node by the meter's energy in the period (kWh).                            |
| `name`, `icon`, `color`, `secondary`, `decimals`, `icon_size`, `visibility`, `hover` | all        | As on the [power flow card](/cards/power-flow-card#sources).                                      |

The power flow card's `power`, `invert`, `both_ways`, `peak`, `price`, `offline`, `generator`, `fossil` and `non_fossil` describe a moment and are errors here.

### Grid and Home Assistant options

As the power flow card: 12 columns, `rows: auto`, and Home Assistant's `grid_options`, `fill_height`, `visibility`, `view_layout` and `card_mod`; see its [grid options](/cards/power-flow-card#grid-and-home-assistant-options).
