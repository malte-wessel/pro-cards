---
layout: home
hero:
  name: Pro Cards
  text: High-quality, flexible cards for Home Assistant.
  tagline: Ten cards that match the look and feel of Home Assistant and adapt to your dashboard with rules, templates, layouts and animated flows. Installed with HACS, styled by your theme.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Entity cards
      link: /cards/entity-card
features:
  - icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M4 11.5 12 4l8 7.5"/><path d="M6.5 10v9.5h11V10"/><path d="M10 19.5v-5h4v5"/></svg>'
    title: Looks like Home Assistant
    details: The spacing, typography and state colours of the built-in tile cards, dark mode included. Your theme restyles every card at once.
  - icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="8.5" cy="12" r="2"/><path d="M13 10.5h5M13 13.5h3"/></svg>'
    title: Value drives the look
    details: Rules switch icon, colour, label and the card tint by value or state. Templates for names, values and secondary text.
  - icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M4 7h10M18 7h2M4 12h3M11 12h9M4 17h12M20 17h0"/><circle cx="16" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="18" cy="17" r="2"/></svg>'
    title: One entity or a whole room
    details: A single tile, or many entities as list, grid, hero, row, column, table or sections. Ring, gauge, bar, sparkline, badge or strip. Tap, hold and double-tap actions.
  - icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M3 17l5-6 4 4 4-6 5 3"/><circle cx="19" cy="6" r="2.5"/><path d="M4 21h16"/></svg>'
    title: Weather, energy and light
    details: The weather with its forecast, where the power flows, trends for any sensor, today's sun path, daylight on a log scale, and the wind and the rain as animated flows.
---

### Energy dashboard

The power flow card with rooms, price and outage, an entity group card as a hero with rules, plain tiles, a ring, columns and sparkline visuals, and a multi trend card in lanes.

<DashboardGrid b64="LSBjb2x1bW5fc3BhbjogMgogIGNhcmRzOgogICAgLSB7IHR5cGU6IGhlYWRpbmcsIGhlYWRpbmc6IFBvd2VyLCBpY29uOiBtZGk6bGlnaHRuaW5nLWJvbHQgfQogICAgLSB0eXBlOiBjdXN0b206cG93ZXItZmxvdy1jYXJkCiAgICAgIGhvbWU6IHNlbnNvci5wb3dlcl9jb25zdW1wdGlvbgogICAgICBzb3VyY2VzOgogICAgICAgIC0geyB0eXBlOiBzb2xhciwgZW50aXR5OiBzZW5zb3Iuc29sYXJfcG93ZXIgfQogICAgICAgIC0geyB0eXBlOiBiYXR0ZXJ5LCBwb3dlcjogc2Vuc29yLmJhdHRlcnlfcG93ZXIsIHNvYzogc2Vuc29yLmJhdHRlcnlfc29jIH0KICAgICAgICAtIHR5cGU6IGdyaWQKICAgICAgICAgIHBvd2VyOiBzZW5zb3IuZ3JpZF9wb3dlcgogICAgICAgICAgcHJpY2U6IHNlbnNvci5lbGVjdHJpY2l0eV9wcmljZQogICAgICAgICAgb2ZmbGluZTogYmluYXJ5X3NlbnNvci5ncmlkX291dGFnZQogICAgICAgICAgZm9zc2lsOiBzZW5zb3IuZ3JpZF9mb3NzaWxfcGVyY2VudGFnZQogICAgICBjb25zdW1lcnM6CiAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLmhlYXRfcHVtcF9wb3dlciwgbmFtZTogSGVhdCBwdW1wLCBpY29uOiBtZGk6aGVhdC1wdW1wIH0KICAgICAgICAtIGdyb3VwOiBMYXVuZHJ5CiAgICAgICAgICBpY29uOiBtZGk6d2FzaGluZy1tYWNoaW5lCiAgICAgICAgICBlbnRpdGllczoKICAgICAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLndhc2hlcl9wb3dlciwgbmFtZTogV2FzaGVyLCBpY29uOiBtZGk6d2FzaGluZy1tYWNoaW5lIH0KICAgICAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLmRyeWVyX3Bvd2VyLCBuYW1lOiBEcnllciwgaWNvbjogbWRpOnR1bWJsZS1kcnllciB9CiAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLm9mZmljZV9wb3dlciwgbmFtZTogT2ZmaWNlLCBpY29uOiBtZGk6bW9uaXRvciB9CiAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLmV2X2NoYXJnZXJfcG93ZXIsIG5hbWU6IEVWIGNoYXJnZXIsIGljb246IG1kaTpldi1zdGF0aW9uIH0KICAgIC0geyB0eXBlOiBoZWFkaW5nLCBoZWFkaW5nOiBUb2RheSwgaWNvbjogbWRpOmNhbGVuZGFyLXRvZGF5IH0KICAgIC0geyB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQsIGVudGl0eTogc2Vuc29yLmVuZXJneV90b2RheSwgbmFtZTogVXNlZCB0b2RheSwgaWNvbjogbWRpOmhvbWUtbGlnaHRuaW5nLWJvbHQsIGdyaWRfb3B0aW9uczogeyBjb2x1bW5zOiAzIH0gfQogICAgLSB7IHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZCwgZW50aXR5OiBzZW5zb3IuZWxlY3RyaWNpdHlfcHJpY2UsIG5hbWU6IFByaWNlLCBpY29uOiBtZGk6Y2FzaCwgZ3JpZF9vcHRpb25zOiB7IGNvbHVtbnM6IDMgfSB9CiAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZAogICAgICBlbnRpdHk6IHNlbnNvci5iYXR0ZXJ5X3NvYwogICAgICBuYW1lOiBCYXR0ZXJ5IGNoYXJnZQogICAgICB2aXN1YWw6IHJpbmcKICAgICAgcnVsZXM6CiAgICAgICAgLSB7IGJlbG93OiAyMCwgY29sb3I6IHJlZCwgbGFiZWw6IExvdyB9CiAgICAgICAgLSB7IGJlbG93OiA1MCwgY29sb3I6IGFtYmVyIH0KICAgICAgICAtIHsgYWJvdmU6IDUwLCBjb2xvcjogZ3JlZW4gfQogICAgICBncmlkX29wdGlvbnM6IHsgY29sdW1uczogMyB9CiAgICAtIHsgdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLCBlbnRpdHk6IHNlbnNvci5ncmlkX2Zvc3NpbF9wZXJjZW50YWdlLCBuYW1lOiBGb3NzaWwgc2hhcmUsIGljb246IG1kaTptb2xlY3VsZS1jbzIsIGdyaWRfb3B0aW9uczogeyBjb2x1bW5zOiAzIH0gfQogICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQKICAgICAgZW50aXR5OiBzZW5zb3IuZ3JpZF9wb3dlcgogICAgICBuYW1lOiBHcmlkCiAgICAgIGRlY2ltYWxzOiAwCiAgICAgIHZpc3VhbDogY29sdW1ucwogICAgICBob3Vyc190b19zaG93OiAxMgogICAgICBidWNrZXRfbWludXRlczogMzAKICAgICAgcnVsZXM6CiAgICAgICAgLSB7IGJlbG93OiAwLCBjb2xvcjogZ3JlZW4sIGxhYmVsOiBFeHBvcnRpbmcgfQogICAgICAgIC0geyBhYm92ZTogMCwgY29sb3I6IGJsdWUsIGxhYmVsOiBJbXBvcnRpbmcgfQogICAgICBncmlkX29wdGlvbnM6IHsgY29sdW1uczogNiB9CiAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZAogICAgICBlbnRpdHk6IHNlbnNvci5iYXR0ZXJ5X3Bvd2VyCiAgICAgIG5hbWU6IEJhdHRlcnkKICAgICAgZGVjaW1hbHM6IDAKICAgICAgdmlzdWFsOiBzcGFya2xpbmUKICAgICAgaG91cnNfdG9fc2hvdzogMTIKICAgICAgYnVja2V0X21pbnV0ZXM6IDMwCiAgICAgIHJ1bGVzOgogICAgICAgIC0geyBiZWxvdzogMCwgY29sb3I6IHRlYWwsIGxhYmVsOiBDaGFyZ2luZyB9CiAgICAgICAgLSB7IGFib3ZlOiAwLCBjb2xvcjogYW1iZXIsIGxhYmVsOiBEaXNjaGFyZ2luZyB9CiAgICAgIGdyaWRfb3B0aW9uczogeyBjb2x1bW5zOiA2IH0KLSBjb2x1bW5fc3BhbjogMQogIGNhcmRzOgogICAgLSB7IHR5cGU6IGhlYWRpbmcsIGhlYWRpbmc6IENhciwgaWNvbjogbWRpOmNhci1lbGVjdHJpYyB9CiAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktZ3JvdXAtY2FyZAogICAgICB0aXRsZTogRWxlY3RyaWMgY2FyCiAgICAgIGljb246IG1kaTpjYXItZWxlY3RyaWMKICAgICAgbGF5b3V0OiBoZXJvCiAgICAgIGhvdXJzX3RvX3Nob3c6IDEyCiAgICAgIGVudGl0aWVzOgogICAgICAgIC0gZW50aXR5OiBzZW5zb3IuZXZfYmF0dGVyeQogICAgICAgICAgbmFtZTogQmF0dGVyeQogICAgICAgICAgdmlzdWFsOiByaW5nCiAgICAgICAgICBydWxlczoKICAgICAgICAgICAgLSB7IGJlbG93OiAyMCwgY29sb3I6IHJlZCwgbGFiZWw6IExvdyB9CiAgICAgICAgICAgIC0geyBiZWxvdzogNTAsIGNvbG9yOiBhbWJlciB9CiAgICAgICAgICAgIC0geyBhYm92ZTogNTAsIGNvbG9yOiBncmVlbiB9CiAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLmV2X3JhbmdlLCBuYW1lOiBSYW5nZSwgaWNvbjogbWRpOm1hcC1tYXJrZXItZGlzdGFuY2UgfQogICAgICAgIC0gZW50aXR5OiBzZW5zb3IuZXZfY2hhcmdlcl9wb3dlcgogICAgICAgICAgbmFtZTogQ2hhcmdlcgogICAgICAgICAgZGVjaW1hbHM6IDAKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgYmVsb3c6IDAsIGNvbG9yOiB0ZWFsLCBpY29uOiBtZGk6YmF0dGVyeS1hcnJvdy11cCwgbGFiZWw6IEZlZWRpbmcgaG9tZSB9CiAgICAgICAgICAgIC0geyBiZWxvdzogMTAsIGNvbG9yOiBncmV5LCBpY29uOiBtZGk6ZXYtc3RhdGlvbiwgbGFiZWw6IElkbGUgfQogICAgICAgICAgICAtIHsgYWJvdmU6IDEwLCBjb2xvcjogZ3JlZW4sIGljb246IG1kaTpldi1wbHVnLXR5cGUyLCBsYWJlbDogQ2hhcmdpbmcgfQogICAgICAgIC0gZW50aXR5OiBiaW5hcnlfc2Vuc29yLmV2X3BsdWdnZWQKICAgICAgICAgIG5hbWU6IENhYmxlCiAgICAgICAgICBydWxlczoKICAgICAgICAgICAgLSB7IHN0YXRlOiAib24iLCBjb2xvcjogZ3JlZW4sIGljb246IG1kaTpwb3dlci1wbHVnLCBsYWJlbDogUGx1Z2dlZCBpbiB9CiAgICAgICAgICAgIC0geyBzdGF0ZTogIm9mZiIsIGNvbG9yOiBncmV5LCBpY29uOiBtZGk6cG93ZXItcGx1Zy1vZmYsIGxhYmVsOiBVbnBsdWdnZWQgfQogICAgLSB7IHR5cGU6IGhlYWRpbmcsIGhlYWRpbmc6IFNvbGFyLCBpY29uOiBtZGk6c29sYXItcG93ZXIgfQogICAgLSB0eXBlOiBjdXN0b206bXVsdGktdHJlbmQtY2FyZAogICAgICB0aXRsZTogU29sYXIKICAgICAgaWNvbjogbWRpOnNvbGFyLXBvd2VyLXZhcmlhbnQKICAgICAgaG91cnNfdG9fc2hvdzogMTIKICAgICAgbGF5b3V0OiBsYW5lcwogICAgICBlbnRpdGllczoKICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3Iuc29sYXJfZWFzdCwgbmFtZTogRWFzdCByb29mLCBjb2xvcjogYW1iZXIgfQogICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5zb2xhcl93ZXN0LCBuYW1lOiBXZXN0IHJvb2YsIGNvbG9yOiBvcmFuZ2UgfQo=">

```yaml
- column_span: 2
  cards:
    - { type: heading, heading: Power, icon: mdi:lightning-bolt }
    - type: custom:power-flow-card
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
    - { type: custom:entity-card, entity: sensor.energy_today, name: Used today, icon: mdi:home-lightning-bolt, grid_options: { columns: 3 } }
    - { type: custom:entity-card, entity: sensor.electricity_price, name: Price, icon: mdi:cash, grid_options: { columns: 3 } }
    - type: custom:entity-card
      entity: sensor.battery_soc
      name: Battery charge
      visual: ring
      rules:
        - { below: 20, color: red, label: Low }
        - { below: 50, color: amber }
        - { above: 50, color: green }
      grid_options: { columns: 3 }
    - { type: custom:entity-card, entity: sensor.grid_fossil_percentage, name: Fossil share, icon: mdi:molecule-co2, grid_options: { columns: 3 } }
    - type: custom:entity-card
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
    - type: custom:entity-card
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
    - type: custom:entity-group-card
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
    - type: custom:multi-trend-card
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

Entity sections cards with row and table layouts, badges coloured by state, template tiles that count and tint the card, toggles, a strip, a bar, scene and mode buttons, and a multi trend card.

<DashboardGrid b64="LSBjb2x1bW5fc3BhbjogMQogIGNhcmRzOgogICAgLSB7IHR5cGU6IGhlYWRpbmcsIGhlYWRpbmc6IEhvbWUsIGljb246IG1kaTpob21lIH0KICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1zZWN0aW9ucy1jYXJkCiAgICAgIHRpdGxlOiBXaG8ncyBob21lCiAgICAgIGljb246IG1kaTpzaGllbGQtaG9tZQogICAgICBzaG93X2ljb246IHRydWUKICAgICAgc2VjdGlvbnM6CiAgICAgICAgLSBsYXlvdXQ6IHJvdwogICAgICAgICAgYWxpZ246IHNwYWNlLWJldHdlZW4KICAgICAgICAgIGVudGl0aWVzOgogICAgICAgICAgICAtIHsgZW50aXR5OiBwZXJzb24uYWxleCwgbmFtZTogQWxleCwgdmlzdWFsOiBiYWRnZSwgcnVsZXM6ICZwIFt7IHN0YXRlOiBob21lLCBjb2xvcjogZ3JlZW4sIGxhYmVsOiBIb21lIH0sIHsgc3RhdGU6IG5vdF9ob21lLCBjb2xvcjogZ3JleSwgbGFiZWw6IEF3YXkgfV0gfQogICAgICAgICAgICAtIHsgZW50aXR5OiBwZXJzb24uc2FtLCBuYW1lOiBTYW0sIHZpc3VhbDogYmFkZ2UsIHJ1bGVzOiAqcCB9CiAgICAgICAgICAgIC0geyBlbnRpdHk6IHBlcnNvbi5raW0sIG5hbWU6IEtpbSwgdmlzdWFsOiBiYWRnZSwgcnVsZXM6ICpwIH0KICAgICAgICAtIGxheW91dDogdGFibGUKICAgICAgICAgIGRpdmlkZXI6IHRydWUKICAgICAgICAgIGVudGl0aWVzOgogICAgICAgICAgICAtIHsgZW50aXR5OiBiaW5hcnlfc2Vuc29yLmRvb3JfZnJvbnQsIG5hbWU6IEZyb250IGRvb3IsIHZpc3VhbDogYmFkZ2UsIHJ1bGVzOiBbeyBzdGF0ZTogIm9uIiwgY29sb3I6IHJlZCwgaWNvbjogbWRpOmRvb3Itb3BlbiwgbGFiZWw6IE9wZW4gfSwgeyBzdGF0ZTogIm9mZiIsIGNvbG9yOiBncmVlbiwgaWNvbjogbWRpOmRvb3ItY2xvc2VkLCBsYWJlbDogQ2xvc2VkIH1dIH0KICAgICAgICAgICAgLSB7IGVudGl0eTogYmluYXJ5X3NlbnNvci53aW5kb3dfa2l0Y2hlbiwgbmFtZTogS2l0Y2hlbiB3aW5kb3csIHZpc3VhbDogYmFkZ2UsIHJ1bGVzOiAmdyBbeyBzdGF0ZTogIm9uIiwgY29sb3I6IHJlZCwgaWNvbjogbWRpOndpbmRvdy1vcGVuLCBsYWJlbDogT3BlbiB9LCB7IHN0YXRlOiAib2ZmIiwgY29sb3I6IGdyZWVuLCBpY29uOiBtZGk6d2luZG93LWNsb3NlZCwgbGFiZWw6IENsb3NlZCB9XSB9CiAgICAgICAgICAgIC0geyBlbnRpdHk6IGJpbmFyeV9zZW5zb3Iud2luZG93X2JhdGhyb29tLCBuYW1lOiBCYXRocm9vbSB3aW5kb3csIHZpc3VhbDogYmFkZ2UsIHJ1bGVzOiAqdyB9CiAgICAgICAgICAgIC0geyBlbnRpdHk6IGJpbmFyeV9zZW5zb3IubW90aW9uX2hhbGx3YXksIG5hbWU6IEhhbGx3YXkgbW90aW9uLCB2aXN1YWw6IGJhZGdlLCBydWxlczogW3sgc3RhdGU6ICJvbiIsIGNvbG9yOiBhbWJlciwgaWNvbjogbWRpOm1vdGlvbi1zZW5zb3IsIGxhYmVsOiBEZXRlY3RlZCB9LCB7IHN0YXRlOiAib2ZmIiwgY29sb3I6IGdyZXksIGljb246IG1kaTptb3Rpb24tc2Vuc29yLW9mZiwgbGFiZWw6IENsZWFyIH1dIH0KICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkCiAgICAgIGVudGl0eTogYmluYXJ5X3NlbnNvci53aW5kb3dfa2l0Y2hlbgogICAgICBuYW1lOiBPcGVuIHdpbmRvd3MKICAgICAgaWNvbjogbWRpOndpbmRvdy1vcGVuLXZhcmlhbnQKICAgICAgdmFsdWU6ICJ7eyBzdGF0ZXMuYmluYXJ5X3NlbnNvciB8IHNlbGVjdGF0dHIoJ2F0dHJpYnV0ZXMuZGV2aWNlX2NsYXNzJywgJ2VxJywgJ3dpbmRvdycpIHwgc2VsZWN0YXR0cignc3RhdGUnLCAnZXEnLCAnb24nKSB8IGxpc3QgfCBjb3VudCB9fSIKICAgICAgcnVsZXM6CiAgICAgICAgLSB7IGJlbG93OiAxLCBjb2xvcjogZ3JlZW4sIGxhYmVsOiBBbGwgY2xvc2VkIH0KICAgICAgICAtIHsgYWJvdmU6IDEsIGNvbG9yOiByZWQsIGxhYmVsOiBBaXJpbmcsIHRpbnRfY2FyZDogdHJ1ZSB9CiAgICAgIGdyaWRfb3B0aW9uczogeyBjb2x1bW5zOiA2IH0KICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkCiAgICAgIGVudGl0eTogbGlnaHQubGl2aW5nX3Jvb20KICAgICAgbmFtZTogTGlnaHRzIG9uCiAgICAgIGljb246IG1kaTpsaWdodGJ1bGItZ3JvdXAKICAgICAgdmFsdWU6ICJ7eyBzdGF0ZXMubGlnaHQgfCBzZWxlY3RhdHRyKCdzdGF0ZScsICdlcScsICdvbicpIHwgbGlzdCB8IGNvdW50IH19IgogICAgICBzdWZmaXg6ICIgb2YgOCIKICAgICAgcnVsZXM6CiAgICAgICAgLSB7IGJlbG93OiAxLCBjb2xvcjogZ3JleSwgbGFiZWw6IEFsbCBvZmYgfQogICAgICAgIC0geyBhYm92ZTogMSwgY29sb3I6IGFtYmVyLCBsYWJlbDogU29tZSBvbiB9CiAgICAgIGdyaWRfb3B0aW9uczogeyBjb2x1bW5zOiA2IH0KICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkCiAgICAgIGVudGl0eTogc2Vuc29yLndhc2hlcl9zdGF0dXMKICAgICAgbmFtZTogV2FzaGluZyBtYWNoaW5lCiAgICAgIHNlY29uZGFyeTogInt7IHN0YXRlcygnc2Vuc29yLndhc2hlcl9yZW1haW5pbmcnKSB9fSBtaW4gbGVmdCIKICAgICAgdmlzdWFsOiBiYWRnZQogICAgICBydWxlczoKICAgICAgICAtIHsgc3RhdGU6IHJ1biwgY29sb3I6IGdyZWVuLCBpY29uOiBtZGk6d2FzaGluZy1tYWNoaW5lLCBsYWJlbDogUnVubmluZyB9CiAgICAgICAgLSB7IHN0YXRlOiBlbmQsIGNvbG9yOiB0ZWFsLCBpY29uOiBtZGk6d2FzaGluZy1tYWNoaW5lLWFsZXJ0LCBsYWJlbDogRG9uZSwgdGludF9jYXJkOiB0cnVlIH0KICAgICAgICAtIHsgc3RhdGU6IHBvd2VyX29mZiwgY29sb3I6IGdyZXksIGljb246IG1kaTp3YXNoaW5nLW1hY2hpbmUtb2ZmLCBsYWJlbDogIk9mZiIgfQogICAgICBncmlkX29wdGlvbnM6IHsgY29sdW1uczogNiB9CiAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZAogICAgICBlbnRpdHk6IHZhY3V1bS5yb2JvdAogICAgICBuYW1lOiBSb2JvdCB2YWN1dW0KICAgICAgc2Vjb25kYXJ5OiAie3sgc3RhdGVzKCdzZW5zb3Iucm9ib3RfY3VycmVudF9yb29tJykgfX0gwrcge3sgc3RhdGVzKCdzZW5zb3Iucm9ib3RfYmF0dGVyeScpIH19ICUiCiAgICAgIHZpc3VhbDogYmFkZ2UKICAgICAgcnVsZXM6CiAgICAgICAgLSB7IHN0YXRlOiBkb2NrZWQsIGNvbG9yOiBncmVlbiwgaWNvbjogbWRpOnJvYm90LXZhY3V1bSwgbGFiZWw6IERvY2tlZCB9CiAgICAgICAgLSB7IHN0YXRlOiBjbGVhbmluZywgY29sb3I6IGJsdWUsIGljb246IG1kaTpyb2JvdC12YWN1dW0sIGxhYmVsOiBDbGVhbmluZyB9CiAgICAgICAgLSB7IHN0YXRlOiByZXR1cm5pbmcsIGNvbG9yOiB0ZWFsLCBpY29uOiBtZGk6aG9tZS1pbXBvcnQtb3V0bGluZSwgbGFiZWw6IFJldHVybmluZyB9CiAgICAgIGdyaWRfb3B0aW9uczogeyBjb2x1bW5zOiA2IH0KLSBjb2x1bW5fc3BhbjogMQogIGNhcmRzOgogICAgLSB7IHR5cGU6IGhlYWRpbmcsIGhlYWRpbmc6IFJvb21zLCBpY29uOiBtZGk6Zmxvb3ItcGxhbiB9CiAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktZ3JvdXAtY2FyZAogICAgICB0aXRsZTogTGl2aW5nIHJvb20KICAgICAgaWNvbjogbWRpOnNvZmEKICAgICAgZW50aXRpZXM6CiAgICAgICAgLSBlbnRpdHk6IGxpZ2h0LmxpdmluZ19yb29tCiAgICAgICAgICB0b2dnbGU6IHRydWUKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgc3RhdGU6ICJvbiIsIGNvbG9yOiBhbWJlciwgbGFiZWw6ICJPbiIgfQogICAgICAgICAgICAtIHsgc3RhdGU6ICJvZmYiLCBjb2xvcjogZ3JleSwgbGFiZWw6ICJPZmYiIH0KICAgICAgICAtIGVudGl0eTogbGlnaHQuZGluaW5nX3RhYmxlCiAgICAgICAgICB0b2dnbGU6IHRydWUKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgc3RhdGU6ICJvbiIsIGNvbG9yOiBhbWJlciwgbGFiZWw6ICJPbiIgfQogICAgICAgICAgICAtIHsgc3RhdGU6ICJvZmYiLCBjb2xvcjogZ3JleSwgbGFiZWw6ICJPZmYiIH0KICAgICAgICAtIGVudGl0eTogc2Vuc29yLmxpdmluZ19yb29tX3RlbXBlcmF0dXJlCiAgICAgICAgICBuYW1lOiBUZW1wZXJhdHVyZQogICAgICAgICAgZGVjaW1hbHM6IDEKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgYmVsb3c6IDE5LCBjb2xvcjogYmx1ZSwgbGFiZWw6IENvbGQgfQogICAgICAgICAgICAtIHsgYmVsb3c6IDI0LCBjb2xvcjogZ3JlZW4sIGxhYmVsOiBDb21mb3J0YWJsZSB9CiAgICAgICAgICAgIC0geyBhYm92ZTogMjQsIGNvbG9yOiBvcmFuZ2UsIGxhYmVsOiBXYXJtIH0KICAgICAgICAtIGVudGl0eTogc2Vuc29yLmxpdmluZ19yb29tX2NvMgogICAgICAgICAgbmFtZTogQ0/igoIKICAgICAgICAgIHZpc3VhbDogc3RyaXAKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgYmVsb3c6IDgwMCwgY29sb3I6IGdyZWVuIH0KICAgICAgICAgICAgLSB7IGJlbG93OiAxMjAwLCBjb2xvcjogYW1iZXIgfQogICAgICAgICAgICAtIHsgYWJvdmU6IDEyMDAsIGNvbG9yOiByZWQgfQogICAgICAgIC0geyBlbnRpdHk6IGNvdmVyLmxpdmluZ19yb29tX2JsaW5kcywgbmFtZTogQmxpbmRzLCBpY29uOiBtZGk6d2luZG93LXNodXR0ZXIsIGF0dHJpYnV0ZTogY3VycmVudF9wb3NpdGlvbiwgdW5pdDogIiUiLCB2aXN1YWw6IGJhciB9CiAgICAgICAgLSBlbnRpdHk6IG1lZGlhX3BsYXllci5saXZpbmdfcm9vbV90dgogICAgICAgICAgbmFtZTogVFYKICAgICAgICAgIHZpc3VhbDogYmFkZ2UKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgc3RhdGU6IHBsYXlpbmcsIGNvbG9yOiBncmVlbiwgaWNvbjogbWRpOnBsYXktY2lyY2xlLCBsYWJlbDogUGxheWluZyB9CiAgICAgICAgICAgIC0geyBzdGF0ZTogaWRsZSwgY29sb3I6IGdyZXksIGljb246IG1kaTp0ZWxldmlzaW9uLCBsYWJlbDogSWRsZSB9CiAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktc2VjdGlvbnMtY2FyZAogICAgICB0aXRsZTogT2ZmaWNlCiAgICAgIGljb246IG1kaTpkZXNrCiAgICAgIGhlYWRlcl9lbnRpdGllczoKICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3Iub2ZmaWNlX3RlbXBlcmF0dXJlLCBkZWNpbWFsczogMSB9CiAgICAgICAgLSBlbnRpdHk6IHNlbnNvci5vZmZpY2VfY28yCiAgICAgICAgICBkZWNpbWFsczogMAogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBiZWxvdzogODAwLCBjb2xvcjogZ3JlZW4gfQogICAgICAgICAgICAtIHsgYmVsb3c6IDEyMDAsIGNvbG9yOiBhbWJlciB9CiAgICAgICAgICAgIC0geyBhYm92ZTogMTIwMCwgY29sb3I6IHJlZCB9CiAgICAgIHNlY3Rpb25zOgogICAgICAgIC0gbGF5b3V0OiByb3cKICAgICAgICAgIGFsaWduOiBzcGFjZS1iZXR3ZWVuCiAgICAgICAgICBzaG93X25hbWU6IGZhbHNlCiAgICAgICAgICBlbnRpdGllczoKICAgICAgICAgICAgLSB7IGVudGl0eTogbGlnaHQub2ZmaWNlLCB0YXBfYWN0aW9uOiB0b2dnbGUsIHJ1bGVzOiBbeyBzdGF0ZTogIm9uIiwgY29sb3I6IGFtYmVyIH0sIHsgc3RhdGU6ICJvZmYiLCBjb2xvcjogZ3JleSB9XSB9CiAgICAgICAgICAgIC0geyBlbnRpdHk6IGxpZ2h0LmRlc2tfbGFtcCwgdGFwX2FjdGlvbjogdG9nZ2xlLCBydWxlczogW3sgc3RhdGU6ICJvbiIsIGNvbG9yOiBhbWJlciB9LCB7IHN0YXRlOiAib2ZmIiwgY29sb3I6IGdyZXkgfV0gfQogICAgICAgICAgICAtIHsgZW50aXR5OiBjb3Zlci5vZmZpY2VfYmxpbmRzLCBpY29uOiBtZGk6d2luZG93LXNodXR0ZXIsIGF0dHJpYnV0ZTogY3VycmVudF9wb3NpdGlvbiwgdW5pdDogIiUiIH0KICAgIC0gdHlwZTogY3VzdG9tOm11bHRpLXRyZW5kLWNhcmQKICAgICAgdGl0bGU6IEluZG9vciB0ZW1wZXJhdHVyZXMKICAgICAgaWNvbjogbWRpOmhvbWUtdGhlcm1vbWV0ZXIKICAgICAgaG91cnNfdG9fc2hvdzogMTIKICAgICAgbGF5b3V0OiBvdmVybGF5CiAgICAgIGVudGl0aWVzOgogICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5saXZpbmdfcm9vbV90ZW1wZXJhdHVyZSwgbmFtZTogTGl2aW5nIHJvb20sIGNvbG9yOiBvcmFuZ2UgfQogICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5iZWRyb29tX3RlbXBlcmF0dXJlLCBuYW1lOiBCZWRyb29tLCBjb2xvcjogYmx1ZSB9CiAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLm9mZmljZV90ZW1wZXJhdHVyZSwgbmFtZTogT2ZmaWNlLCBjb2xvcjogcmVkIH0KLSBjb2x1bW5fc3BhbjogMQogIGNhcmRzOgogICAgLSB7IHR5cGU6IGhlYWRpbmcsIGhlYWRpbmc6IFNjZW5lcyAmIG1vZGVzLCBpY29uOiBtZGk6cGFsZXR0ZSB9CiAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktc2VjdGlvbnMtY2FyZAogICAgICB0aXRsZTogTW9kZXMgJiBzY2VuZXMKICAgICAgaWNvbjogbWRpOnBhbGV0dGUKICAgICAgc2hvd19uYW1lOiB0cnVlCiAgICAgIHNlY3Rpb25zOgogICAgICAgIC0gbGF5b3V0OiByb3cKICAgICAgICAgIGFsaWduOiBzcGFjZS1iZXR3ZWVuCiAgICAgICAgICBlbnRpdGllczoKICAgICAgICAgICAgLSB7IGVudGl0eTogaW5wdXRfYm9vbGVhbi5uaWdodF9tb2RlLCBuYW1lOiBOaWdodCwgdGFwX2FjdGlvbjogdG9nZ2xlLCBydWxlczogW3sgc3RhdGU6ICJvbiIsIGNvbG9yOiBpbmRpZ28gfSwgeyBzdGF0ZTogIm9mZiIsIGNvbG9yOiBncmV5IH1dIH0KICAgICAgICAgICAgLSB7IGVudGl0eTogaW5wdXRfYm9vbGVhbi5ndWVzdF9tb2RlLCBuYW1lOiBHdWVzdHMsIHRhcF9hY3Rpb246IHRvZ2dsZSwgcnVsZXM6IFt7IHN0YXRlOiAib24iLCBjb2xvcjogcGluayB9LCB7IHN0YXRlOiAib2ZmIiwgY29sb3I6IGdyZXkgfV0gfQogICAgICAgICAgICAtIHsgZW50aXR5OiBpbnB1dF9ib29sZWFuLmF3YXlfbW9kZSwgbmFtZTogQXdheSwgdGFwX2FjdGlvbjogdG9nZ2xlLCBydWxlczogW3sgc3RhdGU6ICJvbiIsIGNvbG9yOiBibHVlIH0sIHsgc3RhdGU6ICJvZmYiLCBjb2xvcjogZ3JleSB9XSB9CiAgICAgICAgICAgIC0geyBlbnRpdHk6IGlucHV0X2Jvb2xlYW4udmFjYXRpb25fbW9kZSwgbmFtZTogVmFjYXRpb24sIHRhcF9hY3Rpb246IHRvZ2dsZSwgcnVsZXM6IFt7IHN0YXRlOiAib24iLCBjb2xvcjogdGVhbCwgdGludF9jYXJkOiB0cnVlIH0sIHsgc3RhdGU6ICJvZmYiLCBjb2xvcjogZ3JleSB9XSB9CiAgICAgICAgLSBsYXlvdXQ6IHJvdwogICAgICAgICAgZGl2aWRlcjogdHJ1ZQogICAgICAgICAgYWxpZ246IHNwYWNlLWJldHdlZW4KICAgICAgICAgIG5hbWVfcG9zaXRpb246IGJlbG93CiAgICAgICAgICBlbnRpdGllczoKICAgICAgICAgICAgLSB7IGVudGl0eTogc2NlbmUuYnJpZ2h0LCBuYW1lOiBCcmlnaHQsIGljb246IG1kaTp3aGl0ZS1iYWxhbmNlLXN1bm55LCBjb2xvcjogYW1iZXIsIHRhcF9hY3Rpb246IHsgYWN0aW9uOiBwZXJmb3JtLWFjdGlvbiwgcGVyZm9ybV9hY3Rpb246IHNjZW5lLnR1cm5fb24sIHRhcmdldDogeyBlbnRpdHlfaWQ6IHNjZW5lLmJyaWdodCB9IH0gfQogICAgICAgICAgICAtIHsgZW50aXR5OiBzY2VuZS5kaW1tZWQsIG5hbWU6IERpbW1lZCwgaWNvbjogbWRpOmxpZ2h0YnVsYi1vbi01MCwgY29sb3I6IG9yYW5nZSwgdGFwX2FjdGlvbjogeyBhY3Rpb246IHBlcmZvcm0tYWN0aW9uLCBwZXJmb3JtX2FjdGlvbjogc2NlbmUudHVybl9vbiwgdGFyZ2V0OiB7IGVudGl0eV9pZDogc2NlbmUuZGltbWVkIH0gfSB9CiAgICAgICAgICAgIC0geyBlbnRpdHk6IHNjZW5lLmRpbm5lciwgbmFtZTogRGlubmVyLCBpY29uOiBtZGk6c2lsdmVyd2FyZS1mb3JrLWtuaWZlLCBjb2xvcjogZGVlcC1vcmFuZ2UsIHRhcF9hY3Rpb246IHsgYWN0aW9uOiBwZXJmb3JtLWFjdGlvbiwgcGVyZm9ybV9hY3Rpb246IHNjZW5lLnR1cm5fb24sIHRhcmdldDogeyBlbnRpdHlfaWQ6IHNjZW5lLmRpbm5lciB9IH0gfQogICAgICAgICAgICAtIHsgZW50aXR5OiBzY2VuZS5tb3ZpZV9uaWdodCwgbmFtZTogTW92aWUsIGljb246IG1kaTptb3ZpZS1vcGVuLCBjb2xvcjogZGVlcC1wdXJwbGUsIHRhcF9hY3Rpb246IHsgYWN0aW9uOiBwZXJmb3JtLWFjdGlvbiwgcGVyZm9ybV9hY3Rpb246IHNjZW5lLnR1cm5fb24sIHRhcmdldDogeyBlbnRpdHlfaWQ6IHNjZW5lLm1vdmllX25pZ2h0IH0gfSB9CiAgICAgICAgICAgIC0geyBlbnRpdHk6IHNjZW5lLmdvb2RfbmlnaHQsIG5hbWU6IE5pZ2h0LCBpY29uOiBtZGk6d2VhdGhlci1uaWdodCwgY29sb3I6IGluZGlnbywgdGFwX2FjdGlvbjogeyBhY3Rpb246IHBlcmZvcm0tYWN0aW9uLCBwZXJmb3JtX2FjdGlvbjogc2NlbmUudHVybl9vbiwgdGFyZ2V0OiB7IGVudGl0eV9pZDogc2NlbmUuZ29vZF9uaWdodCB9IH0gfQogICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWdyb3VwLWNhcmQKICAgICAgdGl0bGU6IEFwcGxpYW5jZXMKICAgICAgaWNvbjogbWRpOnBvd2VyLXBsdWcKICAgICAgbGF5b3V0OiB0YWJsZQogICAgICBzaG93X2ljb246IHRydWUKICAgICAgZW50aXRpZXM6CiAgICAgICAgLSB7IGVudGl0eTogc3dpdGNoLmNvZmZlZV9tYWNoaW5lLCBuYW1lOiBDb2ZmZWUgbWFjaGluZSwgaWNvbjogbWRpOmNvZmZlZS1tYWtlciwgdG9nZ2xlOiB0cnVlLCBzaG93X3ZhbHVlOiBmYWxzZSB9CiAgICAgICAgLSBlbnRpdHk6IHNlbnNvci5kaXNod2FzaGVyX3N0YXR1cwogICAgICAgICAgbmFtZTogRGlzaHdhc2hlcgogICAgICAgICAgdmlzdWFsOiBiYWRnZQogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBzdGF0ZTogcnVuLCBjb2xvcjogZ3JlZW4sIGljb246IG1kaTpkaXNod2FzaGVyLCBsYWJlbDogUnVubmluZyB9CiAgICAgICAgICAgIC0geyBzdGF0ZTogZW5kLCBjb2xvcjogdGVhbCwgaWNvbjogbWRpOmRpc2h3YXNoZXItYWxlcnQsIGxhYmVsOiBEb25lIH0KICAgICAgICAgICAgLSB7IHN0YXRlOiBwb3dlcl9vZmYsIGNvbG9yOiBncmV5LCBpY29uOiBtZGk6ZGlzaHdhc2hlci1vZmYsIGxhYmVsOiAiT2ZmIiB9CiAgICAgICAgLSBlbnRpdHk6IG1lZGlhX3BsYXllci5raXRjaGVuX3NwZWFrZXIKICAgICAgICAgIG5hbWU6IEtpdGNoZW4gc3BlYWtlcgogICAgICAgICAgdmlzdWFsOiBiYWRnZQogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBzdGF0ZTogcGxheWluZywgY29sb3I6IGdyZWVuLCBpY29uOiBtZGk6c3BlYWtlci1wbGF5LCBsYWJlbDogUGxheWluZyB9CiAgICAgICAgICAgIC0geyBzdGF0ZTogaWRsZSwgY29sb3I6IGdyZXksIGljb246IG1kaTpzcGVha2VyLCBsYWJlbDogSWRsZSB9CiAgICAgICAgLSBlbnRpdHk6IHNlbnNvci5tb3Rpb25faGFsbHdheV9iYXR0ZXJ5CiAgICAgICAgICBuYW1lOiBNb3Rpb24gc2Vuc29yIGJhdHRlcnkKICAgICAgICAgIHZpc3VhbDogcmluZwogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBiZWxvdzogMjAsIGNvbG9yOiByZWQsIGxhYmVsOiBSZXBsYWNlIH0KICAgICAgICAgICAgLSB7IGJlbG93OiA1MCwgY29sb3I6IGFtYmVyIH0KICAgICAgICAgICAgLSB7IGFib3ZlOiA1MCwgY29sb3I6IGdyZWVuIH0K">

```yaml
- column_span: 1
  cards:
    - { type: heading, heading: Home, icon: mdi:home }
    - type: custom:entity-sections-card
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
    - type: custom:entity-card
      entity: binary_sensor.window_kitchen
      name: Open windows
      icon: mdi:window-open-variant
      value: "{{ states.binary_sensor | selectattr('attributes.device_class', 'eq', 'window') | selectattr('state', 'eq', 'on') | list | count }}"
      rules:
        - { below: 1, color: green, label: All closed }
        - { above: 1, color: red, label: Airing, tint_card: true }
      grid_options: { columns: 6 }
    - type: custom:entity-card
      entity: light.living_room
      name: Lights on
      icon: mdi:lightbulb-group
      value: "{{ states.light | selectattr('state', 'eq', 'on') | list | count }}"
      suffix: " of 8"
      rules:
        - { below: 1, color: grey, label: All off }
        - { above: 1, color: amber, label: Some on }
      grid_options: { columns: 6 }
    - type: custom:entity-card
      entity: sensor.washer_status
      name: Washing machine
      secondary: "{{ states('sensor.washer_remaining') }} min left"
      visual: badge
      rules:
        - { state: run, color: green, icon: mdi:washing-machine, label: Running }
        - { state: end, color: teal, icon: mdi:washing-machine-alert, label: Done, tint_card: true }
        - { state: power_off, color: grey, icon: mdi:washing-machine-off, label: "Off" }
      grid_options: { columns: 6 }
    - type: custom:entity-card
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
    - type: custom:entity-group-card
      title: Living room
      icon: mdi:sofa
      entities:
        - entity: light.living_room
          toggle: true
          rules:
            - { state: "on", color: amber, label: "On" }
            - { state: "off", color: grey, label: "Off" }
        - entity: light.dining_table
          toggle: true
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
        - { entity: cover.living_room_blinds, name: Blinds, icon: mdi:window-shutter, attribute: current_position, unit: "%", visual: bar }
        - entity: media_player.living_room_tv
          name: TV
          visual: badge
          rules:
            - { state: playing, color: green, icon: mdi:play-circle, label: Playing }
            - { state: idle, color: grey, icon: mdi:television, label: Idle }
    - type: custom:entity-sections-card
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
            - { entity: light.office, tap_action: toggle, rules: [{ state: "on", color: amber }, { state: "off", color: grey }] }
            - { entity: light.desk_lamp, tap_action: toggle, rules: [{ state: "on", color: amber }, { state: "off", color: grey }] }
            - { entity: cover.office_blinds, icon: mdi:window-shutter, attribute: current_position, unit: "%" }
    - type: custom:multi-trend-card
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
    - type: custom:entity-sections-card
      title: Modes & scenes
      icon: mdi:palette
      show_name: true
      sections:
        - layout: row
          align: space-between
          entities:
            - { entity: input_boolean.night_mode, name: Night, tap_action: toggle, rules: [{ state: "on", color: indigo }, { state: "off", color: grey }] }
            - { entity: input_boolean.guest_mode, name: Guests, tap_action: toggle, rules: [{ state: "on", color: pink }, { state: "off", color: grey }] }
            - { entity: input_boolean.away_mode, name: Away, tap_action: toggle, rules: [{ state: "on", color: blue }, { state: "off", color: grey }] }
            - { entity: input_boolean.vacation_mode, name: Vacation, tap_action: toggle, rules: [{ state: "on", color: teal, tint_card: true }, { state: "off", color: grey }] }
        - layout: row
          divider: true
          align: space-between
          name_position: below
          entities:
            - { entity: scene.bright, name: Bright, icon: mdi:white-balance-sunny, color: amber, tap_action: { action: perform-action, perform_action: scene.turn_on, target: { entity_id: scene.bright } } }
            - { entity: scene.dimmed, name: Dimmed, icon: mdi:lightbulb-on-50, color: orange, tap_action: { action: perform-action, perform_action: scene.turn_on, target: { entity_id: scene.dimmed } } }
            - { entity: scene.dinner, name: Dinner, icon: mdi:silverware-fork-knife, color: deep-orange, tap_action: { action: perform-action, perform_action: scene.turn_on, target: { entity_id: scene.dinner } } }
            - { entity: scene.movie_night, name: Movie, icon: mdi:movie-open, color: deep-purple, tap_action: { action: perform-action, perform_action: scene.turn_on, target: { entity_id: scene.movie_night } } }
            - { entity: scene.good_night, name: Night, icon: mdi:weather-night, color: indigo, tap_action: { action: perform-action, perform_action: scene.turn_on, target: { entity_id: scene.good_night } } }
    - type: custom:entity-group-card
      title: Appliances
      icon: mdi:power-plug
      layout: table
      show_icon: true
      entities:
        - { entity: switch.coffee_machine, name: Coffee machine, icon: mdi:coffee-maker, toggle: true, show_value: false }
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

<DashboardGrid b64="LSBjb2x1bW5fc3BhbjogMgogIGNhcmRzOgogICAgLSB7IHR5cGU6IGhlYWRpbmcsIGhlYWRpbmc6IFdlYXRoZXIgc3RhdGlvbiwgaWNvbjogbWRpOmFjY2Vzcy1wb2ludCB9CiAgICAtIHR5cGU6IGN1c3RvbTp3aW5kLWNhcmQKICAgICAgZW50aXR5OiBzZW5zb3Iud2luZF9zcGVlZAogICAgICBkaXJlY3Rpb246IHNlbnNvci53aW5kX2RpcmVjdGlvbgogICAgICBndXN0OiBzZW5zb3Iud2luZF9ndXN0CiAgICAgIHRpdGxlOiBXaW5kCiAgICAgIGxheW91dDogaGVybwogICAgICBmbG93OiB7IHN0eWxlOiB2ZWN0b3JzIH0KICAgICAgcnVsZXM6CiAgICAgICAgLSB7IGJlbG93OiA1LCBjb2xvcjogYmx1ZS1ncmV5LCBsYWJlbDogQ2FsbSB9CiAgICAgICAgLSB7IGJlbG93OiAyMCwgY29sb3I6IHRlYWwsIGxhYmVsOiBMaWdodCBicmVlemUgfQogICAgICAgIC0geyBiZWxvdzogMzUsIGNvbG9yOiBhbWJlciwgbGFiZWw6IEZyZXNoIH0KICAgICAgICAtIHsgYWJvdmU6IDM1LCBjb2xvcjogcmVkLCBsYWJlbDogU3Rvcm0sIHRpbnRfY2FyZDogdHJ1ZSB9CiAgICAgIGdyaWRfb3B0aW9uczogeyBjb2x1bW5zOiA2IH0KICAgIC0gdHlwZTogY3VzdG9tOnJhaW4tY2FyZAogICAgICBlbnRpdHk6IHNlbnNvci5yYWluX3JhdGVfcm9vZgogICAgICB0b2RheTogc2Vuc29yLnJhaW5fdG9kYXkKICAgICAgd2luZDogc2Vuc29yLndpbmRfc3BlZWQKICAgICAgZGlyZWN0aW9uOiBzZW5zb3Iud2luZF9kaXJlY3Rpb24KICAgICAgdGl0bGU6IFJhaW4KICAgICAgbGF5b3V0OiBoZXJvCiAgICAgIGZsb3c6IHsgc3R5bGU6IGZpbGwgfQogICAgICBydWxlczoKICAgICAgICAtIHsgYmVsb3c6IDAuMSwgY29sb3I6IGJsdWUtZ3JleSwgbGFiZWw6IERyeSB9CiAgICAgICAgLSB7IGJlbG93OiAyLjUsIGNvbG9yOiBsaWdodC1ibHVlLCBsYWJlbDogTGlnaHQgcmFpbiB9CiAgICAgICAgLSB7IGJlbG93OiA3LjYsIGNvbG9yOiBibHVlLCBsYWJlbDogTW9kZXJhdGUgcmFpbiB9CiAgICAgICAgLSB7IGFib3ZlOiA3LjYsIGNvbG9yOiBpbmRpZ28sIGxhYmVsOiBIZWF2eSByYWluLCB0aW50X2NhcmQ6IHRydWUgfQogICAgICBncmlkX29wdGlvbnM6IHsgY29sdW1uczogNiB9CiAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZAogICAgICBlbnRpdHk6IHNlbnNvci5vdXRkb29yX3RlbXBlcmF0dXJlCiAgICAgIG5hbWU6IFRlbXBlcmF0dXJlCiAgICAgIGRlY2ltYWxzOiAxCiAgICAgIHJ1bGVzOgogICAgICAgIC0geyBiZWxvdzogMCwgY29sb3I6IGluZGlnbywgbGFiZWw6IEZyb3N0LCB0aW50X2NhcmQ6IHRydWUgfQogICAgICAgIC0geyBiZWxvdzogMTYsIGNvbG9yOiBibHVlLCBsYWJlbDogQ29vbCB9CiAgICAgICAgLSB7IGJlbG93OiAyNiwgY29sb3I6IGdyZWVuLCBsYWJlbDogUGxlYXNhbnQgfQogICAgICAgIC0geyBhYm92ZTogMjYsIGNvbG9yOiBvcmFuZ2UsIGxhYmVsOiBIb3QsIHRpbnRfY2FyZDogdHJ1ZSB9CiAgICAgIGdyaWRfb3B0aW9uczogeyBjb2x1bW5zOiA0IH0KICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkCiAgICAgIGVudGl0eTogc2Vuc29yLm91dGRvb3JfaHVtaWRpdHkKICAgICAgbmFtZTogSHVtaWRpdHkKICAgICAgcnVsZXM6CiAgICAgICAgLSB7IGJlbG93OiA0MCwgY29sb3I6IGFtYmVyLCBsYWJlbDogRHJ5IH0KICAgICAgICAtIHsgYmVsb3c6IDcwLCBjb2xvcjogZ3JlZW4sIGxhYmVsOiBDb21mb3J0YWJsZSB9CiAgICAgICAgLSB7IGFib3ZlOiA3MCwgY29sb3I6IGJsdWUsIGxhYmVsOiBIdW1pZCB9CiAgICAgIGdyaWRfb3B0aW9uczogeyBjb2x1bW5zOiA0IH0KICAgIC0geyB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQsIGVudGl0eTogc2Vuc29yLnByZXNzdXJlLCBuYW1lOiBQcmVzc3VyZSwgZGVjaW1hbHM6IDAsIGdyaWRfb3B0aW9uczogeyBjb2x1bW5zOiA0IH0gfQogICAgLSB0eXBlOiBjdXN0b206bXVsdGktdHJlbmQtY2FyZAogICAgICB0aXRsZTogVGVtcGVyYXR1cmUgJiBkZXcgcG9pbnQKICAgICAgaWNvbjogbWRpOnRoZXJtb21ldGVyCiAgICAgIGhvdXJzX3RvX3Nob3c6IDEyCiAgICAgIHhfYXhpczogdHJ1ZQogICAgICBlbnRpdGllczoKICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3Iub3V0ZG9vcl90ZW1wZXJhdHVyZSwgbmFtZTogVGVtcGVyYXR1cmUsIGNvbG9yOiByZWQgfQogICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5kZXdfcG9pbnQsIG5hbWU6IERldyBwb2ludCwgY29sb3I6IGJsdWUgfQotIGNvbHVtbl9zcGFuOiAxCiAgY2FyZHM6CiAgICAtIHsgdHlwZTogaGVhZGluZywgaGVhZGluZzogRm9yZWNhc3QsIGljb246IG1kaTp3ZWF0aGVyLXBhcnRseS1jbG91ZHkgfQogICAgLSB0eXBlOiBjdXN0b206d2VhdGhlci1jYXJkCiAgICAgIGVudGl0eTogd2VhdGhlci5ob21lCiAgICAgIHRpdGxlOiBXZWF0aGVyCiAgICAgIHRlbXBlcmF0dXJlX3J1bGVzOgogICAgICAgIC0geyBiZWxvdzogMTIsIGNvbG9yOiBibHVlLCBsYWJlbDogQ29vbCB9CiAgICAgICAgLSB7IGJlbG93OiAyMCwgY29sb3I6IGdyZWVuLCBsYWJlbDogTWlsZCB9CiAgICAgICAgLSB7IGFib3ZlOiAyMCwgY29sb3I6IGFtYmVyLCBsYWJlbDogV2FybSB9CiAgICAgIHNlY3Rpb25zOgogICAgICAgIC0gdHlwZTogaGVybwogICAgICAgIC0geyB0eXBlOiByb3csIGVudGl0aWVzOiBbaHVtaWRpdHksIHdpbmRfc3BlZWQsIHByZXNzdXJlXSB9CiAgICAgICAgLSB7IHR5cGU6IHRyZW5kLCBtb2RlOiBob3VybHksIGhvdXJzOiAxMiwgc2hvdzogW3RlbXBlcmF0dXJlLCBwcmVjaXBpdGF0aW9uXSwgZGl2aWRlcjogdHJ1ZSB9CiAgICAgICAgLSB7IHR5cGU6IGZvcmVjYXN0LCBtb2RlOiBkYWlseSwgZGF5czogNSwgZGl2aWRlcjogdHJ1ZSB9Ci0gY29sdW1uX3NwYW46IDMKICBjYXJkczoKICAgIC0geyB0eXBlOiBoZWFkaW5nLCBoZWFkaW5nOiBEYXlsaWdodCwgaWNvbjogbWRpOndoaXRlLWJhbGFuY2Utc3VubnkgfQogICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWdyb3VwLWNhcmQKICAgICAgdGl0bGU6IFN1biAmIGxpZ2h0CiAgICAgIGljb246IG1kaTpzdW4tYW5nbGUKICAgICAgZW50aXRpZXM6CiAgICAgICAgLSBlbnRpdHk6IHN1bi5zdW4KICAgICAgICAgIG5hbWU6IFN1bgogICAgICAgICAgdmlzdWFsOiBiYWRnZQogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBzdGF0ZTogYWJvdmVfaG9yaXpvbiwgY29sb3I6IGFtYmVyLCBpY29uOiBtZGk6d2hpdGUtYmFsYW5jZS1zdW5ueSwgbGFiZWw6IFVwIH0KICAgICAgICAgICAgLSB7IHN0YXRlOiBiZWxvd19ob3Jpem9uLCBjb2xvcjogaW5kaWdvLCBpY29uOiBtZGk6d2VhdGhlci1uaWdodCwgbGFiZWw6IERvd24gfQogICAgICAgIC0geyBlbnRpdHk6IHN1bi5zdW4sIG5hbWU6IEVsZXZhdGlvbiwgaWNvbjogbWRpOmFuZ2xlLWFjdXRlLCBhdHRyaWJ1dGU6IGVsZXZhdGlvbiwgdW5pdDogwrAsIGRlY2ltYWxzOiAwIH0KICAgICAgICAtIHsgZW50aXR5OiBzdW4uc3VuLCBuYW1lOiBBemltdXRoLCBpY29uOiBtZGk6Y29tcGFzcy1vdXRsaW5lLCBhdHRyaWJ1dGU6IGF6aW11dGgsIHVuaXQ6IMKwLCBkZWNpbWFsczogMCB9CiAgICAgICAgLSBlbnRpdHk6IHNlbnNvci5pbGx1bWluYW5jZQogICAgICAgICAgbmFtZTogSWxsdW1pbmFuY2UKICAgICAgICAgIGRlY2ltYWxzOiAwCiAgICAgICAgICBydWxlczoKICAgICAgICAgICAgLSB7IGJlbG93OiAxMCwgY29sb3I6IGluZGlnbywgbGFiZWw6IE5pZ2h0IH0KICAgICAgICAgICAgLSB7IGJlbG93OiAxMDAwLCBjb2xvcjogYmx1ZS1ncmV5LCBsYWJlbDogRGltIH0KICAgICAgICAgICAgLSB7IGJlbG93OiAyNTAwMCwgY29sb3I6IGFtYmVyLCBsYWJlbDogRGF5bGlnaHQgfQogICAgICAgICAgICAtIHsgYWJvdmU6IDI1MDAwLCBjb2xvcjogb3JhbmdlLCBsYWJlbDogQnJpZ2h0IHN1biB9CiAgICAgICAgLSBlbnRpdHk6IHNlbnNvci51dl9pbmRleAogICAgICAgICAgbmFtZTogVVYgaW5kZXgKICAgICAgICAgIHVuaXQ6ICIiCiAgICAgICAgICBkZWNpbWFsczogMQogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBiZWxvdzogMywgY29sb3I6IGdyZWVuLCBsYWJlbDogTG93IH0KICAgICAgICAgICAgLSB7IGJlbG93OiA2LCBjb2xvcjogYW1iZXIsIGxhYmVsOiBNb2RlcmF0ZSB9CiAgICAgICAgICAgIC0geyBiZWxvdzogOCwgY29sb3I6IG9yYW5nZSwgbGFiZWw6IEhpZ2ggfQogICAgICAgICAgICAtIHsgYWJvdmU6IDgsIGNvbG9yOiByZWQsIGxhYmVsOiBWZXJ5IGhpZ2ggfQogICAgICBncmlkX29wdGlvbnM6IHsgY29sdW1uczogNCB9CiAgICAtIHsgdHlwZTogY3VzdG9tOnN1bi1wYXRoLWNhcmQsIHRpdGxlOiBTdW4gdG9kYXksIGdyaWRfb3B0aW9uczogeyBjb2x1bW5zOiA0IH0gfQogICAgLSB0eXBlOiBjdXN0b206bXVsdGktdHJlbmQtY2FyZAogICAgICB0aXRsZTogVVYgaW5kZXgKICAgICAgaWNvbjogbWRpOnN1bi13aXJlbGVzcwogICAgICBjb2xvcjogYW1iZXIKICAgICAgaG91cnNfdG9fc2hvdzogMTIKICAgICAgeV9heGlzOiB0cnVlCiAgICAgIHhfYXhpczogdHJ1ZQogICAgICBlbnRpdGllczoKICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3IudXZfaW5kZXgsIG5hbWU6IFVWIGluZGV4LCBjb2xvcjogYW1iZXIgfQogICAgICBncmlkX29wdGlvbnM6IHsgY29sdW1uczogNCwgcm93czogMSB9Cg==">

```yaml
- column_span: 2
  cards:
    - { type: heading, heading: Weather station, icon: mdi:access-point }
    - type: custom:wind-card
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
    - type: custom:rain-card
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
    - type: custom:entity-card
      entity: sensor.outdoor_temperature
      name: Temperature
      decimals: 1
      rules:
        - { below: 0, color: indigo, label: Frost, tint_card: true }
        - { below: 16, color: blue, label: Cool }
        - { below: 26, color: green, label: Pleasant }
        - { above: 26, color: orange, label: Hot, tint_card: true }
      grid_options: { columns: 4 }
    - type: custom:entity-card
      entity: sensor.outdoor_humidity
      name: Humidity
      rules:
        - { below: 40, color: amber, label: Dry }
        - { below: 70, color: green, label: Comfortable }
        - { above: 70, color: blue, label: Humid }
      grid_options: { columns: 4 }
    - { type: custom:entity-card, entity: sensor.pressure, name: Pressure, decimals: 0, grid_options: { columns: 4 } }
    - type: custom:multi-trend-card
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
    - type: custom:weather-card
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
    - type: custom:entity-group-card
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
    - { type: custom:sun-path-card, title: Sun today, grid_options: { columns: 4 } }
    - type: custom:multi-trend-card
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
