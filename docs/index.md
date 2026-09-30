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
      text: Weather card
      link: /cards/weather-card
    - theme: alt
      text: Wind card
      link: /cards/wind-card
    - theme: alt
      text: Playground
      link: /playground
features:
  - icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M4 11.5 12 4l8 7.5"/><path d="M6.5 10v9.5h11V10"/><path d="M10 19.5v-5h4v5"/></svg>'
    title: Looks like Home Assistant
    details: Same spacing, typography, colours and state colours as the built-in tile cards, dark mode included. A custom theme restyles every card at once. Switch any example on this site to Graphite to see it.
  - icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="8.5" cy="12" r="2"/><path d="M13 10.5h5M13 13.5h3"/></svg>'
    title: Value drives the look
    details: Rules switch icon, colour, label and even the card tint by value or state. Jinja templates for names, values and secondary text.
  - icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M4 7h10M18 7h2M4 12h3M11 12h9M4 17h12M20 17h0"/><circle cx="16" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="18" cy="17" r="2"/></svg>'
    title: Every detail adjustable
    details: One entity as a tile or many as list, grid, hero, row, column, table or sections. Icon, ring, gauge, bar, sparkline, columns, badge or strip. Tap, hold and double-tap actions.
  - icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M3 17l5-6 4 4 4-6 5 3"/><circle cx="19" cy="6" r="2.5"/><path d="M4 21h16"/></svg>'
    title: Trends, sun, light, wind, rain and power
    details: Multi sensor trend graphs with tooltips, today's sun path with dawn and dusk, illuminance on a log scale with zones, the weather with its hourly and daily forecast, the wind and the rain as animated flows, the home's power as an animated tree.
---

## Live on this site

Every example on these pages is the real card code running against a simulated home. Values drift, switches toggle, templates render, the wind blows. Hover the graphs, click the tiles, and use the picker in a frame's corner to see every example in a different theme (the second card here is pinned to [Graphite](https://github.com/TilmanGriesel/graphite)).

Each card page starts with the smallest possible configuration and adds one option at a time, so you can stop as soon as the card looks the way you want.

<div class="live-strip">
<LiveCard :config="{ type: 'custom:weather-card', entity: 'weather.home', title: 'Weather', temperature_rules: [ { below: 12, color: 'blue', label: 'Cool' }, { below: 20, color: 'green', label: 'Mild' }, { above: 20, color: 'amber', label: 'Warm' } ], sections: [ { type: 'hero' }, { type: 'row', entities: [ 'humidity', 'wind_speed' ] }, { type: 'forecast', mode: 'daily', days: 5 } ] }" width="full" />
<LiveCard :config="{ type: 'custom:entity-group-card', layout: 'hero', title: 'Weather station', icon: 'mdi:weather-partly-cloudy', hours_to_show: 24, entities: [
  { entity: 'sensor.outdoor_temperature', name: 'Temperature', visual: 'sparkline', decimals: 1, rules: [ { below: 0, color: 'indigo', icon: 'mdi:snowflake', label: 'Frost', tint_card: true }, { below: 16, color: 'blue', icon: 'mdi:thermometer-low', label: 'Cool' }, { below: 26, color: 'green', icon: 'mdi:thermometer', label: 'Pleasant' }, { above: 26, color: 'orange', icon: 'mdi:thermometer-high', label: 'Hot', tint_card: true } ] },
  { entity: 'sensor.outdoor_humidity', name: 'Humidity', visual: 'badge' }, { entity: 'sensor.wind_speed', name: 'Wind', visual: 'badge' }, { entity: 'sensor.pressure', name: 'Pressure', visual: 'badge', decimals: 0 },
  { entity: 'sensor.uv_index', name: 'UV index', visual: 'bar', min: 0, max: 11, rules: [ { below: 3, color: 'green', label: 'Low' }, { below: 6, color: 'amber', label: 'Moderate' }, { below: 8, color: 'orange', label: 'High' }, { above: 8, color: 'red', label: 'Very high' } ] } ] }" width="full" />
<LiveCard :config="{ type: 'custom:entity-group-card', title: 'Living room', icon: 'mdi:sofa', entities: [
  { entity: 'light.living_room', toggle: true, rules: [ { state: 'on', color: 'amber', label: 'On' }, { state: 'off', color: 'grey', label: 'Off' } ] },
  { entity: 'light.dining_table', toggle: true, rules: [ { state: 'on', color: 'amber', label: 'On' }, { state: 'off', color: 'grey', label: 'Off' } ] },
  { entity: 'sensor.living_room_temperature', name: 'Temperature', decimals: 1, rules: [ { below: 19, color: 'blue', label: 'Cold' }, { below: 24, color: 'green', label: 'Comfortable' }, { above: 24, color: 'orange', label: 'Warm' } ] },
  { entity: 'sensor.living_room_co2', name: 'CO₂', visual: 'strip', rules: [ { below: 800, color: 'green' }, { below: 1200, color: 'amber' }, { above: 1200, color: 'red' } ] },
  { entity: 'cover.living_room_blinds', name: 'Blinds', attribute: 'current_position', unit: '%', visual: 'bar', icon: 'mdi:window-shutter' } ] }" width="full" theme="graphite" />
<LiveCard :config="{ type: 'custom:wind-card', entity: 'sensor.wind_speed', direction: 'sensor.wind_direction', gust: 'sensor.wind_gust', title: 'Wind', layout: 'hero', flow: { style: 'swoosh' }, rules: [ { below: 5, color: 'blue-grey', label: 'Calm' }, { below: 20, color: 'teal', label: 'Light breeze' }, { below: 35, color: 'amber', label: 'Fresh' }, { above: 35, color: 'red', label: 'Storm', tint_card: true } ] }" width="full" />
<LiveCard :config="{ type: 'custom:rain-card', entity: 'sensor.rain_rate_roof', today: 'sensor.rain_today', wind: 'sensor.wind_speed', direction: 'sensor.wind_direction', title: 'Rain', layout: 'hero', rules: [ { below: 0.1, color: 'blue-grey', label: 'Dry' }, { below: 2.5, color: 'light-blue', label: 'Light rain' }, { below: 7.6, color: 'blue', label: 'Moderate rain' }, { above: 7.6, color: 'indigo', label: 'Heavy rain', tint_card: true } ] }" width="full" />
<LiveCard :config="{ type: 'custom:power-flow-card', title: 'Energy', icon: 'mdi:lightning-bolt', home: 'sensor.power_consumption', sources: [ { type: 'solar', entity: 'sensor.solar_power' }, { type: 'battery', power: 'sensor.battery_power', soc: 'sensor.battery_soc' }, { type: 'grid', power: 'sensor.grid_power' } ], consumers: [ { entity: 'sensor.heat_pump_power', name: 'Heat pump', icon: 'mdi:heat-pump' }, { entity: 'sensor.washer_power', name: 'Washer', icon: 'mdi:washing-machine' }, { entity: 'sensor.office_power', name: 'Office', icon: 'mdi:monitor' } ] }" width="full" />
<LiveCard :config="{ type: 'custom:multi-trend-card', title: 'Temperature & dew point', icon: 'mdi:thermometer', hours_to_show: 12, x_axis: true, entities: [ { entity: 'sensor.outdoor_temperature', name: 'Temperature', color: 'red' }, { entity: 'sensor.dew_point', name: 'Dew point', color: 'blue' } ] }" width="full" />
<LiveCard :config="{ type: 'custom:sun-path-card', title: 'Sun today' }" width="full" />
</div>

## Built with AI

Pro Cards is built with the help of AI. Code, docs and tests are written together with AI coding agents, reviewed and tested by a human before each release. Found something off? [Open an issue](https://github.com/malte-wessel/pro-cards/issues).
