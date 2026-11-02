---
outline: false
sidebar: false
aside: false
pageClass: wide
---

# Energy dashboard

Follow every watt and every kilowatt-hour. The [power flow](/cards/power-flow-card) shows where power goes right now; the [energy flow](/cards/energy-flow-card) splits a day, week, month or year the way Home Assistant's Energy dashboard does, with a picker to step through them. Every card runs against a simulated home, so tap, drag and hold them.

<DashboardGrid b64="LSBjb2x1bW5fc3BhbjogNAogIGNhcmRzOgogICAgLSB0eXBlOiBjdXN0b206aGVhZGluZy1jYXJkLXBybwogICAgICBzdHlsZTogaGVybwogICAgICB0aXRsZTogRW5lcmd5CiAgICAgIHN1YnRpdGxlOiAie3sgc3RhdGVzKCdzZW5zb3IuZW5lcmd5X3RvZGF5JykgfX0ga1doIHRvZGF5IMK3IHt7IHN0YXRlcygnc2Vuc29yLmVsZWN0cmljaXR5X3ByaWNlJykgfX0g4oKsL2tXaCBub3ciCiAgICAgIGJhZGdlX3N0eWxlOiBwbGFpbgogICAgICBiYWRnZV9zaXplOiBsCiAgICAgIGJhZGdlczoKICAgICAgICAtIHsgdmFsdWU6ICJ7eyBub3coKS5zdHJmdGltZSgnJUg6JU0nKSB9fSIsIHNob3dfaWNvbjogZmFsc2UsIHRhcF9hY3Rpb246IHsgYWN0aW9uOiBub25lIH0gfQogICAgLSB0eXBlOiBjdXN0b206bGF5b3V0LWNhcmQtcHJvCiAgICAgIGNvbHVtbnM6IDIKICAgICAgYnJlYWtwb2ludHM6CiAgICAgICAgMjogeyBjb2x1bW5zOiA0IH0KICAgICAgY2FyZHM6CiAgICAgICAgLSB0eXBlOiBjdXN0b206cG93ZXItZmxvdy1jYXJkLXBybwogICAgICAgICAgdGl0bGU6IE5vdwogICAgICAgICAgaWNvbjogbWRpOmZsYXNoCiAgICAgICAgICBob21lOiBzZW5zb3IucG93ZXJfY29uc3VtcHRpb24KICAgICAgICAgIHZpZXdfbGF5b3V0OiB7IHNwYW46IFsyLCA2XSB9CiAgICAgICAgICBzb3VyY2VzOgogICAgICAgICAgICAtIHsgdHlwZTogc29sYXIsIGVudGl0eTogc2Vuc29yLnNvbGFyX3Bvd2VyIH0KICAgICAgICAgICAgLSB7IHR5cGU6IGJhdHRlcnksIHBvd2VyOiBzZW5zb3IuYmF0dGVyeV9wb3dlciwgc29jOiBzZW5zb3IuYmF0dGVyeV9zb2MgfQogICAgICAgICAgICAtIHsgdHlwZTogZ3JpZCwgcG93ZXI6IHNlbnNvci5ncmlkX3Bvd2VyLCBwcmljZTogc2Vuc29yLmVsZWN0cmljaXR5X3ByaWNlIH0KICAgICAgICAgIGNvbnN1bWVyczoKICAgICAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLmhlYXRfcHVtcF9wb3dlciwgbmFtZTogSGVhdCBwdW1wLCBpY29uOiBtZGk6aGVhdC1wdW1wIH0KICAgICAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLndhc2hlcl9wb3dlciwgbmFtZTogV2FzaGVyLCBpY29uOiBtZGk6d2FzaGluZy1tYWNoaW5lIH0KICAgICAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLm9mZmljZV9wb3dlciwgbmFtZTogT2ZmaWNlLCBpY29uOiBtZGk6bW9uaXRvciB9CiAgICAgICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5ldl9jaGFyZ2VyX3Bvd2VyLCBuYW1lOiBFViBjaGFyZ2VyLCBpY29uOiBtZGk6ZXYtc3RhdGlvbiB9CiAgICAgICAgICBydWxlczoKICAgICAgICAgICAgLSB7IGJlbG93OiA1MDAsIGNvbG9yOiBncmVlbiwgbGFiZWw6IFF1aWV0IH0KICAgICAgICAgICAgLSB7IGJlbG93OiAzMDAwLCBjb2xvcjogYW1iZXIsIGxhYmVsOiBCdXN5IH0KICAgICAgICAgICAgLSB7IGFib3ZlOiAzMDAwLCBjb2xvcjogcmVkLCBsYWJlbDogUGVhayB9CiAgICAgICAgLSB0eXBlOiBjdXN0b206ZW5lcmd5LWZsb3ctY2FyZC1wcm8KICAgICAgICAgIHRpdGxlOiBUb2RheQogICAgICAgICAgaWNvbjogbWRpOmNhbGVuZGFyLXRvZGF5CiAgICAgICAgICB2aWV3X2xheW91dDogeyBzcGFuOiBbMiwgNl0gfQogICAgICAgICAgaG9tZTogc2Vuc29yLmhvbWVfZW5lcmd5CiAgICAgICAgICBzb3VyY2VzOgogICAgICAgICAgICAtIHsgdHlwZTogc29sYXIsIGVudGl0eTogc2Vuc29yLnNvbGFyX2VuZXJneSB9CiAgICAgICAgICAgIC0geyB0eXBlOiBiYXR0ZXJ5LCBjaGFyZ2U6IHNlbnNvci5iYXR0ZXJ5X2NoYXJnZV9lbmVyZ3ksIGRpc2NoYXJnZTogc2Vuc29yLmJhdHRlcnlfZGlzY2hhcmdlX2VuZXJneSwgc29jOiBzZW5zb3IuYmF0dGVyeV9zb2MgfQogICAgICAgICAgICAtIHsgdHlwZTogZ3JpZCwgaW1wb3J0OiBzZW5zb3IuZ3JpZF9pbXBvcnRfZW5lcmd5LCBleHBvcnQ6IHNlbnNvci5ncmlkX2V4cG9ydF9lbmVyZ3kgfQogICAgICAgICAgY29uc3VtZXJzOgogICAgICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3IuaGVhdF9wdW1wX2VuZXJneSwgbmFtZTogSGVhdCBwdW1wLCBpY29uOiBtZGk6aGVhdC1wdW1wIH0KICAgICAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLndhc2hlcl9lbmVyZ3ksIG5hbWU6IFdhc2hlciwgaWNvbjogbWRpOndhc2hpbmctbWFjaGluZSB9CiAgICAgICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5vZmZpY2VfZW5lcmd5LCBuYW1lOiBPZmZpY2UsIGljb246IG1kaTptb25pdG9yIH0KICAgICAgICAgICAgLSB7IGVudGl0eTogc2Vuc29yLmV2X2NoYXJnZXJfZW5lcmd5LCBuYW1lOiBFViBjaGFyZ2VyLCBpY29uOiBtZGk6ZXYtc3RhdGlvbiB9CiAgICAgICAgLSB0eXBlOiBjdXN0b206cG9zdGVyLWNhcmQtcHJvCiAgICAgICAgICBlbnRpdHk6IHNlbnNvci5zb2xhcl9wb3dlcgogICAgICAgICAgbmFtZTogU29sYXIKICAgICAgICAgIGtpbmQ6IHNvbGFyCiAgICAgICAgLSB0eXBlOiBjdXN0b206cG9zdGVyLWNhcmQtcHJvCiAgICAgICAgICBlbnRpdHk6IHNlbnNvci5ncmlkX3Bvd2VyCiAgICAgICAgICBuYW1lOiBHcmlkCiAgICAgICAgICBraW5kOiBncmlkCiAgICAgICAgLSB0eXBlOiBjdXN0b206cG9zdGVyLWNhcmQtcHJvCiAgICAgICAgICBlbnRpdHk6IHNlbnNvci5iYXR0ZXJ5X3NvYwogICAgICAgICAgbmFtZTogQmF0dGVyeQogICAgICAgICAgcG93ZXI6IHNlbnNvci5iYXR0ZXJ5X3Bvd2VyCiAgICAgICAgLSB0eXBlOiBjdXN0b206cG9zdGVyLWNhcmQtcHJvCiAgICAgICAgICBlbnRpdHk6IHNlbnNvci5oZWF0X3B1bXBfcG93ZXIKICAgICAgICAgIG5hbWU6IEhlYXQgcHVtcAogICAgICAgICAga2luZDogaGVhdF9wdW1wCiAgICAgICAgICBydW5uaW5nX2Fib3ZlOiA1MAo=">

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
        - { value: "{{ now().strftime('%H:%M') }}", show_icon: false, tap_action: { action: none } }
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
          power: sensor.battery_power
        - type: custom:poster-card-pro
          entity: sensor.heat_pump_power
          name: Heat pump
          kind: heat_pump
          running_above: 50
```

</DashboardGrid>
