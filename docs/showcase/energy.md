---
outline: false
sidebar: false
aside: false
pageClass: wide
---

# Energy dashboard

Follow every watt and every kilowatt-hour. The [power flow](/cards/power-flow-card) shows where power goes right now; the [energy flow](/cards/energy-flow-card) splits a day, week, month or year the way Home Assistant's Energy dashboard does, with a picker to step through them. Every card runs against a simulated home, so tap, drag and hold them.

<DashboardGrid b64="LSBjb2x1bW5fc3BhbjogNAogIGNhcmRzOgogICAgLSB0eXBlOiBjdXN0b206aGVhZGluZy1jYXJkLXBybwogICAgICBzdHlsZTogaGVybwogICAgICB0aXRsZTogRW5lcmd5CiAgICAgIHN1YnRpdGxlOiAie3sgc3RhdGVzKCdzZW5zb3IuZW5lcmd5X3RvZGF5JykgfX0ga1doIHRvZGF5IMK3IHt7IHN0YXRlcygnc2Vuc29yLmVsZWN0cmljaXR5X3ByaWNlJykgfX0g4oKsL2tXaCBub3ciCiAgICAgIGJhZGdlX3N0eWxlOiBwbGFpbgogICAgICBiYWRnZV9zaXplOiBsCiAgICAgIGJhZGdlczoKICAgICAgICAtIHsgdmFsdWU6ICJ7eyBub3coKS5zdHJmdGltZSgnJUg6JU0nKSB9fSIsIGljb246IGZhbHNlLCB0YXBfYWN0aW9uOiB7IGFjdGlvbjogbm9uZSB9IH0KICAgIC0gdHlwZTogY3VzdG9tOmxheW91dC1jYXJkLXBybwogICAgICBjb2x1bW5zOiAyCiAgICAgIGJyZWFrcG9pbnRzOgogICAgICAgIDI6IHsgY29sdW1uczogNCB9CiAgICAgIGNhcmRzOgogICAgICAgIC0gdHlwZTogY3VzdG9tOnBvd2VyLWZsb3ctY2FyZC1wcm8KICAgICAgICAgIHRpdGxlOiBOb3cKICAgICAgICAgIGljb246IG1kaTpmbGFzaAogICAgICAgICAgaG9tZTogc2Vuc29yLnBvd2VyX2NvbnN1bXB0aW9uCiAgICAgICAgICB2aWV3X2xheW91dDogeyBzcGFuOiBbMiwgNl0gfQogICAgICAgICAgc291cmNlczoKICAgICAgICAgICAgLSB7IHR5cGU6IHNvbGFyLCBlbnRpdHk6IHNlbnNvci5zb2xhcl9wb3dlciB9CiAgICAgICAgICAgIC0geyB0eXBlOiBiYXR0ZXJ5LCBwb3dlcjogc2Vuc29yLmJhdHRlcnlfcG93ZXIsIHNvYzogc2Vuc29yLmJhdHRlcnlfc29jIH0KICAgICAgICAgICAgLSB7IHR5cGU6IGdyaWQsIHBvd2VyOiBzZW5zb3IuZ3JpZF9wb3dlciwgcHJpY2U6IHNlbnNvci5lbGVjdHJpY2l0eV9wcmljZSB9CiAgICAgICAgICBjb25zdW1lcnM6CiAgICAgICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5oZWF0X3B1bXBfcG93ZXIsIG5hbWU6IEhlYXQgcHVtcCwgaWNvbjogbWRpOmhlYXQtcHVtcCB9CiAgICAgICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci53YXNoZXJfcG93ZXIsIG5hbWU6IFdhc2hlciwgaWNvbjogbWRpOndhc2hpbmctbWFjaGluZSB9CiAgICAgICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5vZmZpY2VfcG93ZXIsIG5hbWU6IE9mZmljZSwgaWNvbjogbWRpOm1vbml0b3IgfQogICAgICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3IuZXZfY2hhcmdlcl9wb3dlciwgbmFtZTogRVYgY2hhcmdlciwgaWNvbjogbWRpOmV2LXN0YXRpb24gfQogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBiZWxvdzogNTAwLCBjb2xvcjogZ3JlZW4sIGxhYmVsOiBRdWlldCB9CiAgICAgICAgICAgIC0geyBiZWxvdzogMzAwMCwgY29sb3I6IGFtYmVyLCBsYWJlbDogQnVzeSB9CiAgICAgICAgICAgIC0geyBhYm92ZTogMzAwMCwgY29sb3I6IHJlZCwgbGFiZWw6IFBlYWsgfQogICAgICAgIC0gdHlwZTogY3VzdG9tOmVuZXJneS1mbG93LWNhcmQtcHJvCiAgICAgICAgICB0aXRsZTogVG9kYXkKICAgICAgICAgIGljb246IG1kaTpjYWxlbmRhci10b2RheQogICAgICAgICAgdmlld19sYXlvdXQ6IHsgc3BhbjogWzIsIDZdIH0KICAgICAgICAgIGhvbWU6IHNlbnNvci5ob21lX2VuZXJneQogICAgICAgICAgc291cmNlczoKICAgICAgICAgICAgLSB7IHR5cGU6IHNvbGFyLCBlbnRpdHk6IHNlbnNvci5zb2xhcl9lbmVyZ3kgfQogICAgICAgICAgICAtIHsgdHlwZTogYmF0dGVyeSwgY2hhcmdlOiBzZW5zb3IuYmF0dGVyeV9jaGFyZ2VfZW5lcmd5LCBkaXNjaGFyZ2U6IHNlbnNvci5iYXR0ZXJ5X2Rpc2NoYXJnZV9lbmVyZ3ksIHNvYzogc2Vuc29yLmJhdHRlcnlfc29jIH0KICAgICAgICAgICAgLSB7IHR5cGU6IGdyaWQsIGltcG9ydDogc2Vuc29yLmdyaWRfaW1wb3J0X2VuZXJneSwgZXhwb3J0OiBzZW5zb3IuZ3JpZF9leHBvcnRfZW5lcmd5IH0KICAgICAgICAgIGNvbnN1bWVyczoKICAgICAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLmhlYXRfcHVtcF9lbmVyZ3ksIG5hbWU6IEhlYXQgcHVtcCwgaWNvbjogbWRpOmhlYXQtcHVtcCB9CiAgICAgICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci53YXNoZXJfZW5lcmd5LCBuYW1lOiBXYXNoZXIsIGljb246IG1kaTp3YXNoaW5nLW1hY2hpbmUgfQogICAgICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3Iub2ZmaWNlX2VuZXJneSwgbmFtZTogT2ZmaWNlLCBpY29uOiBtZGk6bW9uaXRvciB9CiAgICAgICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5ldl9jaGFyZ2VyX2VuZXJneSwgbmFtZTogRVYgY2hhcmdlciwgaWNvbjogbWRpOmV2LXN0YXRpb24gfQogICAgICAgIC0gdHlwZTogY3VzdG9tOnBvc3Rlci1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBzZW5zb3Iuc29sYXJfcG93ZXIKICAgICAgICAgIG5hbWU6IFNvbGFyCiAgICAgICAgICBraW5kOiBzb2xhcgogICAgICAgIC0gdHlwZTogY3VzdG9tOnBvc3Rlci1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBzZW5zb3IuZ3JpZF9wb3dlcgogICAgICAgICAgbmFtZTogR3JpZAogICAgICAgICAga2luZDogZ3JpZAogICAgICAgIC0gdHlwZTogY3VzdG9tOnBvc3Rlci1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBzZW5zb3IuYmF0dGVyeV9zb2MKICAgICAgICAgIG5hbWU6IEJhdHRlcnkKICAgICAgICAgIGlucHV0czogeyBwb3dlcjogc2Vuc29yLmJhdHRlcnlfcG93ZXIgfQogICAgICAgIC0gdHlwZTogY3VzdG9tOnBvc3Rlci1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBzZW5zb3IuaGVhdF9wdW1wX3Bvd2VyCiAgICAgICAgICBuYW1lOiBIZWF0IHB1bXAKICAgICAgICAgIGtpbmQ6IGhlYXRfcHVtcAogICAgICAgICAgcnVubmluZ19hYm92ZTogNTAK">

```yaml
- column_span: 4
  cards:
    - type: custom:heading-card-pro
      style: hero
      title: Energy
      subtitle: "{{ states('sensor.energy_today') }} kWh today · {{ states('sensor.electricity_price') }} €/kWh now"
      badge_style: plain
      badge_size: l
      badges:
        - { value: "{{ now().strftime('%H:%M') }}", icon: false, tap_action: { action: none } }
    - type: custom:layout-card-pro
      columns: 2
      breakpoints:
        2: { columns: 4 }
      cards:
        - type: custom:power-flow-card-pro
          title: Now
          icon: mdi:flash
          home: sensor.power_consumption
          view_layout: { span: [2, 6] }
          sources:
            - { type: solar, entity: sensor.solar_power }
            - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
            - { type: grid, power: sensor.grid_power, price: sensor.electricity_price }
          consumers:
            - { entity: sensor.heat_pump_power, name: Heat pump, icon: mdi:heat-pump }
            - { entity: sensor.washer_power, name: Washer, icon: mdi:washing-machine }
            - { entity: sensor.office_power, name: Office, icon: mdi:monitor }
            - { entity: sensor.ev_charger_power, name: EV charger, icon: mdi:ev-station }
          rules:
            - { below: 500, color: green, label: Quiet }
            - { below: 3000, color: amber, label: Busy }
            - { above: 3000, color: red, label: Peak }
        - type: custom:energy-flow-card-pro
          title: Today
          icon: mdi:calendar-today
          view_layout: { span: [2, 6] }
          home: sensor.home_energy
          sources:
            - { type: solar, entity: sensor.solar_energy }
            - { type: battery, charge: sensor.battery_charge_energy, discharge: sensor.battery_discharge_energy, soc: sensor.battery_soc }
            - { type: grid, import: sensor.grid_import_energy, export: sensor.grid_export_energy }
          consumers:
            - { entity: sensor.heat_pump_energy, name: Heat pump, icon: mdi:heat-pump }
            - { entity: sensor.washer_energy, name: Washer, icon: mdi:washing-machine }
            - { entity: sensor.office_energy, name: Office, icon: mdi:monitor }
            - { entity: sensor.ev_charger_energy, name: EV charger, icon: mdi:ev-station }
        - type: custom:poster-card-pro
          entity: sensor.solar_power
          name: Solar
          kind: solar
        - type: custom:poster-card-pro
          entity: sensor.grid_power
          name: Grid
          kind: grid
        - type: custom:poster-card-pro
          entity: sensor.battery_soc
          name: Battery
          inputs: { power: sensor.battery_power }
        - type: custom:poster-card-pro
          entity: sensor.heat_pump_power
          name: Heat pump
          kind: heat_pump
          running_above: 50
```

</DashboardGrid>
