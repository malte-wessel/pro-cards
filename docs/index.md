---
layout: home
hero:
  name: Pro Cards
  text: Beautiful, customizable cards for Home Assistant.
  tagline: Polished dashboard cards that look like they belong in Home Assistant, with every detail adjustable. Installed with HACS, styled by your theme.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Entity cards
      link: /cards/entity-card
    - theme: alt
      text: Playground
      link: /playground
features:
  - icon: 🏠
    title: Looks like Home Assistant
    details: Same spacing, typography, colours and state colours as the built-in tile cards, dark mode included. A custom theme restyles every card at once.
  - icon: 🎚️
    title: Value drives the look
    details: Rules switch icon, colour, label and even the card tint by value or state. Jinja templates for names, values and secondary text.
  - icon: 🛠️
    title: Every detail adjustable
    details: One entity as a tile or many as list, grid, hero, row, column, table or sections. Icon, ring, gauge, bar, sparkline, columns, badge or strip. Tap, hold and double-tap actions.
  - icon: 📈
    title: Trends, sun and light
    details: Multi sensor trend graphs with tooltips, today's sun path with dawn and dusk, illuminance on a log scale with zones.
---

## Live on this site

Every example on these pages is the real card code running against a simulated home. Values drift, switches toggle, templates render. Hover the graphs, click the tiles.

Each card page starts with the smallest possible configuration and adds one option at a time, so you can stop as soon as the card looks the way you want.

<div class="live-strip">
<LiveCard :config="{ type: 'custom:entity-group-card', layout: 'hero', title: 'Weather station', icon: 'mdi:weather-partly-cloudy', hours_to_show: 24, entities: [
  { entity: 'sensor.outdoor_temperature', name: 'Temperature', visual: 'sparkline', decimals: 1, rules: [ { below: 0, color: 'indigo', icon: 'mdi:snowflake', label: 'Frost', tint_card: true }, { below: 16, color: 'blue', icon: 'mdi:thermometer-low', label: 'Cool' }, { below: 26, color: 'green', icon: 'mdi:thermometer', label: 'Pleasant' }, { above: 26, color: 'orange', icon: 'mdi:thermometer-high', label: 'Hot', tint_card: true } ] },
  { entity: 'sensor.outdoor_humidity', name: 'Humidity', visual: 'badge' }, { entity: 'sensor.wind_speed', name: 'Wind', visual: 'badge' }, { entity: 'sensor.pressure', name: 'Pressure', visual: 'badge', decimals: 0 },
  { entity: 'sensor.uv_index', name: 'UV index', visual: 'bar', min: 0, max: 11, rules: [ { below: 3, color: 'green', label: 'Low' }, { below: 6, color: 'amber', label: 'Moderate' }, { below: 8, color: 'orange', label: 'High' }, { above: 8, color: 'red', label: 'Very high' } ] } ] }" width="full" />
<LiveCard :config="{ type: 'custom:entity-group-card', title: 'Living room', icon: 'mdi:sofa', entities: [
  { entity: 'light.living_room', toggle: true, rules: [ { state: 'on', color: 'amber', label: 'On' }, { state: 'off', color: 'grey', label: 'Off' } ] },
  { entity: 'light.dining_table', toggle: true, rules: [ { state: 'on', color: 'amber', label: 'On' }, { state: 'off', color: 'grey', label: 'Off' } ] },
  { entity: 'sensor.living_room_temperature', name: 'Temperature', decimals: 1, rules: [ { below: 19, color: 'blue', label: 'Cold' }, { below: 24, color: 'green', label: 'Comfortable' }, { above: 24, color: 'orange', label: 'Warm' } ] },
  { entity: 'sensor.living_room_co2', name: 'CO₂', visual: 'strip', rules: [ { below: 800, color: 'green' }, { below: 1200, color: 'amber' }, { above: 1200, color: 'red' } ] },
  { entity: 'cover.living_room_blinds', name: 'Blinds', attribute: 'current_position', unit: '%', visual: 'bar', icon: 'mdi:window-shutter' } ] }" width="full" />
<LiveCard :config="{ type: 'custom:multi-trend-card', title: 'Temperature & dew point', icon: 'mdi:thermometer', hours_to_show: 12, x_axis: true, entities: [ { entity: 'sensor.outdoor_temperature', name: 'Temperature', color: 'red' }, { entity: 'sensor.dew_point', name: 'Dew point', color: 'blue' } ] }" width="full" />
<LiveCard :config="{ type: 'custom:sun-path-card', title: 'Sun today' }" width="full" />
</div>

## Built with AI

Pro Cards is built with the help of AI. Code, docs and tests are written together with AI coding agents, reviewed and tested by a human before each release. Found something off? [Open an issue](https://github.com/malte-wessel/pro-cards/issues).
