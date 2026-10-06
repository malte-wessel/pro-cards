---
layout: home
hero:
  name: Pro Cards
  text: High-quality, flexible cards for Home Assistant.
  tagline: Cards that match the look and feel of Home Assistant and adapt to your dashboard with rules, templates, layouts and animated flows. Installed with HACS, styled by your theme.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Entity Card Pro
      link: /cards/entity-card
    - theme: alt
      text: Power Flow Card Pro
      link: /cards/power-flow-card
    - theme: alt
      text: Weather Card Pro
      link: /cards/weather-card
features:
  - icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M4 11.5 12 4l8 7.5"/><path d="M6.5 10v9.5h11V10"/><path d="M10 19.5v-5h4v5"/></svg>'
    title: Looks like Home Assistant
    details: The spacing, typography and state colours of the built-in tile cards, dark mode included. Your theme restyles every card at once.
  - icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="8.5" cy="12" r="2"/><path d="M13 10.5h5M13 13.5h3"/></svg>'
    title: Value drives the look
    details: Rules switch icon, colour, label and the card tint by value or state. Templates for names, values and secondary text.
  - icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M4 7h10M18 7h2M4 12h3M11 12h9M4 17h12M20 17h0"/><circle cx="16" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="18" cy="17" r="2"/></svg>'
    title: One entity or a whole room
    details: A single tile, or many entities as list, grid, hero, row, column, table or sections. Ring, gauge, bar, sparkline, badge or strip. Switches, sliders, steppers and buttons on the card, plus tap, hold and double-tap actions.
  - icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M3 17l5-6 4 4 4-6 5 3"/><circle cx="19" cy="6" r="2.5"/><path d="M4 21h16"/></svg>'
    title: Weather, energy and light
    details: The weather with its forecast, where the power flows, trends for any sensor, today's sun path, daylight on a log scale, and the wind and the rain as animated flows.
---

### Energy dashboard

The power flow card with rooms, price and outage, an entity group card as a hero with rules, plain tiles, a ring, columns and sparkline visuals, and a multi trend card in lanes.

<DashboardGrid b64="LSBjb2x1bW5fc3BhbjogMgogIGNhcmRzOgogICAgLSB7IHR5cGU6IGhlYWRpbmcsIGhlYWRpbmc6IFBvd2VyLCBpY29uOiBtZGk6bGlnaHRuaW5nLWJvbHQgfQogICAgLSB0eXBlOiBjdXN0b206cG93ZXItZmxvdy1jYXJkLXBybwogICAgICBob21lOiBzZW5zb3IucG93ZXJfY29uc3VtcHRpb24KICAgICAgc291cmNlczoKICAgICAgICAtIHsgdHlwZTogc29sYXIsIGVudGl0eTogc2Vuc29yLnNvbGFyX3Bvd2VyIH0KICAgICAgICAtIHsgdHlwZTogYmF0dGVyeSwgcG93ZXI6IHNlbnNvci5iYXR0ZXJ5X3Bvd2VyLCBzb2M6IHNlbnNvci5iYXR0ZXJ5X3NvYyB9CiAgICAgICAgLSB0eXBlOiBncmlkCiAgICAgICAgICBwb3dlcjogc2Vuc29yLmdyaWRfcG93ZXIKICAgICAgICAgIHByaWNlOiBzZW5zb3IuZWxlY3RyaWNpdHlfcHJpY2UKICAgICAgICAgIG9mZmxpbmU6IGJpbmFyeV9zZW5zb3IuZ3JpZF9vdXRhZ2UKICAgICAgICAgIGZvc3NpbDogc2Vuc29yLmdyaWRfZm9zc2lsX3BlcmNlbnRhZ2UKICAgICAgY29uc3VtZXJzOgogICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5oZWF0X3B1bXBfcG93ZXIsIG5hbWU6IEhlYXQgcHVtcCwgaWNvbjogbWRpOmhlYXQtcHVtcCB9CiAgICAgICAgLSBncm91cDogTGF1bmRyeQogICAgICAgICAgaWNvbjogbWRpOndhc2hpbmctbWFjaGluZQogICAgICAgICAgZW50aXRpZXM6CiAgICAgICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci53YXNoZXJfcG93ZXIsIG5hbWU6IFdhc2hlciwgaWNvbjogbWRpOndhc2hpbmctbWFjaGluZSB9CiAgICAgICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5kcnllcl9wb3dlciwgbmFtZTogRHJ5ZXIsIGljb246IG1kaTp0dW1ibGUtZHJ5ZXIgfQogICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5vZmZpY2VfcG93ZXIsIG5hbWU6IE9mZmljZSwgaWNvbjogbWRpOm1vbml0b3IgfQogICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5ldl9jaGFyZ2VyX3Bvd2VyLCBuYW1lOiBFViBjaGFyZ2VyLCBpY29uOiBtZGk6ZXYtc3RhdGlvbiB9CiAgICAtIHsgdHlwZTogaGVhZGluZywgaGVhZGluZzogVG9kYXksIGljb246IG1kaTpjYWxlbmRhci10b2RheSB9CiAgICAtIHsgdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybywgZW50aXR5OiBzZW5zb3IuZW5lcmd5X3RvZGF5LCBuYW1lOiBVc2VkIHRvZGF5LCBpY29uOiBtZGk6aG9tZS1saWdodG5pbmctYm9sdCwgZ3JpZF9vcHRpb25zOiB7IGNvbHVtbnM6IDMgfSB9CiAgICAtIHsgdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybywgZW50aXR5OiBzZW5zb3IuZWxlY3RyaWNpdHlfcHJpY2UsIG5hbWU6IFByaWNlLCBpY29uOiBtZGk6Y2FzaCwgZ3JpZF9vcHRpb25zOiB7IGNvbHVtbnM6IDMgfSB9CiAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8KICAgICAgZW50aXR5OiBzZW5zb3IuYmF0dGVyeV9zb2MKICAgICAgbmFtZTogQmF0dGVyeSBjaGFyZ2UKICAgICAgdmlzdWFsOiByaW5nCiAgICAgIHJ1bGVzOgogICAgICAgIC0geyBiZWxvdzogMjAsIGNvbG9yOiByZWQsIGxhYmVsOiBMb3cgfQogICAgICAgIC0geyBiZWxvdzogNTAsIGNvbG9yOiBhbWJlciB9CiAgICAgICAgLSB7IGFib3ZlOiA1MCwgY29sb3I6IGdyZWVuIH0KICAgICAgZ3JpZF9vcHRpb25zOiB7IGNvbHVtbnM6IDMgfQogICAgLSB7IHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8sIGVudGl0eTogc2Vuc29yLmdyaWRfZm9zc2lsX3BlcmNlbnRhZ2UsIG5hbWU6IEZvc3NpbCBzaGFyZSwgaWNvbjogbWRpOm1vbGVjdWxlLWNvMiwgZ3JpZF9vcHRpb25zOiB7IGNvbHVtbnM6IDMgfSB9CiAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8KICAgICAgZW50aXR5OiBzZW5zb3IuZ3JpZF9wb3dlcgogICAgICBuYW1lOiBHcmlkCiAgICAgIGRlY2ltYWxzOiAwCiAgICAgIHZpc3VhbDogY29sdW1ucwogICAgICBob3Vyc190b19zaG93OiAxMgogICAgICBidWNrZXRfbWludXRlczogMzAKICAgICAgcnVsZXM6CiAgICAgICAgLSB7IGJlbG93OiAwLCBjb2xvcjogZ3JlZW4sIGxhYmVsOiBFeHBvcnRpbmcgfQogICAgICAgIC0geyBhYm92ZTogMCwgY29sb3I6IGJsdWUsIGxhYmVsOiBJbXBvcnRpbmcgfQogICAgICBncmlkX29wdGlvbnM6IHsgY29sdW1uczogNiB9CiAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8KICAgICAgZW50aXR5OiBzZW5zb3IuYmF0dGVyeV9wb3dlcgogICAgICBuYW1lOiBCYXR0ZXJ5CiAgICAgIGRlY2ltYWxzOiAwCiAgICAgIHZpc3VhbDogc3BhcmtsaW5lCiAgICAgIGhvdXJzX3RvX3Nob3c6IDEyCiAgICAgIGJ1Y2tldF9taW51dGVzOiAzMAogICAgICBydWxlczoKICAgICAgICAtIHsgYmVsb3c6IDAsIGNvbG9yOiB0ZWFsLCBsYWJlbDogQ2hhcmdpbmcgfQogICAgICAgIC0geyBhYm92ZTogMCwgY29sb3I6IGFtYmVyLCBsYWJlbDogRGlzY2hhcmdpbmcgfQogICAgICBncmlkX29wdGlvbnM6IHsgY29sdW1uczogNiB9Ci0gY29sdW1uX3NwYW46IDEKICBjYXJkczoKICAgIC0geyB0eXBlOiBoZWFkaW5nLCBoZWFkaW5nOiBDYXIsIGljb246IG1kaTpjYXItZWxlY3RyaWMgfQogICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWdyb3VwLWNhcmQtcHJvCiAgICAgIHRpdGxlOiBFbGVjdHJpYyBjYXIKICAgICAgaWNvbjogbWRpOmNhci1lbGVjdHJpYwogICAgICBsYXlvdXQ6IGhlcm8KICAgICAgaG91cnNfdG9fc2hvdzogMTIKICAgICAgZW50aXRpZXM6CiAgICAgICAgLSBlbnRpdHk6IHNlbnNvci5ldl9iYXR0ZXJ5CiAgICAgICAgICBuYW1lOiBCYXR0ZXJ5CiAgICAgICAgICB2aXN1YWw6IHJpbmcKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgYmVsb3c6IDIwLCBjb2xvcjogcmVkLCBsYWJlbDogTG93IH0KICAgICAgICAgICAgLSB7IGJlbG93OiA1MCwgY29sb3I6IGFtYmVyIH0KICAgICAgICAgICAgLSB7IGFib3ZlOiA1MCwgY29sb3I6IGdyZWVuIH0KICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3IuZXZfcmFuZ2UsIG5hbWU6IFJhbmdlLCBpY29uOiBtZGk6bWFwLW1hcmtlci1kaXN0YW5jZSB9CiAgICAgICAgLSBlbnRpdHk6IHNlbnNvci5ldl9jaGFyZ2VyX3Bvd2VyCiAgICAgICAgICBuYW1lOiBDaGFyZ2VyCiAgICAgICAgICBkZWNpbWFsczogMAogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBiZWxvdzogMCwgY29sb3I6IHRlYWwsIGljb246IG1kaTpiYXR0ZXJ5LWFycm93LXVwLCBsYWJlbDogRmVlZGluZyBob21lIH0KICAgICAgICAgICAgLSB7IGJlbG93OiAxMCwgY29sb3I6IGdyZXksIGljb246IG1kaTpldi1zdGF0aW9uLCBsYWJlbDogSWRsZSB9CiAgICAgICAgICAgIC0geyBhYm92ZTogMTAsIGNvbG9yOiBncmVlbiwgaWNvbjogbWRpOmV2LXBsdWctdHlwZTIsIGxhYmVsOiBDaGFyZ2luZyB9CiAgICAgICAgLSBlbnRpdHk6IGJpbmFyeV9zZW5zb3IuZXZfcGx1Z2dlZAogICAgICAgICAgbmFtZTogQ2FibGUKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgc3RhdGU6ICJvbiIsIGNvbG9yOiBncmVlbiwgaWNvbjogbWRpOnBvd2VyLXBsdWcsIGxhYmVsOiBQbHVnZ2VkIGluIH0KICAgICAgICAgICAgLSB7IHN0YXRlOiAib2ZmIiwgY29sb3I6IGdyZXksIGljb246IG1kaTpwb3dlci1wbHVnLW9mZiwgbGFiZWw6IFVucGx1Z2dlZCB9CiAgICAtIHsgdHlwZTogaGVhZGluZywgaGVhZGluZzogU29sYXIsIGljb246IG1kaTpzb2xhci1wb3dlciB9CiAgICAtIHR5cGU6IGN1c3RvbTptdWx0aS10cmVuZC1jYXJkLXBybwogICAgICB0aXRsZTogU29sYXIKICAgICAgaWNvbjogbWRpOnNvbGFyLXBvd2VyLXZhcmlhbnQKICAgICAgaG91cnNfdG9fc2hvdzogMTIKICAgICAgbGF5b3V0OiBsYW5lcwogICAgICBlbnRpdGllczoKICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3Iuc29sYXJfZWFzdCwgbmFtZTogRWFzdCByb29mLCBjb2xvcjogYW1iZXIgfQogICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5zb2xhcl93ZXN0LCBuYW1lOiBXZXN0IHJvb2YsIGNvbG9yOiBvcmFuZ2UgfQo=">

```yaml
- column_span: 2
  cards:
    - { type: heading, heading: Power, icon: mdi:lightning-bolt }
    - type: custom:power-flow-card-pro
      home: sensor.power_consumption
      sources:
        - { type: solar, entity: sensor.solar_power }
        - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
        - type: grid
          power: sensor.grid_power
          price: sensor.electricity_price
          offline: binary_sensor.grid_outage
          fossil: sensor.grid_fossil_percentage
      consumers:
        - { entity: sensor.heat_pump_power, name: Heat pump, icon: mdi:heat-pump }
        - group: Laundry
          icon: mdi:washing-machine
          entities:
            - { entity: sensor.washer_power, name: Washer, icon: mdi:washing-machine }
            - { entity: sensor.dryer_power, name: Dryer, icon: mdi:tumble-dryer }
        - { entity: sensor.office_power, name: Office, icon: mdi:monitor }
        - { entity: sensor.ev_charger_power, name: EV charger, icon: mdi:ev-station }
    - { type: heading, heading: Today, icon: mdi:calendar-today }
    - { type: custom:entity-card-pro, entity: sensor.energy_today, name: Used today, icon: mdi:home-lightning-bolt, grid_options: { columns: 3 } }
    - { type: custom:entity-card-pro, entity: sensor.electricity_price, name: Price, icon: mdi:cash, grid_options: { columns: 3 } }
    - type: custom:entity-card-pro
      entity: sensor.battery_soc
      name: Battery charge
      visual: ring
      rules:
        - { below: 20, color: red, label: Low }
        - { below: 50, color: amber }
        - { above: 50, color: green }
      grid_options: { columns: 3 }
    - { type: custom:entity-card-pro, entity: sensor.grid_fossil_percentage, name: Fossil share, icon: mdi:molecule-co2, grid_options: { columns: 3 } }
    - type: custom:entity-card-pro
      entity: sensor.grid_power
      name: Grid
      decimals: 0
      visual: columns
      hours_to_show: 12
      bucket_minutes: 30
      rules:
        - { below: 0, color: green, label: Exporting }
        - { above: 0, color: blue, label: Importing }
      grid_options: { columns: 6 }
    - type: custom:entity-card-pro
      entity: sensor.battery_power
      name: Battery
      decimals: 0
      visual: sparkline
      hours_to_show: 12
      bucket_minutes: 30
      rules:
        - { below: 0, color: teal, label: Charging }
        - { above: 0, color: amber, label: Discharging }
      grid_options: { columns: 6 }
- column_span: 1
  cards:
    - { type: heading, heading: Car, icon: mdi:car-electric }
    - type: custom:entity-group-card-pro
      title: Electric car
      icon: mdi:car-electric
      layout: hero
      hours_to_show: 12
      entities:
        - entity: sensor.ev_battery
          name: Battery
          visual: ring
          rules:
            - { below: 20, color: red, label: Low }
            - { below: 50, color: amber }
            - { above: 50, color: green }
        - { entity: sensor.ev_range, name: Range, icon: mdi:map-marker-distance }
        - entity: sensor.ev_charger_power
          name: Charger
          decimals: 0
          rules:
            - { below: 0, color: teal, icon: mdi:battery-arrow-up, label: Feeding home }
            - { below: 10, color: grey, icon: mdi:ev-station, label: Idle }
            - { above: 10, color: green, icon: mdi:ev-plug-type2, label: Charging }
        - entity: binary_sensor.ev_plugged
          name: Cable
          rules:
            - { state: "on", color: green, icon: mdi:power-plug, label: Plugged in }
            - { state: "off", color: grey, icon: mdi:power-plug-off, label: Unplugged }
    - { type: heading, heading: Solar, icon: mdi:solar-power }
    - type: custom:multi-trend-card-pro
      title: Solar
      icon: mdi:solar-power-variant
      hours_to_show: 12
      layout: lanes
      entities:
        - { entity: sensor.solar_east, name: East roof, color: amber }
        - { entity: sensor.solar_west, name: West roof, color: orange }
```

</DashboardGrid>

### Overview dashboard

Entity sections cards with row and table layouts, badges coloured by state, template tiles that count and tint the card, controls (switches, a brightness slider, blind and TV buttons, mode and scene buttons), a strip, a bar, and a multi trend card.

<DashboardGrid b64="LSBjb2x1bW5fc3BhbjogMQogIGNhcmRzOgogICAgLSB7IHR5cGU6IGhlYWRpbmcsIGhlYWRpbmc6IEhvbWUsIGljb246IG1kaTpob21lIH0KICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1zZWN0aW9ucy1jYXJkLXBybwogICAgICB0aXRsZTogV2hvJ3MgaG9tZQogICAgICBpY29uOiBtZGk6c2hpZWxkLWhvbWUKICAgICAgc2hvd19pY29uOiB0cnVlCiAgICAgIHNlY3Rpb25zOgogICAgICAgIC0gbGF5b3V0OiByb3cKICAgICAgICAgIGFsaWduOiBzcGFjZS1iZXR3ZWVuCiAgICAgICAgICBlbnRpdGllczoKICAgICAgICAgICAgLSB7IGVudGl0eTogcGVyc29uLmFsZXgsIG5hbWU6IEFsZXgsIHZpc3VhbDogYmFkZ2UsIHJ1bGVzOiAmcCBbeyBzdGF0ZTogaG9tZSwgY29sb3I6IGdyZWVuLCBsYWJlbDogSG9tZSB9LCB7IHN0YXRlOiBub3RfaG9tZSwgY29sb3I6IGdyZXksIGxhYmVsOiBBd2F5IH1dIH0KICAgICAgICAgICAgLSB7IGVudGl0eTogcGVyc29uLnNhbSwgbmFtZTogU2FtLCB2aXN1YWw6IGJhZGdlLCBydWxlczogKnAgfQogICAgICAgICAgICAtIHsgZW50aXR5OiBwZXJzb24ua2ltLCBuYW1lOiBLaW0sIHZpc3VhbDogYmFkZ2UsIHJ1bGVzOiAqcCB9CiAgICAgICAgLSBsYXlvdXQ6IHRhYmxlCiAgICAgICAgICBkaXZpZGVyOiB0cnVlCiAgICAgICAgICBlbnRpdGllczoKICAgICAgICAgICAgLSB7IGVudGl0eTogYmluYXJ5X3NlbnNvci5kb29yX2Zyb250LCBuYW1lOiBGcm9udCBkb29yLCB2aXN1YWw6IGJhZGdlLCBydWxlczogW3sgc3RhdGU6ICJvbiIsIGNvbG9yOiByZWQsIGljb246IG1kaTpkb29yLW9wZW4sIGxhYmVsOiBPcGVuIH0sIHsgc3RhdGU6ICJvZmYiLCBjb2xvcjogZ3JlZW4sIGljb246IG1kaTpkb29yLWNsb3NlZCwgbGFiZWw6IENsb3NlZCB9XSB9CiAgICAgICAgICAgIC0geyBlbnRpdHk6IGJpbmFyeV9zZW5zb3Iud2luZG93X2tpdGNoZW4sIG5hbWU6IEtpdGNoZW4gd2luZG93LCB2aXN1YWw6IGJhZGdlLCBydWxlczogJncgW3sgc3RhdGU6ICJvbiIsIGNvbG9yOiByZWQsIGljb246IG1kaTp3aW5kb3ctb3BlbiwgbGFiZWw6IE9wZW4gfSwgeyBzdGF0ZTogIm9mZiIsIGNvbG9yOiBncmVlbiwgaWNvbjogbWRpOndpbmRvdy1jbG9zZWQsIGxhYmVsOiBDbG9zZWQgfV0gfQogICAgICAgICAgICAtIHsgZW50aXR5OiBiaW5hcnlfc2Vuc29yLndpbmRvd19iYXRocm9vbSwgbmFtZTogQmF0aHJvb20gd2luZG93LCB2aXN1YWw6IGJhZGdlLCBydWxlczogKncgfQogICAgICAgICAgICAtIHsgZW50aXR5OiBiaW5hcnlfc2Vuc29yLm1vdGlvbl9oYWxsd2F5LCBuYW1lOiBIYWxsd2F5IG1vdGlvbiwgdmlzdWFsOiBiYWRnZSwgcnVsZXM6IFt7IHN0YXRlOiAib24iLCBjb2xvcjogYW1iZXIsIGljb246IG1kaTptb3Rpb24tc2Vuc29yLCBsYWJlbDogRGV0ZWN0ZWQgfSwgeyBzdGF0ZTogIm9mZiIsIGNvbG9yOiBncmV5LCBpY29uOiBtZGk6bW90aW9uLXNlbnNvci1vZmYsIGxhYmVsOiBDbGVhciB9XSB9CiAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8KICAgICAgZW50aXR5OiBiaW5hcnlfc2Vuc29yLndpbmRvd19raXRjaGVuCiAgICAgIG5hbWU6IE9wZW4gd2luZG93cwogICAgICBpY29uOiBtZGk6d2luZG93LW9wZW4tdmFyaWFudAogICAgICB2YWx1ZTogInt7IHN0YXRlcy5iaW5hcnlfc2Vuc29yIHwgc2VsZWN0YXR0cignYXR0cmlidXRlcy5kZXZpY2VfY2xhc3MnLCAnZXEnLCAnd2luZG93JykgfCBzZWxlY3RhdHRyKCdzdGF0ZScsICdlcScsICdvbicpIHwgbGlzdCB8IGNvdW50IH19IgogICAgICBydWxlczoKICAgICAgICAtIHsgYmVsb3c6IDEsIGNvbG9yOiBncmVlbiwgbGFiZWw6IEFsbCBjbG9zZWQgfQogICAgICAgIC0geyBhYm92ZTogMSwgY29sb3I6IHJlZCwgbGFiZWw6IEFpcmluZywgdGludF9jYXJkOiB0cnVlIH0KICAgICAgZ3JpZF9vcHRpb25zOiB7IGNvbHVtbnM6IDYgfQogICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvCiAgICAgIGVudGl0eTogbGlnaHQubGl2aW5nX3Jvb20KICAgICAgbmFtZTogTGlnaHRzIG9uCiAgICAgIGljb246IG1kaTpsaWdodGJ1bGItZ3JvdXAKICAgICAgdmFsdWU6ICJ7eyBzdGF0ZXMubGlnaHQgfCBzZWxlY3RhdHRyKCdzdGF0ZScsICdlcScsICdvbicpIHwgbGlzdCB8IGNvdW50IH19IgogICAgICBzdWZmaXg6ICIgb2YgOCIKICAgICAgcnVsZXM6CiAgICAgICAgLSB7IGJlbG93OiAxLCBjb2xvcjogZ3JleSwgbGFiZWw6IEFsbCBvZmYgfQogICAgICAgIC0geyBhYm92ZTogMSwgY29sb3I6IGFtYmVyLCBsYWJlbDogU29tZSBvbiB9CiAgICAgIGdyaWRfb3B0aW9uczogeyBjb2x1bW5zOiA2IH0KICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICBlbnRpdHk6IHNlbnNvci53YXNoZXJfc3RhdHVzCiAgICAgIG5hbWU6IFdhc2hpbmcgbWFjaGluZQogICAgICBzZWNvbmRhcnk6ICJ7eyBzdGF0ZXMoJ3NlbnNvci53YXNoZXJfcmVtYWluaW5nJykgfX0gbWluIGxlZnQiCiAgICAgIHZpc3VhbDogYmFkZ2UKICAgICAgcnVsZXM6CiAgICAgICAgLSB7IHN0YXRlOiBydW4sIGNvbG9yOiBncmVlbiwgaWNvbjogbWRpOndhc2hpbmctbWFjaGluZSwgbGFiZWw6IFJ1bm5pbmcgfQogICAgICAgIC0geyBzdGF0ZTogZW5kLCBjb2xvcjogdGVhbCwgaWNvbjogbWRpOndhc2hpbmctbWFjaGluZS1hbGVydCwgbGFiZWw6IERvbmUsIHRpbnRfY2FyZDogdHJ1ZSB9CiAgICAgICAgLSB7IHN0YXRlOiBwb3dlcl9vZmYsIGNvbG9yOiBncmV5LCBpY29uOiBtZGk6d2FzaGluZy1tYWNoaW5lLW9mZiwgbGFiZWw6ICJPZmYiIH0KICAgICAgZ3JpZF9vcHRpb25zOiB7IGNvbHVtbnM6IDYgfQogICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvCiAgICAgIGVudGl0eTogdmFjdXVtLnJvYm90CiAgICAgIG5hbWU6IFJvYm90IHZhY3V1bQogICAgICBzZWNvbmRhcnk6ICJ7eyBzdGF0ZXMoJ3NlbnNvci5yb2JvdF9jdXJyZW50X3Jvb20nKSB9fSDCtyB7eyBzdGF0ZXMoJ3NlbnNvci5yb2JvdF9iYXR0ZXJ5JykgfX0gJSIKICAgICAgdmlzdWFsOiBiYWRnZQogICAgICBydWxlczoKICAgICAgICAtIHsgc3RhdGU6IGRvY2tlZCwgY29sb3I6IGdyZWVuLCBpY29uOiBtZGk6cm9ib3QtdmFjdXVtLCBsYWJlbDogRG9ja2VkIH0KICAgICAgICAtIHsgc3RhdGU6IGNsZWFuaW5nLCBjb2xvcjogYmx1ZSwgaWNvbjogbWRpOnJvYm90LXZhY3V1bSwgbGFiZWw6IENsZWFuaW5nIH0KICAgICAgICAtIHsgc3RhdGU6IHJldHVybmluZywgY29sb3I6IHRlYWwsIGljb246IG1kaTpob21lLWltcG9ydC1vdXRsaW5lLCBsYWJlbDogUmV0dXJuaW5nIH0KICAgICAgZ3JpZF9vcHRpb25zOiB7IGNvbHVtbnM6IDYgfQotIGNvbHVtbl9zcGFuOiAxCiAgY2FyZHM6CiAgICAtIHsgdHlwZTogaGVhZGluZywgaGVhZGluZzogUm9vbXMsIGljb246IG1kaTpmbG9vci1wbGFuIH0KICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1ncm91cC1jYXJkLXBybwogICAgICB0aXRsZTogTGl2aW5nIHJvb20KICAgICAgaWNvbjogbWRpOnNvZmEKICAgICAgZW50aXRpZXM6CiAgICAgICAgLSBlbnRpdHk6IGxpZ2h0LmxpdmluZ19yb29tCiAgICAgICAgICBjb250cm9sOiBhdXRvCiAgICAgICAgICBydWxlczoKICAgICAgICAgICAgLSB7IHN0YXRlOiAib24iLCBjb2xvcjogYW1iZXIsIGxhYmVsOiAiT24iIH0KICAgICAgICAgICAgLSB7IHN0YXRlOiAib2ZmIiwgY29sb3I6IGdyZXksIGxhYmVsOiAiT2ZmIiB9CiAgICAgICAgLSBlbnRpdHk6IGxpZ2h0LmRpbmluZ190YWJsZQogICAgICAgICAgY29udHJvbDogdG9nZ2xlCiAgICAgICAgICBydWxlczoKICAgICAgICAgICAgLSB7IHN0YXRlOiAib24iLCBjb2xvcjogYW1iZXIsIGxhYmVsOiAiT24iIH0KICAgICAgICAgICAgLSB7IHN0YXRlOiAib2ZmIiwgY29sb3I6IGdyZXksIGxhYmVsOiAiT2ZmIiB9CiAgICAgICAgLSBlbnRpdHk6IHNlbnNvci5saXZpbmdfcm9vbV90ZW1wZXJhdHVyZQogICAgICAgICAgbmFtZTogVGVtcGVyYXR1cmUKICAgICAgICAgIGRlY2ltYWxzOiAxCiAgICAgICAgICBydWxlczoKICAgICAgICAgICAgLSB7IGJlbG93OiAxOSwgY29sb3I6IGJsdWUsIGxhYmVsOiBDb2xkIH0KICAgICAgICAgICAgLSB7IGJlbG93OiAyNCwgY29sb3I6IGdyZWVuLCBsYWJlbDogQ29tZm9ydGFibGUgfQogICAgICAgICAgICAtIHsgYWJvdmU6IDI0LCBjb2xvcjogb3JhbmdlLCBsYWJlbDogV2FybSB9CiAgICAgICAgLSBlbnRpdHk6IHNlbnNvci5saXZpbmdfcm9vbV9jbzIKICAgICAgICAgIG5hbWU6IENP4oKCCiAgICAgICAgICB2aXN1YWw6IHN0cmlwCiAgICAgICAgICBydWxlczoKICAgICAgICAgICAgLSB7IGJlbG93OiA4MDAsIGNvbG9yOiBncmVlbiB9CiAgICAgICAgICAgIC0geyBiZWxvdzogMTIwMCwgY29sb3I6IGFtYmVyIH0KICAgICAgICAgICAgLSB7IGFib3ZlOiAxMjAwLCBjb2xvcjogcmVkIH0KICAgICAgICAtIHsgZW50aXR5OiBjb3Zlci5saXZpbmdfcm9vbV9ibGluZHMsIG5hbWU6IEJsaW5kcywgaWNvbjogbWRpOndpbmRvdy1zaHV0dGVyLCBhdHRyaWJ1dGU6IGN1cnJlbnRfcG9zaXRpb24sIHVuaXQ6ICIlIiwgY29udHJvbDogYXV0byB9CiAgICAgICAgLSBlbnRpdHk6IG1lZGlhX3BsYXllci5saXZpbmdfcm9vbV90dgogICAgICAgICAgbmFtZTogVFYKICAgICAgICAgIHZpc3VhbDogYmFkZ2UKICAgICAgICAgIGNvbnRyb2w6IGJ1dHRvbnMKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgc3RhdGU6IHBsYXlpbmcsIGNvbG9yOiBncmVlbiwgaWNvbjogbWRpOnBsYXktY2lyY2xlLCBsYWJlbDogUGxheWluZyB9CiAgICAgICAgICAgIC0geyBzdGF0ZTogaWRsZSwgY29sb3I6IGdyZXksIGljb246IG1kaTp0ZWxldmlzaW9uLCBsYWJlbDogSWRsZSB9CiAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktc2VjdGlvbnMtY2FyZC1wcm8KICAgICAgdGl0bGU6IE9mZmljZQogICAgICBpY29uOiBtZGk6ZGVzawogICAgICBoZWFkZXJfZW50aXRpZXM6CiAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLm9mZmljZV90ZW1wZXJhdHVyZSwgZGVjaW1hbHM6IDEgfQogICAgICAgIC0gZW50aXR5OiBzZW5zb3Iub2ZmaWNlX2NvMgogICAgICAgICAgZGVjaW1hbHM6IDAKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgYmVsb3c6IDgwMCwgY29sb3I6IGdyZWVuIH0KICAgICAgICAgICAgLSB7IGJlbG93OiAxMjAwLCBjb2xvcjogYW1iZXIgfQogICAgICAgICAgICAtIHsgYWJvdmU6IDEyMDAsIGNvbG9yOiByZWQgfQogICAgICBzZWN0aW9uczoKICAgICAgICAtIGxheW91dDogcm93CiAgICAgICAgICBhbGlnbjogc3BhY2UtYmV0d2VlbgogICAgICAgICAgc2hvd19uYW1lOiBmYWxzZQogICAgICAgICAgZW50aXRpZXM6CiAgICAgICAgICAgIC0geyBlbnRpdHk6IGxpZ2h0Lm9mZmljZSwgY29udHJvbDogdG9nZ2xlLCBydWxlczogW3sgc3RhdGU6ICJvbiIsIGNvbG9yOiBhbWJlciB9LCB7IHN0YXRlOiAib2ZmIiwgY29sb3I6IGdyZXkgfV0gfQogICAgICAgICAgICAtIHsgZW50aXR5OiBsaWdodC5kZXNrX2xhbXAsIGNvbnRyb2w6IHRvZ2dsZSwgcnVsZXM6IFt7IHN0YXRlOiAib24iLCBjb2xvcjogYW1iZXIgfSwgeyBzdGF0ZTogIm9mZiIsIGNvbG9yOiBncmV5IH1dIH0KICAgICAgICAgICAgLSB7IGVudGl0eTogY292ZXIub2ZmaWNlX2JsaW5kcywgaWNvbjogbWRpOndpbmRvdy1zaHV0dGVyLCBhdHRyaWJ1dGU6IGN1cnJlbnRfcG9zaXRpb24sIHVuaXQ6ICIlIiB9CiAgICAtIHR5cGU6IGN1c3RvbTptdWx0aS10cmVuZC1jYXJkLXBybwogICAgICB0aXRsZTogSW5kb29yIHRlbXBlcmF0dXJlcwogICAgICBpY29uOiBtZGk6aG9tZS10aGVybW9tZXRlcgogICAgICBob3Vyc190b19zaG93OiAxMgogICAgICBsYXlvdXQ6IG92ZXJsYXkKICAgICAgZW50aXRpZXM6CiAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLmxpdmluZ19yb29tX3RlbXBlcmF0dXJlLCBuYW1lOiBMaXZpbmcgcm9vbSwgY29sb3I6IG9yYW5nZSB9CiAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLmJlZHJvb21fdGVtcGVyYXR1cmUsIG5hbWU6IEJlZHJvb20sIGNvbG9yOiBibHVlIH0KICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3Iub2ZmaWNlX3RlbXBlcmF0dXJlLCBuYW1lOiBPZmZpY2UsIGNvbG9yOiByZWQgfQotIGNvbHVtbl9zcGFuOiAxCiAgY2FyZHM6CiAgICAtIHsgdHlwZTogaGVhZGluZywgaGVhZGluZzogU2NlbmVzICYgbW9kZXMsIGljb246IG1kaTpwYWxldHRlIH0KICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1zZWN0aW9ucy1jYXJkLXBybwogICAgICB0aXRsZTogTW9kZXMgJiBzY2VuZXMKICAgICAgaWNvbjogbWRpOnBhbGV0dGUKICAgICAgc2hvd19uYW1lOiB0cnVlCiAgICAgIHNlY3Rpb25zOgogICAgICAgIC0gbGF5b3V0OiByb3cKICAgICAgICAgIGFsaWduOiBzcGFjZS1iZXR3ZWVuCiAgICAgICAgICBlbnRpdGllczoKICAgICAgICAgICAgLSB7IGVudGl0eTogaW5wdXRfYm9vbGVhbi5uaWdodF9tb2RlLCBuYW1lOiBOaWdodCwgY29udHJvbDogdG9nZ2xlLCBydWxlczogW3sgc3RhdGU6ICJvbiIsIGNvbG9yOiBpbmRpZ28gfSwgeyBzdGF0ZTogIm9mZiIsIGNvbG9yOiBncmV5IH1dIH0KICAgICAgICAgICAgLSB7IGVudGl0eTogaW5wdXRfYm9vbGVhbi5ndWVzdF9tb2RlLCBuYW1lOiBHdWVzdHMsIGNvbnRyb2w6IHRvZ2dsZSwgcnVsZXM6IFt7IHN0YXRlOiAib24iLCBjb2xvcjogcGluayB9LCB7IHN0YXRlOiAib2ZmIiwgY29sb3I6IGdyZXkgfV0gfQogICAgICAgICAgICAtIHsgZW50aXR5OiBpbnB1dF9ib29sZWFuLmF3YXlfbW9kZSwgbmFtZTogQXdheSwgY29udHJvbDogdG9nZ2xlLCBydWxlczogW3sgc3RhdGU6ICJvbiIsIGNvbG9yOiBibHVlIH0sIHsgc3RhdGU6ICJvZmYiLCBjb2xvcjogZ3JleSB9XSB9CiAgICAgICAgICAgIC0geyBlbnRpdHk6IGlucHV0X2Jvb2xlYW4udmFjYXRpb25fbW9kZSwgbmFtZTogVmFjYXRpb24sIGNvbnRyb2w6IHRvZ2dsZSwgcnVsZXM6IFt7IHN0YXRlOiAib24iLCBjb2xvcjogdGVhbCwgdGludF9jYXJkOiB0cnVlIH0sIHsgc3RhdGU6ICJvZmYiLCBjb2xvcjogZ3JleSB9XSB9CiAgICAgICAgLSBsYXlvdXQ6IHJvdwogICAgICAgICAgZGl2aWRlcjogdHJ1ZQogICAgICAgICAgYWxpZ246IHNwYWNlLWJldHdlZW4KICAgICAgICAgIG5hbWVfcG9zaXRpb246IGJlbG93CiAgICAgICAgICBlbnRpdGllczoKICAgICAgICAgICAgLSB7IGVudGl0eTogc2NlbmUuYnJpZ2h0LCBuYW1lOiBCcmlnaHQsIGljb246IG1kaTp3aGl0ZS1iYWxhbmNlLXN1bm55LCBjb2xvcjogYW1iZXIsIGNvbnRyb2w6IGJ1dHRvbiB9CiAgICAgICAgICAgIC0geyBlbnRpdHk6IHNjZW5lLmRpbW1lZCwgbmFtZTogRGltbWVkLCBpY29uOiBtZGk6bGlnaHRidWxiLW9uLTUwLCBjb2xvcjogb3JhbmdlLCBjb250cm9sOiBidXR0b24gfQogICAgICAgICAgICAtIHsgZW50aXR5OiBzY2VuZS5kaW5uZXIsIG5hbWU6IERpbm5lciwgaWNvbjogbWRpOnNpbHZlcndhcmUtZm9yay1rbmlmZSwgY29sb3I6IGRlZXAtb3JhbmdlLCBjb250cm9sOiBidXR0b24gfQogICAgICAgICAgICAtIHsgZW50aXR5OiBzY2VuZS5tb3ZpZV9uaWdodCwgbmFtZTogTW92aWUsIGljb246IG1kaTptb3ZpZS1vcGVuLCBjb2xvcjogZGVlcC1wdXJwbGUsIGNvbnRyb2w6IGJ1dHRvbiB9CiAgICAgICAgICAgIC0geyBlbnRpdHk6IHNjZW5lLmdvb2RfbmlnaHQsIG5hbWU6IE5pZ2h0LCBpY29uOiBtZGk6d2VhdGhlci1uaWdodCwgY29sb3I6IGluZGlnbywgY29udHJvbDogYnV0dG9uIH0KICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1ncm91cC1jYXJkLXBybwogICAgICB0aXRsZTogQXBwbGlhbmNlcwogICAgICBpY29uOiBtZGk6cG93ZXItcGx1ZwogICAgICBsYXlvdXQ6IHRhYmxlCiAgICAgIHNob3dfaWNvbjogdHJ1ZQogICAgICBlbnRpdGllczoKICAgICAgICAtIHsgZW50aXR5OiBzd2l0Y2guY29mZmVlX21hY2hpbmUsIG5hbWU6IENvZmZlZSBtYWNoaW5lLCBpY29uOiBtZGk6Y29mZmVlLW1ha2VyLCBjb250cm9sOiB0b2dnbGUsIHNob3dfdmFsdWU6IGZhbHNlIH0KICAgICAgICAtIGVudGl0eTogc2Vuc29yLmRpc2h3YXNoZXJfc3RhdHVzCiAgICAgICAgICBuYW1lOiBEaXNod2FzaGVyCiAgICAgICAgICB2aXN1YWw6IGJhZGdlCiAgICAgICAgICBydWxlczoKICAgICAgICAgICAgLSB7IHN0YXRlOiBydW4sIGNvbG9yOiBncmVlbiwgaWNvbjogbWRpOmRpc2h3YXNoZXIsIGxhYmVsOiBSdW5uaW5nIH0KICAgICAgICAgICAgLSB7IHN0YXRlOiBlbmQsIGNvbG9yOiB0ZWFsLCBpY29uOiBtZGk6ZGlzaHdhc2hlci1hbGVydCwgbGFiZWw6IERvbmUgfQogICAgICAgICAgICAtIHsgc3RhdGU6IHBvd2VyX29mZiwgY29sb3I6IGdyZXksIGljb246IG1kaTpkaXNod2FzaGVyLW9mZiwgbGFiZWw6ICJPZmYiIH0KICAgICAgICAtIGVudGl0eTogbWVkaWFfcGxheWVyLmtpdGNoZW5fc3BlYWtlcgogICAgICAgICAgbmFtZTogS2l0Y2hlbiBzcGVha2VyCiAgICAgICAgICB2aXN1YWw6IGJhZGdlCiAgICAgICAgICBjb250cm9sOiBidXR0b25zCiAgICAgICAgICBydWxlczoKICAgICAgICAgICAgLSB7IHN0YXRlOiBwbGF5aW5nLCBjb2xvcjogZ3JlZW4sIGljb246IG1kaTpzcGVha2VyLXBsYXksIGxhYmVsOiBQbGF5aW5nIH0KICAgICAgICAgICAgLSB7IHN0YXRlOiBpZGxlLCBjb2xvcjogZ3JleSwgaWNvbjogbWRpOnNwZWFrZXIsIGxhYmVsOiBJZGxlIH0KICAgICAgICAtIGVudGl0eTogc2Vuc29yLm1vdGlvbl9oYWxsd2F5X2JhdHRlcnkKICAgICAgICAgIG5hbWU6IE1vdGlvbiBzZW5zb3IgYmF0dGVyeQogICAgICAgICAgdmlzdWFsOiByaW5nCiAgICAgICAgICBydWxlczoKICAgICAgICAgICAgLSB7IGJlbG93OiAyMCwgY29sb3I6IHJlZCwgbGFiZWw6IFJlcGxhY2UgfQogICAgICAgICAgICAtIHsgYmVsb3c6IDUwLCBjb2xvcjogYW1iZXIgfQogICAgICAgICAgICAtIHsgYWJvdmU6IDUwLCBjb2xvcjogZ3JlZW4gfQo=">

```yaml
- column_span: 1
  cards:
    - { type: heading, heading: Home, icon: mdi:home }
    - type: custom:entity-sections-card-pro
      title: Who's home
      icon: mdi:shield-home
      show_icon: true
      sections:
        - layout: row
          align: space-between
          entities:
            - { entity: person.alex, name: Alex, visual: badge, rules: &p [{ state: home, color: green, label: Home }, { state: not_home, color: grey, label: Away }] }
            - { entity: person.sam, name: Sam, visual: badge, rules: *p }
            - { entity: person.kim, name: Kim, visual: badge, rules: *p }
        - layout: table
          divider: true
          entities:
            - { entity: binary_sensor.door_front, name: Front door, visual: badge, rules: [{ state: "on", color: red, icon: mdi:door-open, label: Open }, { state: "off", color: green, icon: mdi:door-closed, label: Closed }] }
            - { entity: binary_sensor.window_kitchen, name: Kitchen window, visual: badge, rules: &w [{ state: "on", color: red, icon: mdi:window-open, label: Open }, { state: "off", color: green, icon: mdi:window-closed, label: Closed }] }
            - { entity: binary_sensor.window_bathroom, name: Bathroom window, visual: badge, rules: *w }
            - { entity: binary_sensor.motion_hallway, name: Hallway motion, visual: badge, rules: [{ state: "on", color: amber, icon: mdi:motion-sensor, label: Detected }, { state: "off", color: grey, icon: mdi:motion-sensor-off, label: Clear }] }
    - type: custom:entity-card-pro
      entity: binary_sensor.window_kitchen
      name: Open windows
      icon: mdi:window-open-variant
      value: "{{ states.binary_sensor | selectattr('attributes.device_class', 'eq', 'window') | selectattr('state', 'eq', 'on') | list | count }}"
      rules:
        - { below: 1, color: green, label: All closed }
        - { above: 1, color: red, label: Airing, tint_card: true }
      grid_options: { columns: 6 }
    - type: custom:entity-card-pro
      entity: light.living_room
      name: Lights on
      icon: mdi:lightbulb-group
      value: "{{ states.light | selectattr('state', 'eq', 'on') | list | count }}"
      suffix: " of 8"
      rules:
        - { below: 1, color: grey, label: All off }
        - { above: 1, color: amber, label: Some on }
      grid_options: { columns: 6 }
    - type: custom:entity-card-pro
      entity: sensor.washer_status
      name: Washing machine
      secondary: "{{ states('sensor.washer_remaining') }} min left"
      visual: badge
      rules:
        - { state: run, color: green, icon: mdi:washing-machine, label: Running }
        - { state: end, color: teal, icon: mdi:washing-machine-alert, label: Done, tint_card: true }
        - { state: power_off, color: grey, icon: mdi:washing-machine-off, label: "Off" }
      grid_options: { columns: 6 }
    - type: custom:entity-card-pro
      entity: vacuum.robot
      name: Robot vacuum
      secondary: "{{ states('sensor.robot_current_room') }} · {{ states('sensor.robot_battery') }} %"
      visual: badge
      rules:
        - { state: docked, color: green, icon: mdi:robot-vacuum, label: Docked }
        - { state: cleaning, color: blue, icon: mdi:robot-vacuum, label: Cleaning }
        - { state: returning, color: teal, icon: mdi:home-import-outline, label: Returning }
      grid_options: { columns: 6 }
- column_span: 1
  cards:
    - { type: heading, heading: Rooms, icon: mdi:floor-plan }
    - type: custom:entity-group-card-pro
      title: Living room
      icon: mdi:sofa
      entities:
        - entity: light.living_room
          control: auto
          rules:
            - { state: "on", color: amber, label: "On" }
            - { state: "off", color: grey, label: "Off" }
        - entity: light.dining_table
          control: toggle
          rules:
            - { state: "on", color: amber, label: "On" }
            - { state: "off", color: grey, label: "Off" }
        - entity: sensor.living_room_temperature
          name: Temperature
          decimals: 1
          rules:
            - { below: 19, color: blue, label: Cold }
            - { below: 24, color: green, label: Comfortable }
            - { above: 24, color: orange, label: Warm }
        - entity: sensor.living_room_co2
          name: CO₂
          visual: strip
          rules:
            - { below: 800, color: green }
            - { below: 1200, color: amber }
            - { above: 1200, color: red }
        - { entity: cover.living_room_blinds, name: Blinds, icon: mdi:window-shutter, attribute: current_position, unit: "%", control: auto }
        - entity: media_player.living_room_tv
          name: TV
          visual: badge
          control: buttons
          rules:
            - { state: playing, color: green, icon: mdi:play-circle, label: Playing }
            - { state: idle, color: grey, icon: mdi:television, label: Idle }
    - type: custom:entity-sections-card-pro
      title: Office
      icon: mdi:desk
      header_entities:
        - { entity: sensor.office_temperature, decimals: 1 }
        - entity: sensor.office_co2
          decimals: 0
          rules:
            - { below: 800, color: green }
            - { below: 1200, color: amber }
            - { above: 1200, color: red }
      sections:
        - layout: row
          align: space-between
          show_name: false
          entities:
            - { entity: light.office, control: toggle, rules: [{ state: "on", color: amber }, { state: "off", color: grey }] }
            - { entity: light.desk_lamp, control: toggle, rules: [{ state: "on", color: amber }, { state: "off", color: grey }] }
            - { entity: cover.office_blinds, icon: mdi:window-shutter, attribute: current_position, unit: "%" }
    - type: custom:multi-trend-card-pro
      title: Indoor temperatures
      icon: mdi:home-thermometer
      hours_to_show: 12
      layout: overlay
      entities:
        - { entity: sensor.living_room_temperature, name: Living room, color: orange }
        - { entity: sensor.bedroom_temperature, name: Bedroom, color: blue }
        - { entity: sensor.office_temperature, name: Office, color: red }
- column_span: 1
  cards:
    - { type: heading, heading: Scenes & modes, icon: mdi:palette }
    - type: custom:entity-sections-card-pro
      title: Modes & scenes
      icon: mdi:palette
      show_name: true
      sections:
        - layout: row
          align: space-between
          entities:
            - { entity: input_boolean.night_mode, name: Night, control: toggle, rules: [{ state: "on", color: indigo }, { state: "off", color: grey }] }
            - { entity: input_boolean.guest_mode, name: Guests, control: toggle, rules: [{ state: "on", color: pink }, { state: "off", color: grey }] }
            - { entity: input_boolean.away_mode, name: Away, control: toggle, rules: [{ state: "on", color: blue }, { state: "off", color: grey }] }
            - { entity: input_boolean.vacation_mode, name: Vacation, control: toggle, rules: [{ state: "on", color: teal, tint_card: true }, { state: "off", color: grey }] }
        - layout: row
          divider: true
          align: space-between
          name_position: below
          entities:
            - { entity: scene.bright, name: Bright, icon: mdi:white-balance-sunny, color: amber, control: button }
            - { entity: scene.dimmed, name: Dimmed, icon: mdi:lightbulb-on-50, color: orange, control: button }
            - { entity: scene.dinner, name: Dinner, icon: mdi:silverware-fork-knife, color: deep-orange, control: button }
            - { entity: scene.movie_night, name: Movie, icon: mdi:movie-open, color: deep-purple, control: button }
            - { entity: scene.good_night, name: Night, icon: mdi:weather-night, color: indigo, control: button }
    - type: custom:entity-group-card-pro
      title: Appliances
      icon: mdi:power-plug
      layout: table
      show_icon: true
      entities:
        - { entity: switch.coffee_machine, name: Coffee machine, icon: mdi:coffee-maker, control: toggle, show_value: false }
        - entity: sensor.dishwasher_status
          name: Dishwasher
          visual: badge
          rules:
            - { state: run, color: green, icon: mdi:dishwasher, label: Running }
            - { state: end, color: teal, icon: mdi:dishwasher-alert, label: Done }
            - { state: power_off, color: grey, icon: mdi:dishwasher-off, label: "Off" }
        - entity: media_player.kitchen_speaker
          name: Kitchen speaker
          visual: badge
          control: buttons
          rules:
            - { state: playing, color: green, icon: mdi:speaker-play, label: Playing }
            - { state: idle, color: grey, icon: mdi:speaker, label: Idle }
        - entity: sensor.motion_hallway_battery
          name: Motion sensor battery
          visual: ring
          rules:
            - { below: 20, color: red, label: Replace }
            - { below: 50, color: amber }
            - { above: 50, color: green }
```

</DashboardGrid>

### Weather dashboard

The wind and rain cards as heroes with animated flows, the weather card with an hourly trend and the daily forecast, plain tiles, an entity group card of sun and light readings, the sun path card and multi trend cards with axes.

<DashboardGrid b64="LSBjb2x1bW5fc3BhbjogMgogIGNhcmRzOgogICAgLSB7IHR5cGU6IGhlYWRpbmcsIGhlYWRpbmc6IFdlYXRoZXIgc3RhdGlvbiwgaWNvbjogbWRpOmFjY2Vzcy1wb2ludCB9CiAgICAtIHR5cGU6IGN1c3RvbTp3aW5kLWNhcmQtcHJvCiAgICAgIGVudGl0eTogc2Vuc29yLndpbmRfc3BlZWQKICAgICAgZGlyZWN0aW9uOiBzZW5zb3Iud2luZF9kaXJlY3Rpb24KICAgICAgZ3VzdDogc2Vuc29yLndpbmRfZ3VzdAogICAgICB0aXRsZTogV2luZAogICAgICBsYXlvdXQ6IGhlcm8KICAgICAgZmxvdzogeyBzdHlsZTogdmVjdG9ycyB9CiAgICAgIHJ1bGVzOgogICAgICAgIC0geyBiZWxvdzogNSwgY29sb3I6IGJsdWUtZ3JleSwgbGFiZWw6IENhbG0gfQogICAgICAgIC0geyBiZWxvdzogMjAsIGNvbG9yOiB0ZWFsLCBsYWJlbDogTGlnaHQgYnJlZXplIH0KICAgICAgICAtIHsgYmVsb3c6IDM1LCBjb2xvcjogYW1iZXIsIGxhYmVsOiBGcmVzaCB9CiAgICAgICAgLSB7IGFib3ZlOiAzNSwgY29sb3I6IHJlZCwgbGFiZWw6IFN0b3JtLCB0aW50X2NhcmQ6IHRydWUgfQogICAgICBncmlkX29wdGlvbnM6IHsgY29sdW1uczogNiB9CiAgICAtIHR5cGU6IGN1c3RvbTpyYWluLWNhcmQtcHJvCiAgICAgIGVudGl0eTogc2Vuc29yLnJhaW5fcmF0ZV9yb29mCiAgICAgIHRvZGF5OiBzZW5zb3IucmFpbl90b2RheQogICAgICB3aW5kOiBzZW5zb3Iud2luZF9zcGVlZAogICAgICBkaXJlY3Rpb246IHNlbnNvci53aW5kX2RpcmVjdGlvbgogICAgICB0aXRsZTogUmFpbgogICAgICBsYXlvdXQ6IGhlcm8KICAgICAgZmxvdzogeyBzdHlsZTogZmlsbCB9CiAgICAgIHJ1bGVzOgogICAgICAgIC0geyBiZWxvdzogMC4xLCBjb2xvcjogYmx1ZS1ncmV5LCBsYWJlbDogRHJ5IH0KICAgICAgICAtIHsgYmVsb3c6IDIuNSwgY29sb3I6IGxpZ2h0LWJsdWUsIGxhYmVsOiBMaWdodCByYWluIH0KICAgICAgICAtIHsgYmVsb3c6IDcuNiwgY29sb3I6IGJsdWUsIGxhYmVsOiBNb2RlcmF0ZSByYWluIH0KICAgICAgICAtIHsgYWJvdmU6IDcuNiwgY29sb3I6IGluZGlnbywgbGFiZWw6IEhlYXZ5IHJhaW4sIHRpbnRfY2FyZDogdHJ1ZSB9CiAgICAgIGdyaWRfb3B0aW9uczogeyBjb2x1bW5zOiA2IH0KICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICBlbnRpdHk6IHNlbnNvci5vdXRkb29yX3RlbXBlcmF0dXJlCiAgICAgIG5hbWU6IFRlbXBlcmF0dXJlCiAgICAgIGRlY2ltYWxzOiAxCiAgICAgIHJ1bGVzOgogICAgICAgIC0geyBiZWxvdzogMCwgY29sb3I6IGluZGlnbywgbGFiZWw6IEZyb3N0LCB0aW50X2NhcmQ6IHRydWUgfQogICAgICAgIC0geyBiZWxvdzogMTYsIGNvbG9yOiBibHVlLCBsYWJlbDogQ29vbCB9CiAgICAgICAgLSB7IGJlbG93OiAyNiwgY29sb3I6IGdyZWVuLCBsYWJlbDogUGxlYXNhbnQgfQogICAgICAgIC0geyBhYm92ZTogMjYsIGNvbG9yOiBvcmFuZ2UsIGxhYmVsOiBIb3QsIHRpbnRfY2FyZDogdHJ1ZSB9CiAgICAgIGdyaWRfb3B0aW9uczogeyBjb2x1bW5zOiA0IH0KICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybwogICAgICBlbnRpdHk6IHNlbnNvci5vdXRkb29yX2h1bWlkaXR5CiAgICAgIG5hbWU6IEh1bWlkaXR5CiAgICAgIHJ1bGVzOgogICAgICAgIC0geyBiZWxvdzogNDAsIGNvbG9yOiBhbWJlciwgbGFiZWw6IERyeSB9CiAgICAgICAgLSB7IGJlbG93OiA3MCwgY29sb3I6IGdyZWVuLCBsYWJlbDogQ29tZm9ydGFibGUgfQogICAgICAgIC0geyBhYm92ZTogNzAsIGNvbG9yOiBibHVlLCBsYWJlbDogSHVtaWQgfQogICAgICBncmlkX29wdGlvbnM6IHsgY29sdW1uczogNCB9CiAgICAtIHsgdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybywgZW50aXR5OiBzZW5zb3IucHJlc3N1cmUsIG5hbWU6IFByZXNzdXJlLCBkZWNpbWFsczogMCwgZ3JpZF9vcHRpb25zOiB7IGNvbHVtbnM6IDQgfSB9CiAgICAtIHR5cGU6IGN1c3RvbTptdWx0aS10cmVuZC1jYXJkLXBybwogICAgICB0aXRsZTogVGVtcGVyYXR1cmUgJiBkZXcgcG9pbnQKICAgICAgaWNvbjogbWRpOnRoZXJtb21ldGVyCiAgICAgIGhvdXJzX3RvX3Nob3c6IDEyCiAgICAgIHhfYXhpczogdHJ1ZQogICAgICBlbnRpdGllczoKICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3Iub3V0ZG9vcl90ZW1wZXJhdHVyZSwgbmFtZTogVGVtcGVyYXR1cmUsIGNvbG9yOiByZWQgfQogICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5kZXdfcG9pbnQsIG5hbWU6IERldyBwb2ludCwgY29sb3I6IGJsdWUgfQotIGNvbHVtbl9zcGFuOiAxCiAgY2FyZHM6CiAgICAtIHsgdHlwZTogaGVhZGluZywgaGVhZGluZzogRm9yZWNhc3QsIGljb246IG1kaTp3ZWF0aGVyLXBhcnRseS1jbG91ZHkgfQogICAgLSB0eXBlOiBjdXN0b206d2VhdGhlci1jYXJkLXBybwogICAgICBlbnRpdHk6IHdlYXRoZXIuaG9tZQogICAgICB0aXRsZTogV2VhdGhlcgogICAgICB0ZW1wZXJhdHVyZV9ydWxlczoKICAgICAgICAtIHsgYmVsb3c6IDEyLCBjb2xvcjogYmx1ZSwgbGFiZWw6IENvb2wgfQogICAgICAgIC0geyBiZWxvdzogMjAsIGNvbG9yOiBncmVlbiwgbGFiZWw6IE1pbGQgfQogICAgICAgIC0geyBhYm92ZTogMjAsIGNvbG9yOiBhbWJlciwgbGFiZWw6IFdhcm0gfQogICAgICBzZWN0aW9uczoKICAgICAgICAtIHR5cGU6IGhlcm8KICAgICAgICAtIHsgdHlwZTogcm93LCBlbnRpdGllczogW2h1bWlkaXR5LCB3aW5kX3NwZWVkLCBwcmVzc3VyZV0gfQogICAgICAgIC0geyB0eXBlOiB0cmVuZCwgbW9kZTogaG91cmx5LCBob3VyczogMTIsIHNob3c6IFt0ZW1wZXJhdHVyZSwgcHJlY2lwaXRhdGlvbl0sIGRpdmlkZXI6IHRydWUgfQogICAgICAgIC0geyB0eXBlOiBmb3JlY2FzdCwgbW9kZTogZGFpbHksIGRheXM6IDUsIGRpdmlkZXI6IHRydWUgfQotIGNvbHVtbl9zcGFuOiAzCiAgY2FyZHM6CiAgICAtIHsgdHlwZTogaGVhZGluZywgaGVhZGluZzogRGF5bGlnaHQsIGljb246IG1kaTp3aGl0ZS1iYWxhbmNlLXN1bm55IH0KICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1ncm91cC1jYXJkLXBybwogICAgICB0aXRsZTogU3VuICYgbGlnaHQKICAgICAgaWNvbjogbWRpOnN1bi1hbmdsZQogICAgICBlbnRpdGllczoKICAgICAgICAtIGVudGl0eTogc3VuLnN1bgogICAgICAgICAgbmFtZTogU3VuCiAgICAgICAgICB2aXN1YWw6IGJhZGdlCiAgICAgICAgICBydWxlczoKICAgICAgICAgICAgLSB7IHN0YXRlOiBhYm92ZV9ob3Jpem9uLCBjb2xvcjogYW1iZXIsIGljb246IG1kaTp3aGl0ZS1iYWxhbmNlLXN1bm55LCBsYWJlbDogVXAgfQogICAgICAgICAgICAtIHsgc3RhdGU6IGJlbG93X2hvcml6b24sIGNvbG9yOiBpbmRpZ28sIGljb246IG1kaTp3ZWF0aGVyLW5pZ2h0LCBsYWJlbDogRG93biB9CiAgICAgICAgLSB7IGVudGl0eTogc3VuLnN1biwgbmFtZTogRWxldmF0aW9uLCBpY29uOiBtZGk6YW5nbGUtYWN1dGUsIGF0dHJpYnV0ZTogZWxldmF0aW9uLCB1bml0OiDCsCwgZGVjaW1hbHM6IDAgfQogICAgICAgIC0geyBlbnRpdHk6IHN1bi5zdW4sIG5hbWU6IEF6aW11dGgsIGljb246IG1kaTpjb21wYXNzLW91dGxpbmUsIGF0dHJpYnV0ZTogYXppbXV0aCwgdW5pdDogwrAsIGRlY2ltYWxzOiAwIH0KICAgICAgICAtIGVudGl0eTogc2Vuc29yLmlsbHVtaW5hbmNlCiAgICAgICAgICBuYW1lOiBJbGx1bWluYW5jZQogICAgICAgICAgZGVjaW1hbHM6IDAKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgYmVsb3c6IDEwLCBjb2xvcjogaW5kaWdvLCBsYWJlbDogTmlnaHQgfQogICAgICAgICAgICAtIHsgYmVsb3c6IDEwMDAsIGNvbG9yOiBibHVlLWdyZXksIGxhYmVsOiBEaW0gfQogICAgICAgICAgICAtIHsgYmVsb3c6IDI1MDAwLCBjb2xvcjogYW1iZXIsIGxhYmVsOiBEYXlsaWdodCB9CiAgICAgICAgICAgIC0geyBhYm92ZTogMjUwMDAsIGNvbG9yOiBvcmFuZ2UsIGxhYmVsOiBCcmlnaHQgc3VuIH0KICAgICAgICAtIGVudGl0eTogc2Vuc29yLnV2X2luZGV4CiAgICAgICAgICBuYW1lOiBVViBpbmRleAogICAgICAgICAgdW5pdDogIiIKICAgICAgICAgIGRlY2ltYWxzOiAxCiAgICAgICAgICBydWxlczoKICAgICAgICAgICAgLSB7IGJlbG93OiAzLCBjb2xvcjogZ3JlZW4sIGxhYmVsOiBMb3cgfQogICAgICAgICAgICAtIHsgYmVsb3c6IDYsIGNvbG9yOiBhbWJlciwgbGFiZWw6IE1vZGVyYXRlIH0KICAgICAgICAgICAgLSB7IGJlbG93OiA4LCBjb2xvcjogb3JhbmdlLCBsYWJlbDogSGlnaCB9CiAgICAgICAgICAgIC0geyBhYm92ZTogOCwgY29sb3I6IHJlZCwgbGFiZWw6IFZlcnkgaGlnaCB9CiAgICAgIGdyaWRfb3B0aW9uczogeyBjb2x1bW5zOiA0IH0KICAgIC0geyB0eXBlOiBjdXN0b206c3VuLXBhdGgtY2FyZC1wcm8sIHRpdGxlOiBTdW4gdG9kYXksIGdyaWRfb3B0aW9uczogeyBjb2x1bW5zOiA0IH0gfQogICAgLSB0eXBlOiBjdXN0b206bXVsdGktdHJlbmQtY2FyZC1wcm8KICAgICAgdGl0bGU6IFVWIGluZGV4CiAgICAgIGljb246IG1kaTpzdW4td2lyZWxlc3MKICAgICAgY29sb3I6IGFtYmVyCiAgICAgIGhvdXJzX3RvX3Nob3c6IDEyCiAgICAgIHlfYXhpczogdHJ1ZQogICAgICB4X2F4aXM6IHRydWUKICAgICAgZW50aXRpZXM6CiAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLnV2X2luZGV4LCBuYW1lOiBVViBpbmRleCwgY29sb3I6IGFtYmVyIH0KICAgICAgZ3JpZF9vcHRpb25zOiB7IGNvbHVtbnM6IDQsIHJvd3M6IDEgfQo=">

```yaml
- column_span: 2
  cards:
    - { type: heading, heading: Weather station, icon: mdi:access-point }
    - type: custom:wind-card-pro
      entity: sensor.wind_speed
      direction: sensor.wind_direction
      gust: sensor.wind_gust
      title: Wind
      layout: hero
      flow: { style: vectors }
      rules:
        - { below: 5, color: blue-grey, label: Calm }
        - { below: 20, color: teal, label: Light breeze }
        - { below: 35, color: amber, label: Fresh }
        - { above: 35, color: red, label: Storm, tint_card: true }
      grid_options: { columns: 6 }
    - type: custom:rain-card-pro
      entity: sensor.rain_rate_roof
      today: sensor.rain_today
      wind: sensor.wind_speed
      direction: sensor.wind_direction
      title: Rain
      layout: hero
      flow: { style: fill }
      rules:
        - { below: 0.1, color: blue-grey, label: Dry }
        - { below: 2.5, color: light-blue, label: Light rain }
        - { below: 7.6, color: blue, label: Moderate rain }
        - { above: 7.6, color: indigo, label: Heavy rain, tint_card: true }
      grid_options: { columns: 6 }
    - type: custom:entity-card-pro
      entity: sensor.outdoor_temperature
      name: Temperature
      decimals: 1
      rules:
        - { below: 0, color: indigo, label: Frost, tint_card: true }
        - { below: 16, color: blue, label: Cool }
        - { below: 26, color: green, label: Pleasant }
        - { above: 26, color: orange, label: Hot, tint_card: true }
      grid_options: { columns: 4 }
    - type: custom:entity-card-pro
      entity: sensor.outdoor_humidity
      name: Humidity
      rules:
        - { below: 40, color: amber, label: Dry }
        - { below: 70, color: green, label: Comfortable }
        - { above: 70, color: blue, label: Humid }
      grid_options: { columns: 4 }
    - { type: custom:entity-card-pro, entity: sensor.pressure, name: Pressure, decimals: 0, grid_options: { columns: 4 } }
    - type: custom:multi-trend-card-pro
      title: Temperature & dew point
      icon: mdi:thermometer
      hours_to_show: 12
      x_axis: true
      entities:
        - { entity: sensor.outdoor_temperature, name: Temperature, color: red }
        - { entity: sensor.dew_point, name: Dew point, color: blue }
- column_span: 1
  cards:
    - { type: heading, heading: Forecast, icon: mdi:weather-partly-cloudy }
    - type: custom:weather-card-pro
      entity: weather.home
      title: Weather
      temperature_rules:
        - { below: 12, color: blue, label: Cool }
        - { below: 20, color: green, label: Mild }
        - { above: 20, color: amber, label: Warm }
      sections:
        - type: hero
        - { type: row, entities: [humidity, wind_speed, pressure] }
        - { type: trend, mode: hourly, hours: 12, show: [temperature, precipitation], divider: true }
        - { type: forecast, mode: daily, days: 5, divider: true }
- column_span: 3
  cards:
    - { type: heading, heading: Daylight, icon: mdi:white-balance-sunny }
    - type: custom:entity-group-card-pro
      title: Sun & light
      icon: mdi:sun-angle
      entities:
        - entity: sun.sun
          name: Sun
          visual: badge
          rules:
            - { state: above_horizon, color: amber, icon: mdi:white-balance-sunny, label: Up }
            - { state: below_horizon, color: indigo, icon: mdi:weather-night, label: Down }
        - { entity: sun.sun, name: Elevation, icon: mdi:angle-acute, attribute: elevation, unit: °, decimals: 0 }
        - { entity: sun.sun, name: Azimuth, icon: mdi:compass-outline, attribute: azimuth, unit: °, decimals: 0 }
        - entity: sensor.illuminance
          name: Illuminance
          decimals: 0
          rules:
            - { below: 10, color: indigo, label: Night }
            - { below: 1000, color: blue-grey, label: Dim }
            - { below: 25000, color: amber, label: Daylight }
            - { above: 25000, color: orange, label: Bright sun }
        - entity: sensor.uv_index
          name: UV index
          unit: ""
          decimals: 1
          rules:
            - { below: 3, color: green, label: Low }
            - { below: 6, color: amber, label: Moderate }
            - { below: 8, color: orange, label: High }
            - { above: 8, color: red, label: Very high }
      grid_options: { columns: 4 }
    - { type: custom:sun-path-card-pro, title: Sun today, grid_options: { columns: 4 } }
    - type: custom:multi-trend-card-pro
      title: UV index
      icon: mdi:sun-wireless
      color: amber
      hours_to_show: 12
      y_axis: true
      x_axis: true
      entities:
        - { entity: sensor.uv_index, name: UV index, color: amber }
      grid_options: { columns: 4, rows: 1 }
```

</DashboardGrid>

## Built with AI

Pro Cards is built with the help of AI. Code, docs and tests are written together with AI coding agents, reviewed and tested by a human before each release. Found something off? [Open an issue](https://github.com/malte-wessel/pro-cards/issues).
