# Power Flow Card

`custom:power-flow-card` shows where your electricity comes from and where it goes: solar, battery and grid on the left, the home in the middle, your rooms and devices on the right, joined by lines that carry the power as moving dots. Solar covers the home first, then the battery, then the grid; surplus solar charges the battery and the rest is exported. The line above the tree names the state (importing, exporting, on battery, balanced) and how self-sufficient the home is right now. YAML only.

## Sources and home

The smallest card names the sources and the home's consumption. Every source is a `sensor` in W or kW; the battery's `power` is positive while discharging and negative while charging, the grid's `power` is positive while importing and negative while exporting. Idle links stay as dashed tracks, active links flow.

::: live

```yaml
type: custom:power-flow-card
home: sensor.power_consumption
sources:
  - { type: solar, entity: sensor.solar_power }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - { type: grid, power: sensor.grid_power }
```

:::

`soc` puts the battery's state of charge on its node as a ring; the home's ring shows the mix of solar, battery and grid it runs on. Without `home` the card adds the sources up. Integrations that report the grid or the battery as two sensors name them as a pair: `import` / `export` for the grid, `charge` / `discharge` for the battery. A signed sensor with the opposite convention takes `invert: true`.

::: live

```yaml
type: custom:power-flow-card
sources:
  - { type: solar, entity: sensor.solar_east, name: Solar east }
  - { type: solar, entity: sensor.solar_west, name: Solar west }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - { type: grid, power: sensor.grid_power }
```

:::

## Consumers

`consumers` lists the devices the home feeds. Each is an entity with a power sensor and, like everywhere else, a `name` and an `icon`; an **Other** node takes whatever the home uses beyond them (`other: false` leaves it out). `consumer_style: list` shows them as rows with a bar instead of nodes.

::: live

```yaml
type: custom:power-flow-card
title: Energy
icon: mdi:lightning-bolt
home: sensor.power_consumption
sources:
  - { type: solar, entity: sensor.solar_power }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - { type: grid, power: sensor.grid_power }
consumers:
  - { entity: sensor.heat_pump_power, name: Heat pump, icon: mdi:heat-pump }
  - { entity: sensor.washer_power, name: Washer, icon: mdi:washing-machine }
  - { entity: sensor.office_power, name: Office, icon: mdi:monitor }
  - { entity: sensor.dining_light_power, name: Lights, icon: mdi:lightbulb }
```

:::

::: live

```yaml
type: custom:power-flow-card
home: sensor.power_consumption
sources:
  - { type: solar, entity: sensor.solar_power }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - { type: grid, power: sensor.grid_power }
consumers:
  - { entity: sensor.heat_pump_power, name: Heat pump, icon: mdi:heat-pump }
  - { entity: sensor.washer_power, name: Washer, icon: mdi:washing-machine }
  - { entity: sensor.office_power, name: Office, icon: mdi:monitor }
  - { entity: sensor.dining_light_power, name: Lights, icon: mdi:lightbulb }
consumer_style: list
```

:::

## Rooms

A consumer with a `group` name and its own `entities` becomes a room: the home feeds the room, the room feeds its devices. Rooms and flat devices mix freely.

::: live

```yaml
type: custom:power-flow-card
home: sensor.power_consumption
sources:
  - { type: solar, entity: sensor.solar_power }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - { type: grid, power: sensor.grid_power }
consumers:
  - group: Heating
    icon: mdi:radiator
    entities:
      - { entity: sensor.heat_pump_power, name: Heat pump, icon: mdi:heat-pump }
  - group: Laundry
    icon: mdi:washing-machine
    entities:
      - { entity: sensor.washer_power, name: Washer, icon: mdi:washing-machine }
      - { entity: sensor.dryer_power, name: Dryer, icon: mdi:tumble-dryer }
  - group: Kitchen
    icon: mdi:silverware-fork-knife
    entities:
      - { entity: sensor.range_hood_power, name: Range hood, icon: mdi:stove }
      - { entity: sensor.dining_light_power, name: Lights, icon: mdi:lightbulb }
  - { entity: sensor.office_power, name: Office, icon: mdi:monitor }
```

:::

## Direction

`direction: down` turns the tree: sources across the top, the home in the middle, consumers along the bottom, for tall layouts.

::: live

```yaml
type: custom:power-flow-card
home: sensor.power_consumption
direction: down
sources:
  - { type: solar, entity: sensor.solar_power }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - { type: grid, power: sensor.grid_power }
consumers:
  - { entity: sensor.heat_pump_power, name: Heat pump, icon: mdi:heat-pump }
  - { entity: sensor.washer_power, name: Washer, icon: mdi:washing-machine }
  - { entity: sensor.office_power, name: Office, icon: mdi:monitor }
```

:::

## Flow style

`flow_style` picks how the power moves along the links: `dots` (the default), `lines` (dashes running along the link) or `arrows`.

::: live

```yaml
- type: custom:power-flow-card
  home: sensor.power_consumption
  flow_style: dots
  sources:
    - { type: solar, entity: sensor.solar_power }
    - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
    - { type: grid, power: sensor.grid_power }
- type: custom:power-flow-card
  home: sensor.power_consumption
  flow_style: lines
  sources:
    - { type: solar, entity: sensor.solar_power }
    - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
    - { type: grid, power: sensor.grid_power }
- type: custom:power-flow-card
  home: sensor.power_consumption
  flow_style: arrows
  sources:
    - { type: solar, entity: sensor.solar_power }
    - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
    - { type: grid, power: sensor.grid_power }
```

:::

## States, rules and the grid

The line above the tree says what the home runs on: **Exporting**, **On battery**, **Importing** or **Balanced**, with the self-sufficiency of the moment. A grid source with `price` and a card-level `expensive_above` adds **Expensive** when importing at or above that price, and `offline` names an entity whose state (`on` by default, or `{ entity, state }`) means the grid is down: the grid node turns red and the card tints. Both take the red state colour.

`rules` work on the home's power in watts like the [entity rules](/cards/entity-options#rules): the matching rule's `label` becomes a pill on the summary line, its `color` paints the home node, `tint_card: true` tints the card. A source or consumer takes `rules` of its own on its sensor's value (colour and icon of its node) and a fixed `color` or `icon`.

::: live

```yaml
type: custom:power-flow-card
home: sensor.power_consumption
expensive_above: 0.35
sources:
  - { type: solar, entity: sensor.solar_power }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - type: grid
    power: sensor.grid_power
    price: sensor.electricity_price
    offline: binary_sensor.grid_outage
rules:
  - { below: 500, color: green, label: Quiet }
  - { below: 3000, color: primary, label: Normal }
  - { above: 3000, color: red, label: Heavy load, tint_card: true }
```

:::

## Motion

Every active link carries dots: more and faster the more power it carries, from a slow trickle at a few watts to a steady stream at several kilowatts. A changed value re-times the running dots instead of restarting them, so sensor noise never makes the flow jump; a link only gets new dots when it switches on or off or its load changes by a real margin. With `prefers-reduced-motion` the dots stand still along their links.

## Reference

### Card options

| Option            | Default               | Description                                                                                                    |
| ----------------- | --------------------- | -------------------------------------------------------------------------------------------------------------- |
| `sources`         | required              | Solar, battery and grid entries (below), in drawing order.                                                     |
| `home`            | sum of the sources    | The home's consumption sensor (W or kW), or an entity object with `name`, `icon`, `rules` and actions.         |
| `consumers`       | –                     | Devices (`{ entity, name, icon }`) or rooms (`{ group, icon, entities }`), in drawing order.                   |
| `consumer_style`  | `nodes`               | `nodes` or `list` (rows with a bar). Rows need the `right` direction.                                          |
| `other`           | `true` with consumers | The **Other** node for the home's consumption the consumers do not account for.                                |
| `direction`       | `right`               | `right` (sources → home → consumers) or `down`.                                                                |
| `flow_style`      | `dots`                | `dots`, `lines` or `arrows`.                                                                                   |
| `expensive_above` | –                     | Price at or above which importing shows the Expensive state and tints the card (in the price sensor's unit).   |
| `rules`           | –                     | `[{ below, above, color, label, tint_card }]` on the home's power in W; first match wins.                      |
| `title`, `icon`   | –                     | Header, templates allowed. `header_entities` as in the [group card](/cards/entity-group-card#header-entities). |
| `tap_action` …    | `more-info`           | `tap_action`, `hold_action`, `double_tap_action` on every node with an entity.                                 |

### Sources

| Option                                       | Applies to    | Description                                                                                                                                |
| -------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `type`                                       | all           | `solar`, `battery` or `grid`.                                                                                                              |
| `entity`                                     | solar         | Production sensor (W or kW).                                                                                                               |
| `power`                                      | battery, grid | Signed sensor: battery positive while discharging, grid positive while importing. `invert: true` flips it.                                 |
| `charge`, `discharge`                        | battery       | A pair of sensors instead of `power`.                                                                                                      |
| `import`, `export`                           | grid          | A pair of sensors instead of `power` (`export` optional).                                                                                  |
| `soc`                                        | battery       | State of charge in %, shown as the node's ring.                                                                                            |
| `price`                                      | grid          | Price sensor, shown in the Expensive state.                                                                                                |
| `offline`                                    | grid          | An entity id (offline when `on`) or `{ entity, state }`.                                                                                   |
| `name`, `icon`, `color`, `rules`, `decimals` | all           | As on every entity: the name (default Solar / Battery / Grid), a fixed icon or colour, rules on the sensor's value, decimals of the label. |

Values are shown in W below 1 kW and in kW above, whatever unit the sensors report. The card takes the full width of a section (`rows: auto`) and sizes its height to the number of sources and consumers, not to the width; with many devices, rooms or `consumer_style: list` it reads best on a wide column.
