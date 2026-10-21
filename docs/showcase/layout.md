---
outline: false
sidebar: false
aside: false
pageClass: wide
---

# Layout dashboard

A dashboard built with the [layout card](/cards/layout-card). Look at the two light sections: they hold the same card, once in a section of `column_span: 2` and once in one of `column_span: 1`. The wide one shows four columns, the narrow one two, as the card's `breakpoints` say: `columns: 2`, and `2: { columns: 4 }` once the section spans two view columns. Make the window narrower: the dashboard gets fewer view columns, the wide section spans one, and its lights fall back to two columns as well.

The rooms are seamless room cards in masonry, two columns wide in the wide section and one on a phone; the outside section is one seamless card of a forecast and two readings; the energy section spans three view columns and puts the power flow next to its tiles, four columns of them in two view columns and six in three.

<DashboardGrid b64="LSBjb2x1bW5fc3BhbjogMgogIGNhcmRzOgogICAgLSB7IHR5cGU6IGhlYWRpbmcsIGhlYWRpbmc6IExpZ2h0cywgaWNvbjogbWRpOmxpZ2h0YnVsYi1ncm91cCB9CiAgICAtIHR5cGU6IGN1c3RvbTpsYXlvdXQtY2FyZC1wcm8KICAgICAgY29sdW1uczogMgogICAgICBicmVha3BvaW50czoKICAgICAgICAyOiB7IGNvbHVtbnM6IDQgfQogICAgICBjYXJkczoKICAgICAgICAtIHsgdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybywgZW50aXR5OiBsaWdodC5saXZpbmdfcm9vbSwgY29udHJvbDogYXV0bywgdmlld19sYXlvdXQ6IHsgc3BhbjogMiB9IH0KICAgICAgICAtIHsgdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybywgZW50aXR5OiBsaWdodC5raXRjaGVuLCBjb250cm9sOiBhdXRvLCB2aWV3X2xheW91dDogeyBzcGFuOiAyIH0gfQogICAgICAgIC0geyB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvLCBlbnRpdHk6IGxpZ2h0LmRpbmluZ190YWJsZSB9CiAgICAgICAgLSB7IHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8sIGVudGl0eTogbGlnaHQub2ZmaWNlIH0KICAgICAgICAtIHsgdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybywgZW50aXR5OiBsaWdodC5kZXNrX2xhbXAgfQogICAgICAgIC0geyB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvLCBlbnRpdHk6IGxpZ2h0LmJlZHJvb20gfQogICAgICAgIC0geyB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvLCBlbnRpdHk6IGxpZ2h0LmhhbGx3YXkgfQogICAgICAgIC0geyB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvLCBlbnRpdHk6IGxpZ2h0LmdhcmRlbiB9Ci0gY29sdW1uX3NwYW46IDEKICBjYXJkczoKICAgIC0geyB0eXBlOiBoZWFkaW5nLCBoZWFkaW5nOiBUaGUgc2FtZSBjYXJkLCBpY29uOiBtZGk6Y2VsbHBob25lIH0KICAgIC0gdHlwZTogY3VzdG9tOmxheW91dC1jYXJkLXBybwogICAgICBjb2x1bW5zOiAyCiAgICAgIGJyZWFrcG9pbnRzOgogICAgICAgIDI6IHsgY29sdW1uczogNCB9CiAgICAgIGNhcmRzOgogICAgICAgIC0geyB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvLCBlbnRpdHk6IGxpZ2h0LmxpdmluZ19yb29tLCBjb250cm9sOiBhdXRvLCB2aWV3X2xheW91dDogeyBzcGFuOiAyIH0gfQogICAgICAgIC0geyB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvLCBlbnRpdHk6IGxpZ2h0LmtpdGNoZW4sIGNvbnRyb2w6IGF1dG8sIHZpZXdfbGF5b3V0OiB7IHNwYW46IDIgfSB9CiAgICAgICAgLSB7IHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8sIGVudGl0eTogbGlnaHQuZGluaW5nX3RhYmxlIH0KICAgICAgICAtIHsgdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybywgZW50aXR5OiBsaWdodC5vZmZpY2UgfQogICAgICAgIC0geyB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvLCBlbnRpdHk6IGxpZ2h0LmRlc2tfbGFtcCB9CiAgICAgICAgLSB7IHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8sIGVudGl0eTogbGlnaHQuYmVkcm9vbSB9CiAgICAgICAgLSB7IHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8sIGVudGl0eTogbGlnaHQuaGFsbHdheSB9CiAgICAgICAgLSB7IHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8sIGVudGl0eTogbGlnaHQuZ2FyZGVuIH0KLSBjb2x1bW5fc3BhbjogMgogIGNhcmRzOgogICAgLSB7IHR5cGU6IGhlYWRpbmcsIGhlYWRpbmc6IFJvb21zLCBpY29uOiBtZGk6aG9tZS1vdXRsaW5lIH0KICAgIC0gdHlwZTogY3VzdG9tOmxheW91dC1jYXJkLXBybwogICAgICBsYXlvdXQ6IG1hc29ucnkKICAgICAgY29sdW1uczogMQogICAgICBicmVha3BvaW50czoKICAgICAgICAyOiB7IGNvbHVtbnM6IDIgfQogICAgICBjYXJkczoKICAgICAgICAtIHR5cGU6IGN1c3RvbTpsYXlvdXQtY2FyZC1wcm8KICAgICAgICAgIGNhcmRfc3R5bGU6IHNlYW1sZXNzCiAgICAgICAgICBjYXJkczoKICAgICAgICAgICAgLSB7IHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8sIGVudGl0eTogc2Vuc29yLmxpdmluZ19yb29tX3RlbXBlcmF0dXJlLCBuYW1lOiBMaXZpbmcgcm9vbSB9CiAgICAgICAgICAgIC0geyB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvLCBlbnRpdHk6IGxpZ2h0LmxpdmluZ19yb29tLCBjb250cm9sOiBhdXRvIH0KICAgICAgICAgICAgLSB7IHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8sIGVudGl0eTogY292ZXIubGl2aW5nX3Jvb21fYmxpbmRzLCBjb250cm9sOiBhdXRvIH0KICAgICAgICAgICAgLSB7IHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8sIGVudGl0eTogbWVkaWFfcGxheWVyLmxpdmluZ19yb29tX3R2IH0KICAgICAgICAtIHR5cGU6IGN1c3RvbTpsYXlvdXQtY2FyZC1wcm8KICAgICAgICAgIGNhcmRfc3R5bGU6IHNlYW1sZXNzCiAgICAgICAgICBjYXJkczoKICAgICAgICAgICAgLSB7IHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8sIGVudGl0eTogc2Vuc29yLm9mZmljZV90ZW1wZXJhdHVyZSwgbmFtZTogT2ZmaWNlIH0KICAgICAgICAgICAgLSB7IHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8sIGVudGl0eTogbGlnaHQub2ZmaWNlIH0KICAgICAgICAgICAgLSB7IHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8sIGVudGl0eTogbGlnaHQuZGVza19sYW1wIH0KICAgICAgICAgICAgLSB7IHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8sIGVudGl0eTogY292ZXIub2ZmaWNlX2JsaW5kcyB9CiAgICAgICAgLSB0eXBlOiBjdXN0b206bGF5b3V0LWNhcmQtcHJvCiAgICAgICAgICBjYXJkX3N0eWxlOiBzZWFtbGVzcwogICAgICAgICAgY2FyZHM6CiAgICAgICAgICAgIC0geyB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvLCBlbnRpdHk6IHNlbnNvci5raXRjaGVuX3RlbXBlcmF0dXJlLCBuYW1lOiBLaXRjaGVuIH0KICAgICAgICAgICAgLSB7IHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8sIGVudGl0eTogbGlnaHQua2l0Y2hlbiB9CiAgICAgICAgICAgIC0geyB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvLCBlbnRpdHk6IHN3aXRjaC5jb2ZmZWVfbWFjaGluZSB9CiAgICAgICAgLSB0eXBlOiBjdXN0b206bGF5b3V0LWNhcmQtcHJvCiAgICAgICAgICBjYXJkX3N0eWxlOiBzZWFtbGVzcwogICAgICAgICAgY2FyZHM6CiAgICAgICAgICAgIC0geyB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvLCBlbnRpdHk6IHNlbnNvci5iZWRyb29tX3RlbXBlcmF0dXJlLCBuYW1lOiBCZWRyb29tIH0KICAgICAgICAgICAgLSB7IHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8sIGVudGl0eTogbGlnaHQuYmVkcm9vbSB9CiAgICAgICAgICAgIC0geyB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvLCBlbnRpdHk6IGNvdmVyLmJlZHJvb21fYmxpbmRzIH0KLSBjb2x1bW5fc3BhbjogMQogIGNhcmRzOgogICAgLSB7IHR5cGU6IGhlYWRpbmcsIGhlYWRpbmc6IE91dHNpZGUsIGljb246IG1kaTp3ZWF0aGVyLXBhcnRseS1jbG91ZHkgfQogICAgLSB0eXBlOiBjdXN0b206bGF5b3V0LWNhcmQtcHJvCiAgICAgIGNhcmRfc3R5bGU6IHNlYW1sZXNzCiAgICAgIGNhcmRzOgogICAgICAgIC0gdHlwZTogY3VzdG9tOndlYXRoZXItY2FyZC1wcm8KICAgICAgICAgIGVudGl0eTogd2VhdGhlci5ob21lCiAgICAgICAgICBzZWN0aW9uczoKICAgICAgICAgICAgLSB0eXBlOiBoZXJvCiAgICAgICAgICAgIC0gdHlwZTogZm9yZWNhc3QKICAgICAgICAgICAgICBtb2RlOiBkYWlseQogICAgICAgICAgICAgIGRheXM6IDUKICAgICAgICAtIHR5cGU6IGN1c3RvbTpsYXlvdXQtY2FyZC1wcm8KICAgICAgICAgIGNvbHVtbnM6IDIKICAgICAgICAgIGNhcmRfc3R5bGU6IHNlYW1sZXNzCiAgICAgICAgICBjYXJkczoKICAgICAgICAgICAgLSB7IHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8sIGVudGl0eTogc2Vuc29yLm91dGRvb3JfaHVtaWRpdHkgfQogICAgICAgICAgICAtIHsgdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybywgZW50aXR5OiBzZW5zb3Iud2luZF9zcGVlZCB9Ci0gY29sdW1uX3NwYW46IDMKICBjYXJkczoKICAgIC0geyB0eXBlOiBoZWFkaW5nLCBoZWFkaW5nOiBFbmVyZ3ksIGljb246IG1kaTpsaWdodG5pbmctYm9sdCB9CiAgICAtIHR5cGU6IGN1c3RvbTpsYXlvdXQtY2FyZC1wcm8KICAgICAgY29sdW1uczogMgogICAgICBicmVha3BvaW50czoKICAgICAgICAyOiB7IGNvbHVtbnM6IDQgfQogICAgICAgIDM6IHsgY29sdW1uczogNiB9CiAgICAgIGNhcmRzOgogICAgICAgIC0gdHlwZTogY3VzdG9tOnBvd2VyLWZsb3ctY2FyZC1wcm8KICAgICAgICAgIGhvbWU6IHNlbnNvci5wb3dlcl9jb25zdW1wdGlvbgogICAgICAgICAgc291cmNlczoKICAgICAgICAgICAgLSB7IHR5cGU6IHNvbGFyLCBlbnRpdHk6IHNlbnNvci5zb2xhcl9wb3dlciB9CiAgICAgICAgICAgIC0geyB0eXBlOiBiYXR0ZXJ5LCBwb3dlcjogc2Vuc29yLmJhdHRlcnlfcG93ZXIsIHNvYzogc2Vuc29yLmJhdHRlcnlfc29jIH0KICAgICAgICAgICAgLSB7IHR5cGU6IGdyaWQsIHBvd2VyOiBzZW5zb3IuZ3JpZF9wb3dlciwgcHJpY2U6IHNlbnNvci5lbGVjdHJpY2l0eV9wcmljZSB9CiAgICAgICAgICBjb25zdW1lcnM6CiAgICAgICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5oZWF0X3B1bXBfcG93ZXIsIG5hbWU6IEhlYXQgcHVtcCwgaWNvbjogbWRpOmhlYXQtcHVtcCB9CiAgICAgICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci53YXNoZXJfcG93ZXIsIG5hbWU6IFdhc2hlciwgaWNvbjogbWRpOndhc2hpbmctbWFjaGluZSB9CiAgICAgICAgICB2aWV3X2xheW91dDogeyBzcGFuOiB7IDE6IGZ1bGwsIDI6IFsyLCA0XSwgMzogWzMsIDRdIH0gfQogICAgICAgIC0geyB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvLCBlbnRpdHk6IHNlbnNvci5iYXR0ZXJ5X3NvYywgdmlzdWFsOiByaW5nIH0KICAgICAgICAtIHsgdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkLXBybywgZW50aXR5OiBzZW5zb3Iuc29sYXJfcG93ZXIsIHZpc3VhbDogc3BhcmtsaW5lLCB2aWV3X2xheW91dDogeyBzcGFuOiB7IDM6IFsxLCAyXSB9IH0gfQogICAgICAgIC0geyB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvLCBlbnRpdHk6IHNlbnNvci5lbGVjdHJpY2l0eV9wcmljZSB9CiAgICAgICAgLSB7IHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8sIGVudGl0eTogc2Vuc29yLmhlYXRfcHVtcF9wb3dlciB9CiAgICAgICAgLSB7IHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZC1wcm8sIGVudGl0eTogc2Vuc29yLmV2X2NoYXJnZXJfcG93ZXIgfQogICAgICAgIC0geyB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQtcHJvLCBlbnRpdHk6IHNlbnNvci53YXNoZXJfcG93ZXIgfQo=">

```yaml
- column_span: 2
  cards:
    - { type: heading, heading: Lights, icon: mdi:lightbulb-group }
    - type: custom:layout-card-pro
      columns: 2
      breakpoints:
        2: { columns: 4 }
      cards:
        - { type: custom:entity-card-pro, entity: light.living_room, control: auto, view_layout: { span: 2 } }
        - { type: custom:entity-card-pro, entity: light.kitchen, control: auto, view_layout: { span: 2 } }
        - { type: custom:entity-card-pro, entity: light.dining_table }
        - { type: custom:entity-card-pro, entity: light.office }
        - { type: custom:entity-card-pro, entity: light.desk_lamp }
        - { type: custom:entity-card-pro, entity: light.bedroom }
        - { type: custom:entity-card-pro, entity: light.hallway }
        - { type: custom:entity-card-pro, entity: light.garden }
- column_span: 1
  cards:
    - { type: heading, heading: The same card, icon: mdi:cellphone }
    - type: custom:layout-card-pro
      columns: 2
      breakpoints:
        2: { columns: 4 }
      cards:
        - { type: custom:entity-card-pro, entity: light.living_room, control: auto, view_layout: { span: 2 } }
        - { type: custom:entity-card-pro, entity: light.kitchen, control: auto, view_layout: { span: 2 } }
        - { type: custom:entity-card-pro, entity: light.dining_table }
        - { type: custom:entity-card-pro, entity: light.office }
        - { type: custom:entity-card-pro, entity: light.desk_lamp }
        - { type: custom:entity-card-pro, entity: light.bedroom }
        - { type: custom:entity-card-pro, entity: light.hallway }
        - { type: custom:entity-card-pro, entity: light.garden }
- column_span: 2
  cards:
    - { type: heading, heading: Rooms, icon: mdi:home-outline }
    - type: custom:layout-card-pro
      layout: masonry
      columns: 1
      breakpoints:
        2: { columns: 2 }
      cards:
        - type: custom:layout-card-pro
          card_style: seamless
          cards:
            - { type: custom:entity-card-pro, entity: sensor.living_room_temperature, name: Living room }
            - { type: custom:entity-card-pro, entity: light.living_room, control: auto }
            - { type: custom:entity-card-pro, entity: cover.living_room_blinds, control: auto }
            - { type: custom:entity-card-pro, entity: media_player.living_room_tv }
        - type: custom:layout-card-pro
          card_style: seamless
          cards:
            - { type: custom:entity-card-pro, entity: sensor.office_temperature, name: Office }
            - { type: custom:entity-card-pro, entity: light.office }
            - { type: custom:entity-card-pro, entity: light.desk_lamp }
            - { type: custom:entity-card-pro, entity: cover.office_blinds }
        - type: custom:layout-card-pro
          card_style: seamless
          cards:
            - { type: custom:entity-card-pro, entity: sensor.kitchen_temperature, name: Kitchen }
            - { type: custom:entity-card-pro, entity: light.kitchen }
            - { type: custom:entity-card-pro, entity: switch.coffee_machine }
        - type: custom:layout-card-pro
          card_style: seamless
          cards:
            - { type: custom:entity-card-pro, entity: sensor.bedroom_temperature, name: Bedroom }
            - { type: custom:entity-card-pro, entity: light.bedroom }
            - { type: custom:entity-card-pro, entity: cover.bedroom_blinds }
- column_span: 1
  cards:
    - { type: heading, heading: Outside, icon: mdi:weather-partly-cloudy }
    - type: custom:layout-card-pro
      card_style: seamless
      cards:
        - type: custom:weather-card-pro
          entity: weather.home
          sections:
            - type: hero
            - type: forecast
              mode: daily
              days: 5
        - type: custom:layout-card-pro
          columns: 2
          card_style: seamless
          cards:
            - { type: custom:entity-card-pro, entity: sensor.outdoor_humidity }
            - { type: custom:entity-card-pro, entity: sensor.wind_speed }
- column_span: 3
  cards:
    - { type: heading, heading: Energy, icon: mdi:lightning-bolt }
    - type: custom:layout-card-pro
      columns: 2
      breakpoints:
        2: { columns: 4 }
        3: { columns: 6 }
      cards:
        - type: custom:power-flow-card-pro
          home: sensor.power_consumption
          sources:
            - { type: solar, entity: sensor.solar_power }
            - { type: battery, power: sensor.battery_power, soc: sensor.battery_soc }
            - { type: grid, power: sensor.grid_power, price: sensor.electricity_price }
          consumers:
            - { entity: sensor.heat_pump_power, name: Heat pump, icon: mdi:heat-pump }
            - { entity: sensor.washer_power, name: Washer, icon: mdi:washing-machine }
          view_layout: { span: { 1: full, 2: [2, 4], 3: [3, 4] } }
        - { type: custom:entity-card-pro, entity: sensor.battery_soc, visual: ring }
        - { type: custom:entity-card-pro, entity: sensor.solar_power, visual: sparkline, view_layout: { span: { 3: [1, 2] } } }
        - { type: custom:entity-card-pro, entity: sensor.electricity_price }
        - { type: custom:entity-card-pro, entity: sensor.heat_pump_power }
        - { type: custom:entity-card-pro, entity: sensor.ev_charger_power }
        - { type: custom:entity-card-pro, entity: sensor.washer_power }
```

</DashboardGrid>
