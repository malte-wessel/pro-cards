# Power Flow Card Pro

`custom:power-flow-card-pro` shows where your electricity comes from and where it goes: solar, battery and grid on the left, the home in the middle, your rooms and devices on the right, joined by lines that carry the power as moving dots. Solar covers the home first, then the battery, then the grid; surplus solar charges the battery and the rest is exported. The line above the tree names the state (importing, exporting, on battery, balanced) and how self-sufficient the home is right now. YAML only.

## Sources and home

The smallest card names the sources and the home's consumption. Every source is a `sensor` in W or kW; the battery's `power` is positive while discharging and negative while charging, the grid's `power` is positive while importing and negative while exporting. Idle links stay as dashed tracks, active links flow.

::: live

```yaml
type: custom:power-flow-card-pro
home: sensor.power_consumption
sources:
  - { type: solar, entity: sensor.solar_power, peak: 8000 }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - { type: grid, power: sensor.grid_power }
```

:::

`soc` puts the battery's state of charge on its node as a ring, and `peak` (W) on a solar source puts its production against the panels' peak power there; the home's ring shows the mix of solar, battery and grid it runs on. Without `home` the card adds the sources up. Integrations that report the grid or the battery as two sensors name them as a pair: `import` / `export` for the grid, `charge` / `discharge` for the battery. A signed sensor with the opposite convention takes `invert: true`.

::: live

```yaml
type: custom:power-flow-card-pro
sources:
  - { type: solar, entity: sensor.solar_east, name: Solar east }
  - { type: solar, entity: sensor.solar_west, name: Solar west }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - { type: grid, power: sensor.grid_power }
```

:::

A plug-in battery (a balcony system, a DC-coupled hybrid) is fed by its panels: solar goes into the battery first and the grid cannot charge it. `charge_from: solar` on the battery tells the card so. Solar then charges that battery before it covers the home, and grid power runs to the home; the grid only tops the battery up when the sensors disagree (the panels report less than the battery takes). With several solar sources the charge is shared across them. Without the option the card follows the usual order and would draw the grid charging the battery whenever the battery takes more than the solar surplus.

Such a unit usually reports two numbers: what the panels put in and what its inverter gives out. Given as the `charge` / `discharge` pair, the card draws both flows at once, the panels into the battery and the battery into the home, and the node shows both values while both run: `650 W ↓` over `250 W ↑`, into the battery and out of it. The label keeps the second line while it shows one value, so the card's height never changes with the flows. Once one of them drops below `idle_below` the node shows the net value again (and both again only clearly above it, so the label does not flicker). With a single `power` sensor it only knows the net value, so part of the solar runs to the home directly. The inverter's output is not the battery's `power`: it already contains the solar share and would count it twice.

::: live

```yaml
type: custom:power-flow-card-pro
sources:
  - { type: solar, entity: sensor.balcony_solar_power, name: Balcony }
  - type: battery
    charge: sensor.balcony_battery_charge_power
    discharge: sensor.balcony_battery_discharge_power
    soc: sensor.balcony_battery_soc
    charge_from: solar
  - { type: grid, power: sensor.balcony_grid_power }
```

:::

With more than one array, `charge_from` can name the panels that feed the battery instead: the entity of a solar source, or a list of them. Only those panels charge it, and the others get no link to it. A roof array beside a balcony system then covers the home (and charges the house battery from its surplus) while the balcony panels fill their own battery. `solar` stands for every array.

::: live

```yaml
type: custom:power-flow-card-pro
sources:
  - { type: solar, entity: sensor.solar_power, name: Roof }
  - { type: solar, entity: sensor.balcony_solar_power, name: Balcony }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - type: battery
    name: Balcony battery
    charge: sensor.balcony_battery_charge_power
    discharge: sensor.balcony_battery_discharge_power
    soc: sensor.balcony_battery_soc
    charge_from: sensor.balcony_solar_power
  - { type: grid, power: sensor.grid_power }
```

:::

Most meters net their phases: the home imports or exports, never both. A meter that counts every phase on its own can import on one phase while it exports on another. `both_ways: true` on an `import` / `export` pair tells the card so. The export then comes from the panels (then the batteries) before they cover the home, the import covers what is left of the home and of the batteries' charge, and the grid node shows both values: `400 W ↓` over `1.20 kW ↑`, into the grid and out of it. The summary reads the export when it outweighs what the home imports. Without the option the pair is netted.

::: live

```yaml
type: custom:power-flow-card-pro
sources:
  - { type: solar, entity: sensor.solar_power }
  - type: grid
    import: sensor.grid_import_power
    export: sensor.grid_export_power
    both_ways: true
```

:::

## Consumers

`consumers` lists the devices the home feeds. Each is an entity with a power sensor and, like everywhere else, a `name`, an `icon` and a `secondary` line (a template is fine); an **Other** node takes whatever the home uses beyond them (`other: false` leaves it out). `consumer_style: list` shows them as rows with a bar instead of nodes.

A device that can produce, such as an EV giving power back or a plug-in panel on a smart plug, reports a negative value: its link then runs back to the home in the solar colour and it counts for nothing in the Other node. `invert: true` flips a sensor with the opposite sign.

::: live

```yaml
type: custom:power-flow-card-pro
title: Energy
icon: mdi:lightning-bolt
home: sensor.power_consumption
sources:
  - { type: solar, entity: sensor.solar_power }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - { type: grid, power: sensor.grid_power }
consumers:
  - { entity: sensor.heat_pump_power, name: Heat pump, icon: mdi:heat-pump, secondary: floor heating }
  - { entity: sensor.ev_charger_power, name: EV, icon: mdi:car-electric }
  - { entity: sensor.washer_power, name: Washer, icon: mdi:washing-machine }
  - { entity: sensor.dining_light_power, name: Lights, icon: mdi:lightbulb }
```

:::

::: live

```yaml
type: custom:power-flow-card-pro
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
type: custom:power-flow-card-pro
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

## Node sizes

Every node's circle has a size by kind: 44 px for solar and grid, 40 px for a battery, 46 px for the home, 32 px for consumers and rooms, 24 px for a room's devices. `icon_size` on a source, the home, a consumer, a room or a device sets its diameter in pixels (16 to 96), and the icon follows (the **Other** node takes it as `other: { icon_size: 44 }`): 55 % of the circle, 42 % inside a ring. A ring, the gap inside it and its icon keep their proportions at any size. The tree gives a bigger node more room, so labels stay clear of it. In `consumer_style: list` every row's circle is 32 px, or its `icon_size` up to 36 px, the row's height. A source bigger than the default moves the source column in, so the lines behind it stay clear.

::: live

```yaml
type: custom:power-flow-card-pro
home: { entity: sensor.power_consumption, icon_size: 60 }
sources:
  - { type: solar, entity: sensor.solar_power, icon_size: 52 }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - { type: grid, power: sensor.grid_power, icon_size: 36 }
consumers:
  - { entity: sensor.heat_pump_power, name: Heat pump, icon: mdi:heat-pump, icon_size: 44 }
  - { entity: sensor.washer_power, name: Washer, icon: mdi:washing-machine }
  - { entity: sensor.dining_light_power, name: Lights, icon: mdi:lightbulb, icon_size: 24 }
other: { icon_size: 44 }
```

:::

## Direction

`direction: down` turns the tree: sources across the top, the home in the middle, consumers along the bottom, for tall layouts. The sources' labels share one line: right of the icons when every name fits there, otherwise below them, beside each source's line, with a name that still does not fit cut short.

::: live

```yaml
type: custom:power-flow-card-pro
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

When the row of consumers is too narrow for their labels side by side, every label stays below its node and a long name ends in an ellipsis where it would meet its neighbour's (it may take the room a shorter neighbour leaves). Values are never cut; only when not even the values fit side by side does a label move above.

::: live width=400

```yaml
type: custom:power-flow-card-pro
home: sensor.power_consumption
direction: down
sources:
  - { type: solar, entity: sensor.solar_power }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - { type: grid, power: sensor.grid_power }
consumers:
  - { entity: sensor.heat_pump_power, name: Heat pump, icon: mdi:heat-pump }
  - { entity: sensor.ev_charger_power, name: Car, icon: mdi:car-electric }
  - { entity: sensor.washer_power, name: Washer, icon: mdi:washing-machine }
  - { entity: sensor.dryer_power, name: Dryer, icon: mdi:tumble-dryer }
  - { entity: sensor.office_power, name: Office, icon: mdi:monitor }
  - { entity: sensor.range_hood_power, name: Range hood, icon: mdi:stove }
```

:::

## Flow style

`flow_style` picks how the power moves along the links: `dots` (the default), `lines` (dashes running along the link) or `arrows`.

::: live

```yaml
- type: custom:power-flow-card-pro
  home: sensor.power_consumption
  flow_style: dots
  sources:
    - { type: solar, entity: sensor.solar_power }
    - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
    - { type: grid, power: sensor.grid_power }
- type: custom:power-flow-card-pro
  home: sensor.power_consumption
  flow_style: lines
  sources:
    - { type: solar, entity: sensor.solar_power }
    - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
    - { type: grid, power: sensor.grid_power }
- type: custom:power-flow-card-pro
  home: sensor.power_consumption
  flow_style: arrows
  sources:
    - { type: solar, entity: sensor.solar_power }
    - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
    - { type: grid, power: sensor.grid_power }
```

:::

## States, rules and the grid

The line above the tree says what the home runs on: **Exporting**, **On battery**, **Importing** or **Balanced**, with the self-sufficiency of the moment. A grid source with `price` and a card-level `expensive_above` adds **Expensive** when importing at or above that price, and `offline` names an entity whose state (`on` by default, or `{ entity, state }`) means the grid is down: the grid node turns red, the card tints and the line says what keeps the home running (**Grid offline · on battery**, **· on solar**, or **Grid offline** alone). Both take the red state colour.

A grid with a `generator` sensor keeps the home running during an outage: while `offline`, the grid node becomes the generator, its power flows to the home in amber and the line reads **Grid offline · on generator**. A grid with the `fossil` percentage of the [CO2 Signal](https://www.home-assistant.io/integrations/co2signal/) integration (or a `non_fossil` percentage) splits the grid's share of the home ring into a low-carbon and a fossil part, names the share on the grid label and draws it as the grid node's ring.

::: live

```yaml
type: custom:power-flow-card-pro
home: sensor.power_consumption
sources:
  - { type: solar, entity: sensor.solar_power }
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc, secondary: "{{ states('sensor.battery_temperature') }} °C" }
  - type: grid
    power: sensor.grid_power
    offline: binary_sensor.grid_outage
    generator: sensor.generator_power
    fossil: sensor.grid_fossil_percentage
```

:::

`rules` work on the home's power in watts like the [entity rules](/cards/entity-options#rules): the matching rule's `label` becomes a pill on the summary line, its `color` paints the home node, `tint_card: true` tints the card. A source or consumer takes `rules` of its own on its sensor's value (colour and icon of its node) and a fixed `color` or `icon`.

::: live

```yaml
type: custom:power-flow-card-pro
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

## Motion, idle links and units

Every active link carries dots: more and faster the more power it carries, from a slow trickle at `animation.slow_below` watts (default 0) to a steady stream at `animation.fast_above` (default 3600). A workshop with a 20 kW peak raises `fast_above`; a flat that never draws more than a kilowatt lowers it so the flow still shows the difference between the kettle and the standby load. A changed value re-times the running dots instead of restarting them, so sensor noise never makes the flow jump; a link only gets new dots when it switches on or off or its load changes by a real margin. With `prefers-reduced-motion` the dots stand still along their links.

A link carrying less than `idle_below` watts (default 20) counts as carrying nothing, so standby noise around 0 W never makes the flow blink; `idle_below: 1` shows every trickle, `0` anything that is not exactly nothing. The same threshold decides the node colours and the summary line. Links that carry nothing are dashed tracks by default. `idle_links: hidden` leaves them out (the labels keep clear of them all the same, so no label moves when a link switches on or off); `faint` draws them as faint solid lines.

Values show in W below `kw_above` watts (default 1000) and in kW from there on, whatever unit the sensors report; `kw_above: 0` shows every value in kW. `decimals` sets the decimals of both units (`decimals: 1`) or each (`decimals: { w: 0, kw: 1 }`); a source's or consumer's own `decimals` wins for its label.

::: live

```yaml
- type: custom:power-flow-card-pro
  home: sensor.power_consumption
  idle_links: hidden
  kw_above: 0
  decimals: { kw: 1 }
  sources:
    - { type: solar, entity: sensor.solar_power }
    - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
    - { type: grid, power: sensor.grid_power }
- type: custom:power-flow-card-pro
  home: sensor.power_consumption
  idle_links: faint
  animation: { fast_above: 1500 }
  flow_style: arrows
  sources:
    - { type: solar, entity: sensor.solar_power }
    - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
    - { type: grid, power: sensor.grid_power }
```

:::

## Visibility

A source, a consumer, a room or a device with [`visibility`](/guide/visibility) is drawn only while its conditions hold; a condition without `entity` reads the node's own sensor. `hide_consumers_below` hides every consumer that draws less than that many watts, whatever unit its sensor reports, and shows it again only once it draws clearly more (20 % above, at least 2 W), so a device idling around the threshold does not blink. A room's `hide_below` sets it for its devices, a consumer's or device's own `hide_below` overrides it, and `0` never hides. A producing device counts by its size; an unavailable one as 0 W.

What a hidden consumer or room draws counts in **Other**, so the shown numbers still add up to the home; a room counts its hidden devices in its own total. A hidden source changes no number, only its node and links are left out. With no consumer left, Other goes too. The tree is drawn without the hidden nodes, so the card's height follows them.

::: live

```yaml
type: custom:power-flow-card-pro
title: Energy
icon: mdi:lightning-bolt
home: sensor.power_consumption
hide_consumers_below: 20
sources:
  - type: solar
    entity: sensor.solar_power
    visibility: [{ condition: state, entity: sun.sun, state: above_horizon }]
  - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
  - { type: grid, power: sensor.grid_power }
consumers:
  - { entity: sensor.heat_pump_power, name: Heat pump, icon: mdi:heat-pump }
  - entity: sensor.ev_charger_power
    name: EV
    icon: mdi:car-electric
    visibility: [{ condition: state, entity: binary_sensor.ev_plugged, state: "on" }]
  - { entity: sensor.washer_power, name: Washer, icon: mdi:washing-machine }
  - { entity: sensor.office_power, name: Office, icon: mdi:monitor, hide_below: 0 }
```

:::

## Card size

By default the card is as tall as its tree, and it grows or shrinks when nodes come and go (`visibility`, `hide_consumers_below`). In a sections dashboard with a fixed number of rows in `grid_options`, the card keeps the size of its cell and the tree fills it: more room spreads the tree out, less room scales the whole tree down so nothing is cut off. That keeps the card level with its neighbours. Wherever the card's height follows its content (a masonry view, a vertical stack, a card alone in its row), the tree keeps its own height. The card fills a grid row stretched by a taller card beside it the same way, and so do the other cards; `fill_height: false` keeps it at its own height there, see [Filling the height](/guide/sizing#filling-the-height).

```yaml
grid_options:
  columns: 12
  rows: 6
```

## Reference

### Card options

| Option                 | Default                               | Description                                                                                                                                                                                     |
| ---------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sources`              | required                              | Solar, battery and grid entries (below), in drawing order.                                                                                                                                      |
| `home`                 | sum of the sources                    | The home's consumption sensor (W or kW), or an entity object with `name`, `icon`, `rules` and actions.                                                                                          |
| `consumers`            | –                                     | Devices (`{ entity, name, icon }`) or rooms (`{ group, icon, entities }`), in drawing order.                                                                                                    |
| `consumer_style`       | `nodes`                               | `nodes` or `list` (rows with a bar). Rows need the `right` direction.                                                                                                                           |
| `other`                | `true` with consumers                 | The **Other** node for the home's consumption the consumers do not account for; `{ icon_size }` sizes it.                                                                                       |
| `direction`            | `right`                               | `right` (sources → home → consumers) or `down`.                                                                                                                                                 |
| `flow_style`           | `dots`                                | `dots`, `lines` or `arrows`.                                                                                                                                                                    |
| `idle_links`           | `dashed`                              | Links that carry nothing: `dashed`, `hidden` or `faint`.                                                                                                                                        |
| `idle_below`           | `20`                                  | Watts below which a link is idle (no motion) and names no state; `0` lets every trickle flow.                                                                                                   |
| `animation`            | `{ slow_below: 0, fast_above: 3600 }` | The loads (W) between which the flow goes from slowest to fastest.                                                                                                                              |
| `kw_above`             | `1000`                                | Watts from which values show in kW; `0` shows every value in kW.                                                                                                                                |
| `decimals`             | `{ w: 0, kw: 2 }`                     | Decimals of the values: one number for both units, or `{ w, kw }`.                                                                                                                              |
| `expensive_above`      | –                                     | Price at or above which importing shows the Expensive state and tints the card (in the price sensor's unit).                                                                                    |
| `hide_consumers_below` | –                                     | Hides a consumer while it draws less than this many watts; see [Visibility](#visibility). A room or consumer's own `hide_below` overrides it, `0` never hides.                                  |
| `rules`                | –                                     | `[{ below, above, color, label, tint_card }]` on the home's power in W; first match wins.                                                                                                       |
| `title`, `icon`        | –                                     | Header, templates allowed. `header_entities` as in the [group card](/cards/entity-group-card#header-entities).                                                                                  |
| `title_tap_action`     | none                                  | Action when the title or its icon is tapped, e.g. `{ action: navigate, navigation_path: /dashboard-rooms/kitchen }` to open the room's dashboard; see [Actions](/cards/entity-options#actions). |
| `tap_action` …         | `more-info`                           | `tap_action`, `hold_action`, `double_tap_action` on every node with an entity.                                                                                                                  |

### Sources

| Option                                       | Applies to    | Description                                                                                                                                                                                                                                                                                                                         |
| -------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`                                       | all           | `solar`, `battery` or `grid`.                                                                                                                                                                                                                                                                                                       |
| `entity`                                     | solar         | Production sensor (W or kW).                                                                                                                                                                                                                                                                                                        |
| `power`                                      | battery, grid | Signed sensor: battery positive while discharging, grid positive while importing. `invert: true` flips it.                                                                                                                                                                                                                          |
| `charge`, `discharge`                        | battery       | A pair of sensors instead of `power`; on a solar-fed battery both flows are drawn at once.                                                                                                                                                                                                                                          |
| `import`, `export`                           | grid          | A pair of sensors instead of `power` (`export` optional).                                                                                                                                                                                                                                                                           |
| `both_ways`                                  | grid          | `true` when the meter counts import and export apart (it does not net its phases): the grid may do both at once, and its node shows both values. Needs the `import` / `export` pair. Default `false`.                                                                                                                               |
| `soc`                                        | battery       | State of charge in %, shown as the node's ring.                                                                                                                                                                                                                                                                                     |
| `peak`                                       | solar         | The panels' peak power in W: the node's ring shows the production against it.                                                                                                                                                                                                                                                       |
| `charge_from`                                | battery       | `solar` when the panels feed this battery: solar charges it before the home, the grid only when the sensors disagree; with a `charge` / `discharge` pair it charges and feeds the home at once, and its node shows both values. The entity of a solar source (or a list of them) instead: only those panels feed it. Default `any`. |
| `price`                                      | grid          | Price sensor, shown in the Expensive state.                                                                                                                                                                                                                                                                                         |
| `offline`                                    | grid          | An entity id (offline when `on`) or `{ entity, state }`.                                                                                                                                                                                                                                                                            |
| `generator`                                  | grid          | A generator's power sensor: takes the grid node's place while offline.                                                                                                                                                                                                                                                              |
| `fossil`, `non_fossil`                       | grid          | The grid's fossil fuel (or low-carbon) percentage: the home ring's grid share splits, the grid label names it, the grid node's ring shows the low-carbon share.                                                                                                                                                                     |
| `secondary`                                  | all           | A line under the name; template allowed. Consumers take it too.                                                                                                                                                                                                                                                                     |
| `icon_size`                                  | all           | Diameter of the node's circle in px (16 to 96); the icon follows. Default 44 (solar, grid) or 40 (battery). The home, consumers, rooms and devices take it too (46, 32, 32, 24); see [Node sizes](#node-sizes).                                                                                                                     |
| `name`, `icon`, `color`, `rules`, `decimals` | all           | As on every entity: the name (default Solar / Battery / Grid), a fixed icon or colour, rules on the sensor's value, decimals of the label.                                                                                                                                                                                          |
| `visibility`                                 | all           | Drawn only while the [conditions](/guide/visibility) hold. Consumers, rooms and devices take it too, with `hide_below`.                                                                                                                                                                                                             |

Every label has its own room: the card grows in height with the number of sources and consumers (and their secondary lines) rather than squeezing text between nodes, and the columns move along the flow so the labels clear the next column. The card takes the full width of a section (`rows: auto`) and sizes its height to the config (and what of it is [shown](#visibility)), not to the width; with many devices, rooms or `consumer_style: list` it reads best on a wide column.
