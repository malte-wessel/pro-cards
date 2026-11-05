---
outline: false
sidebar: false
aside: false
pageClass: wide
---

# Weather dashboard

Read the weather at a glance. The [weather card](/cards/weather-card) forecasts by the hour and the day, the [wind](/cards/poster-types#wind) and the [rain](/cards/poster-types#rain) move as animated fields on posters, the [sun path](/cards/sun-path-card) and the [sun azimuth](/cards/sun-azimuth-card) show where the sun is and which walls it lights, and status strips colour a day of any sensor. Every card runs against a simulated home, so tap, drag and hold them.

<DashboardGrid b64="LSBjb2x1bW5fc3BhbjogNAogIGNhcmRzOgogICAgLSB0eXBlOiBjdXN0b206aGVhZGluZy1jYXJkLXBybwogICAgICBzdHlsZTogaGVybwogICAgICB0aXRsZTogV2VhdGhlcgogICAgICBzdWJ0aXRsZTogInt7IHN0YXRlcygnc2Vuc29yLm91dGRvb3JfdGVtcGVyYXR1cmUnKSB9fSDCsEMgwrcgd2luZCB7eyBzdGF0ZXMoJ3NlbnNvci53aW5kX3NwZWVkJykgfX0ga20vaCDCtyB7eyBzdGF0ZXMoJ3NlbnNvci5yYWluX3RvZGF5JykgfX0gbW0gcmFpbiB0b2RheSIKICAgICAgYmFkZ2Vfc3R5bGU6IHBsYWluCiAgICAgIGJhZGdlX3NpemU6IGwKICAgICAgYmFkZ2VzOgogICAgICAgIC0geyB2YWx1ZTogInt7IG5vdygpLnN0cmZ0aW1lKCclSDolTScpIH19IiwgaWNvbjogZmFsc2UsIHRhcF9hY3Rpb246IHsgYWN0aW9uOiBub25lIH0gfQogICAgLSB0eXBlOiBjdXN0b206bGF5b3V0LWNhcmQtcHJvCiAgICAgIGNvbHVtbnM6IDIKICAgICAgYnJlYWtwb2ludHM6CiAgICAgICAgMjogeyBjb2x1bW5zOiA0IH0KICAgICAgY2FyZHM6CiAgICAgICAgLSB0eXBlOiBjdXN0b206d2VhdGhlci1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiB3ZWF0aGVyLmhvbWUKICAgICAgICAgIG5hbWU6IE91dHNpZGUKICAgICAgICAgIHZpZXdfbGF5b3V0OiB7IHNwYW46IFsyLCA0XSB9CiAgICAgICAgICB0ZW1wZXJhdHVyZV9ydWxlczoKICAgICAgICAgICAgLSB7IGJlbG93OiA1LCBjb2xvcjogYmx1ZSwgbGFiZWw6IENvbGQgfQogICAgICAgICAgICAtIHsgYmVsb3c6IDIwLCBjb2xvcjogdGVhbCwgbGFiZWw6IE1pbGQgfQogICAgICAgICAgICAtIHsgYWJvdmU6IDIwLCBjb2xvcjogb3JhbmdlLCBsYWJlbDogV2FybSB9CiAgICAgICAgICBzZWN0aW9uczoKICAgICAgICAgICAgLSB7IHR5cGU6IGhlcm8gfQogICAgICAgICAgICAtIHsgdHlwZTogZm9yZWNhc3QsIG1vZGU6IGhvdXJseSwgbGF5b3V0OiBob3Jpem9udGFsLCBob3VyczogNiwgdGl0bGU6IE5leHQgNiBob3VycywgZGl2aWRlcjogdHJ1ZSwgc2hvdzogW10sIGljb25fc2l6ZTogMzIgfQogICAgICAgIC0gdHlwZTogY3VzdG9tOnBvc3Rlci1jYXJkLXBybwogICAgICAgICAga2luZDogc3VuCiAgICAgICAgICB2aWV3X2xheW91dDogeyBzcGFuOiBbMSwgNF0gfQogICAgICAgIC0gdHlwZTogY3VzdG9tOnN1bi1hemltdXRoLWNhcmQtcHJvCiAgICAgICAgICBzaG93X3N1bW1hcnk6IGZhbHNlCiAgICAgICAgICBjYW1lcmE6IDI4MAogICAgICAgICAgdmlld19sYXlvdXQ6IHsgc3BhbjogWzEsIDRdIH0KICAgICAgICAtIHR5cGU6IGN1c3RvbTp0aWxlLWdyb3VwLWNhcmQtcHJvCiAgICAgICAgICB0aXRsZTogTGFzdCAyNCBob3VycwogICAgICAgICAgaWNvbjogbWRpOmNoYXJ0LXRpbWVsaW5lCiAgICAgICAgICB2aWV3X2xheW91dDogeyBzcGFuOiBbMiwgNl0gfQogICAgICAgICAgdGlsZXM6CiAgICAgICAgICAgIC0gZW50aXR5OiBzZW5zb3Iub3V0ZG9vcl90ZW1wZXJhdHVyZQogICAgICAgICAgICAgIG5hbWU6IFRlbXBlcmF0dXJlCiAgICAgICAgICAgICAgZGVjaW1hbHM6IDEKICAgICAgICAgICAgICB2aXN1YWw6IHsgdHlwZTogc3RyaXAsIGhvdXJzOiAyNCwgYnVja2V0OiAzMCB9CiAgICAgICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgICAgICAtIHsgYmVsb3c6IDUsIGNvbG9yOiBibHVlLCBpY29uOiBtZGk6dGhlcm1vbWV0ZXItbG93IH0KICAgICAgICAgICAgICAgIC0geyBiZWxvdzogMTgsIGNvbG9yOiBsaWdodC1ibHVlLCBpY29uOiBtZGk6dGhlcm1vbWV0ZXIgfQogICAgICAgICAgICAgICAgLSB7IGJlbG93OiAyNSwgY29sb3I6IGdyZWVuLCBpY29uOiBtZGk6dGhlcm1vbWV0ZXIgfQogICAgICAgICAgICAgICAgLSB7IGFib3ZlOiAyNSwgY29sb3I6IG9yYW5nZSwgaWNvbjogbWRpOnRoZXJtb21ldGVyLWhpZ2ggfQogICAgICAgICAgICAtIGVudGl0eTogc2Vuc29yLndpbmRfc3BlZWQKICAgICAgICAgICAgICBuYW1lOiBXaW5kCiAgICAgICAgICAgICAgZGVjaW1hbHM6IDAKICAgICAgICAgICAgICB2aXN1YWw6IHsgdHlwZTogc3RyaXAsIGhvdXJzOiAyNCwgYnVja2V0OiAzMCB9CiAgICAgICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgICAgICAtIHsgYmVsb3c6IDEwLCBjb2xvcjogYmx1ZS1ncmV5LCBpY29uOiBtZGk6d2VhdGhlci13aW5keSB9CiAgICAgICAgICAgICAgICAtIHsgYmVsb3c6IDI1LCBjb2xvcjogdGVhbCwgaWNvbjogbWRpOndlYXRoZXItd2luZHkgfQogICAgICAgICAgICAgICAgLSB7IGFib3ZlOiAyNSwgY29sb3I6IG9yYW5nZSwgaWNvbjogbWRpOndlYXRoZXItd2luZHktdmFyaWFudCB9CiAgICAgICAgICAgIC0gZW50aXR5OiBzZW5zb3IucmFpbl9yYXRlX3Jvb2YKICAgICAgICAgICAgICBuYW1lOiBSYWluCiAgICAgICAgICAgICAgZGVjaW1hbHM6IDEKICAgICAgICAgICAgICB2aXN1YWw6IHsgdHlwZTogc3RyaXAsIGhvdXJzOiAyNCwgYnVja2V0OiAzMCB9CiAgICAgICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgICAgICAtIHsgYmVsb3c6IDAuMSwgY29sb3I6IGdyZXksIGljb246IG1kaTp3ZWF0aGVyLWNsb3VkeSB9CiAgICAgICAgICAgICAgICAtIHsgYWJvdmU6IDAuMSwgY29sb3I6IGJsdWUsIGljb246IG1kaTp3ZWF0aGVyLXJhaW55IH0KICAgICAgICAtIHR5cGU6IGN1c3RvbTpwb3N0ZXItY2FyZC1wcm8KICAgICAgICAgIGVudGl0eTogc2Vuc29yLnJhaW5fcmF0ZV9yb29mCiAgICAgICAgICBuYW1lOiBSYWluCiAgICAgICAgICB2aXN1YWw6IHsgdHlwZTogZmxvdywgdmFyaWFudDogZHJvcHMgfQogICAgICAgICAgaW5wdXRzOiB7IHdpbmQ6IHNlbnNvci53aW5kX3NwZWVkLCBkaXJlY3Rpb246IHNlbnNvci53aW5kX2RpcmVjdGlvbiB9CiAgICAgICAgLSB0eXBlOiBjdXN0b206cG9zdGVyLWNhcmQtcHJvCiAgICAgICAgICBlbnRpdHk6IHNlbnNvci5wcmVzc3VyZQogICAgICAgICAgbmFtZTogUHJlc3N1cmUKICAgICAgICAgIGRlY2ltYWxzOiAwCiAgICAgICAgICB2aXN1YWw6IHsgdHlwZTogc3BhcmtsaW5lLCBob3VyczogMjQgfQogICAgICAgICAgY29sb3I6IGluZGlnbwogICAgICAgIC0gdHlwZTogY3VzdG9tOnBvc3Rlci1jYXJkLXBybwogICAgICAgICAgZW50aXR5OiBzZW5zb3Iud2luZF9zcGVlZAogICAgICAgICAgbmFtZTogV2luZAogICAgICAgICAgdmlzdWFsOiB7IHR5cGU6IGZsb3csIHZhcmlhbnQ6IGxpbmVzIH0KICAgICAgICAtIHR5cGU6IGN1c3RvbTpsYXlvdXQtY2FyZC1wcm8KICAgICAgICAgIHJvd3M6IFsxZnIsIDFmciwgMWZyXQogICAgICAgICAgdmlld19sYXlvdXQ6IHsgc3BhbjogWzEsIDNdIH0KICAgICAgICAgIGNhcmRzOgogICAgICAgICAgICAtIHR5cGU6IGN1c3RvbTp0aWxlLWNhcmQtcHJvCiAgICAgICAgICAgICAgZW50aXR5OiBzZW5zb3IudXZfaW5kZXgKICAgICAgICAgICAgICBuYW1lOiBVViBpbmRleAogICAgICAgICAgICAgIGljb246IHsgbmFtZTogbWRpOnN1bi13aXJlbGVzcywgcmluZzogdHJ1ZSB9CiAgICAgICAgICAgICAgZGVjaW1hbHM6IDEKICAgICAgICAgICAgICB1bml0OiAiIgogICAgICAgICAgICAgIG1pbjogMAogICAgICAgICAgICAgIG1heDogMTEKICAgICAgICAgICAgICBydWxlczoKICAgICAgICAgICAgICAgIC0geyBiZWxvdzogMywgY29sb3I6IGdyZWVuLCBzdGF0dXM6IExvdyB9CiAgICAgICAgICAgICAgICAtIHsgYmVsb3c6IDYsIGNvbG9yOiBhbWJlciwgc3RhdHVzOiBNb2RlcmF0ZSB9CiAgICAgICAgICAgICAgICAtIHsgYmVsb3c6IDgsIGNvbG9yOiBvcmFuZ2UsIHN0YXR1czogSGlnaCB9CiAgICAgICAgICAgICAgICAtIHsgYWJvdmU6IDgsIGNvbG9yOiByZWQsIHN0YXR1czogVmVyeSBoaWdoIH0KICAgICAgICAgICAgLSB0eXBlOiBjdXN0b206dGlsZS1jYXJkLXBybwogICAgICAgICAgICAgIGVudGl0eTogc2Vuc29yLm91dGRvb3JfaHVtaWRpdHkKICAgICAgICAgICAgICBuYW1lOiBIdW1pZGl0eQogICAgICAgICAgICAgIGljb246IG1kaTp3YXRlci1wZXJjZW50CiAgICAgICAgICAgICAgZGVjaW1hbHM6IDAKICAgICAgICAgICAgICBjb2xvcjogYmx1ZQogICAgICAgICAgICAtIHR5cGU6IGN1c3RvbTp0aWxlLWNhcmQtcHJvCiAgICAgICAgICAgICAgZW50aXR5OiBzZW5zb3IuZGV3X3BvaW50CiAgICAgICAgICAgICAgbmFtZTogRGV3IHBvaW50CiAgICAgICAgICAgICAgaWNvbjogbWRpOnRoZXJtb21ldGVyLXdhdGVyCiAgICAgICAgICAgICAgZGVjaW1hbHM6IDEKICAgICAgICAgICAgICBjb2xvcjogdGVhbAo=">

```yaml
- column_span: 4
  cards:
    - type: custom:heading-card-pro
      style: hero
      title: Weather
      subtitle: "{{ states('sensor.outdoor_temperature') }} °C · wind {{ states('sensor.wind_speed') }} km/h · {{ states('sensor.rain_today') }} mm rain today"
      badge_style: plain
      badge_size: l
      badges:
        - { value: "{{ now().strftime('%H:%M') }}", icon: false, tap_action: { action: none } }
    - type: custom:layout-card-pro
      columns: 2
      breakpoints:
        2: { columns: 4 }
      cards:
        - type: custom:weather-card-pro
          entity: weather.home
          name: Outside
          view_layout: { span: [2, 4] }
          temperature_rules:
            - { below: 5, color: blue, label: Cold }
            - { below: 20, color: teal, label: Mild }
            - { above: 20, color: orange, label: Warm }
          sections:
            - { type: hero }
            - { type: forecast, mode: hourly, layout: horizontal, hours: 6, title: Next 6 hours, divider: true, show: [], icon_size: 32 }
        - type: custom:poster-card-pro
          kind: sun
          view_layout: { span: [1, 4] }
        - type: custom:sun-azimuth-card-pro
          show_summary: false
          camera: 280
          view_layout: { span: [1, 4] }
        - type: custom:tile-group-card-pro
          title: Last 24 hours
          icon: mdi:chart-timeline
          view_layout: { span: [2, 6] }
          tiles:
            - entity: sensor.outdoor_temperature
              name: Temperature
              decimals: 1
              visual: { type: strip, hours: 24, bucket: 30 }
              rules:
                - { below: 5, color: blue, icon: mdi:thermometer-low }
                - { below: 18, color: light-blue, icon: mdi:thermometer }
                - { below: 25, color: green, icon: mdi:thermometer }
                - { above: 25, color: orange, icon: mdi:thermometer-high }
            - entity: sensor.wind_speed
              name: Wind
              decimals: 0
              visual: { type: strip, hours: 24, bucket: 30 }
              rules:
                - { below: 10, color: blue-grey, icon: mdi:weather-windy }
                - { below: 25, color: teal, icon: mdi:weather-windy }
                - { above: 25, color: orange, icon: mdi:weather-windy-variant }
            - entity: sensor.rain_rate_roof
              name: Rain
              decimals: 1
              visual: { type: strip, hours: 24, bucket: 30 }
              rules:
                - { below: 0.1, color: grey, icon: mdi:weather-cloudy }
                - { above: 0.1, color: blue, icon: mdi:weather-rainy }
        - type: custom:poster-card-pro
          entity: sensor.rain_rate_roof
          name: Rain
          visual: { type: flow, variant: drops }
          inputs: { wind: sensor.wind_speed, direction: sensor.wind_direction }
        - type: custom:poster-card-pro
          entity: sensor.pressure
          name: Pressure
          decimals: 0
          visual: { type: sparkline, hours: 24 }
          color: indigo
        - type: custom:poster-card-pro
          entity: sensor.wind_speed
          name: Wind
          visual: { type: flow, variant: lines }
        - type: custom:layout-card-pro
          rows: [1fr, 1fr, 1fr]
          view_layout: { span: [1, 3] }
          cards:
            - type: custom:tile-card-pro
              entity: sensor.uv_index
              name: UV index
              icon: { name: mdi:sun-wireless, ring: true }
              decimals: 1
              unit: ""
              min: 0
              max: 11
              rules:
                - { below: 3, color: green, status: Low }
                - { below: 6, color: amber, status: Moderate }
                - { below: 8, color: orange, status: High }
                - { above: 8, color: red, status: Very high }
            - type: custom:tile-card-pro
              entity: sensor.outdoor_humidity
              name: Humidity
              icon: mdi:water-percent
              decimals: 0
              color: blue
            - type: custom:tile-card-pro
              entity: sensor.dew_point
              name: Dew point
              icon: mdi:thermometer-water
              decimals: 1
              color: teal
```

</DashboardGrid>
