---
outline: false
sidebar: false
aside: false
pageClass: wide
---

# Weather dashboard

The homepage weather dashboard, grown: wind and rain heroes, sensor tiles, trends for temperature, wind and pressure, 24 hour strips, the weather card with hourly trend, UV and humidity bars and the daily forecast, the station, and the daylight row with the illuminance trend and its zones.

<DashboardGrid b64="LSBjb2x1bW5fc3BhbjogMgogIGNhcmRzOgogICAgLSB7IHR5cGU6IGhlYWRpbmcsIGhlYWRpbmc6IFdlYXRoZXIgc3RhdGlvbiwgaWNvbjogbWRpOmFjY2Vzcy1wb2ludCB9CiAgICAtIHR5cGU6IGN1c3RvbTp3aW5kLWNhcmQKICAgICAgZW50aXR5OiBzZW5zb3Iud2luZF9zcGVlZAogICAgICBkaXJlY3Rpb246IHNlbnNvci53aW5kX2RpcmVjdGlvbgogICAgICBndXN0OiBzZW5zb3Iud2luZF9ndXN0CiAgICAgIHRpdGxlOiBXaW5kCiAgICAgIGxheW91dDogaGVybwogICAgICBmbG93OiB7IHN0eWxlOiB2ZWN0b3JzIH0KICAgICAgcnVsZXM6CiAgICAgICAgLSB7IGJlbG93OiA1LCBjb2xvcjogYmx1ZS1ncmV5LCBsYWJlbDogQ2FsbSB9CiAgICAgICAgLSB7IGJlbG93OiAyMCwgY29sb3I6IHRlYWwsIGxhYmVsOiBMaWdodCBicmVlemUgfQogICAgICAgIC0geyBiZWxvdzogMzUsIGNvbG9yOiBhbWJlciwgbGFiZWw6IEZyZXNoIH0KICAgICAgICAtIHsgYWJvdmU6IDM1LCBjb2xvcjogcmVkLCBsYWJlbDogU3Rvcm0sIHRpbnRfY2FyZDogdHJ1ZSB9CiAgICAgIGdyaWRfb3B0aW9uczogeyBjb2x1bW5zOiA2IH0KICAgIC0gdHlwZTogY3VzdG9tOnJhaW4tY2FyZAogICAgICBlbnRpdHk6IHNlbnNvci5yYWluX3JhdGVfcm9vZgogICAgICB0b2RheTogc2Vuc29yLnJhaW5fdG9kYXkKICAgICAgd2luZDogc2Vuc29yLndpbmRfc3BlZWQKICAgICAgZGlyZWN0aW9uOiBzZW5zb3Iud2luZF9kaXJlY3Rpb24KICAgICAgdGl0bGU6IFJhaW4KICAgICAgbGF5b3V0OiBoZXJvCiAgICAgIGZsb3c6IHsgc3R5bGU6IGZpbGwgfQogICAgICBydWxlczoKICAgICAgICAtIHsgYmVsb3c6IDAuMSwgY29sb3I6IGJsdWUtZ3JleSwgbGFiZWw6IERyeSB9CiAgICAgICAgLSB7IGJlbG93OiAyLjUsIGNvbG9yOiBsaWdodC1ibHVlLCBsYWJlbDogTGlnaHQgcmFpbiB9CiAgICAgICAgLSB7IGJlbG93OiA3LjYsIGNvbG9yOiBibHVlLCBsYWJlbDogTW9kZXJhdGUgcmFpbiB9CiAgICAgICAgLSB7IGFib3ZlOiA3LjYsIGNvbG9yOiBpbmRpZ28sIGxhYmVsOiBIZWF2eSByYWluLCB0aW50X2NhcmQ6IHRydWUgfQogICAgICBncmlkX29wdGlvbnM6IHsgY29sdW1uczogNiB9CiAgICAtIHR5cGU6IGN1c3RvbTplbnRpdHktY2FyZAogICAgICBlbnRpdHk6IHNlbnNvci5vdXRkb29yX3RlbXBlcmF0dXJlCiAgICAgIG5hbWU6IFRlbXBlcmF0dXJlCiAgICAgIGRlY2ltYWxzOiAxCiAgICAgIHJ1bGVzOgogICAgICAgIC0geyBiZWxvdzogMCwgY29sb3I6IGluZGlnbywgbGFiZWw6IEZyb3N0LCB0aW50X2NhcmQ6IHRydWUgfQogICAgICAgIC0geyBiZWxvdzogMTYsIGNvbG9yOiBibHVlLCBsYWJlbDogQ29vbCB9CiAgICAgICAgLSB7IGJlbG93OiAyNiwgY29sb3I6IGdyZWVuLCBsYWJlbDogUGxlYXNhbnQgfQogICAgICAgIC0geyBhYm92ZTogMjYsIGNvbG9yOiBvcmFuZ2UsIGxhYmVsOiBIb3QsIHRpbnRfY2FyZDogdHJ1ZSB9CiAgICAgIGdyaWRfb3B0aW9uczogeyBjb2x1bW5zOiA0IH0KICAgIC0gdHlwZTogY3VzdG9tOmVudGl0eS1jYXJkCiAgICAgIGVudGl0eTogc2Vuc29yLm91dGRvb3JfaHVtaWRpdHkKICAgICAgbmFtZTogSHVtaWRpdHkKICAgICAgcnVsZXM6CiAgICAgICAgLSB7IGJlbG93OiA0MCwgY29sb3I6IGFtYmVyLCBsYWJlbDogRHJ5IH0KICAgICAgICAtIHsgYmVsb3c6IDcwLCBjb2xvcjogZ3JlZW4sIGxhYmVsOiBDb21mb3J0YWJsZSB9CiAgICAgICAgLSB7IGFib3ZlOiA3MCwgY29sb3I6IGJsdWUsIGxhYmVsOiBIdW1pZCB9CiAgICAgIGdyaWRfb3B0aW9uczogeyBjb2x1bW5zOiA0IH0KICAgIC0geyB0eXBlOiBjdXN0b206ZW50aXR5LWNhcmQsIGVudGl0eTogc2Vuc29yLnByZXNzdXJlLCBuYW1lOiBQcmVzc3VyZSwgZGVjaW1hbHM6IDAsIGdyaWRfb3B0aW9uczogeyBjb2x1bW5zOiA0IH0gfQogICAgLSB0eXBlOiBjdXN0b206bXVsdGktdHJlbmQtY2FyZAogICAgICB0aXRsZTogVGVtcGVyYXR1cmUgJiBkZXcgcG9pbnQKICAgICAgaWNvbjogbWRpOnRoZXJtb21ldGVyCiAgICAgIGhvdXJzX3RvX3Nob3c6IDEyCiAgICAgIHhfYXhpczogdHJ1ZQogICAgICBlbnRpdGllczoKICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3Iub3V0ZG9vcl90ZW1wZXJhdHVyZSwgbmFtZTogVGVtcGVyYXR1cmUsIGNvbG9yOiByZWQgfQogICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5kZXdfcG9pbnQsIG5hbWU6IERldyBwb2ludCwgY29sb3I6IGJsdWUgfQogICAgLSB0eXBlOiBjdXN0b206bXVsdGktdHJlbmQtY2FyZAogICAgICB0aXRsZTogV2luZAogICAgICBpY29uOiBtZGk6d2VhdGhlci13aW5keQogICAgICBjb2xvcjogdGVhbAogICAgICBob3Vyc190b19zaG93OiAxMgogICAgICBlbnRpdGllczoKICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3Iud2luZF9zcGVlZCwgbmFtZTogU3BlZWQsIGNvbG9yOiB0ZWFsIH0KICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3Iud2luZF9ndXN0LCBuYW1lOiBHdXN0cywgY29sb3I6IG9yYW5nZSB9CiAgICAgIGdyaWRfb3B0aW9uczogeyBjb2x1bW5zOiA2IH0KICAgIC0gdHlwZTogY3VzdG9tOm11bHRpLXRyZW5kLWNhcmQKICAgICAgdGl0bGU6IFByZXNzdXJlCiAgICAgIGljb246IG1kaTpnYXVnZQogICAgICBjb2xvcjogcHVycGxlCiAgICAgIGhvdXJzX3RvX3Nob3c6IDQ4CiAgICAgIHlfYXhpczogdHJ1ZQogICAgICBlbnRpdGllczoKICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3IucHJlc3N1cmUsIG5hbWU6IFByZXNzdXJlLCBjb2xvcjogcHVycGxlIH0KICAgICAgZ3JpZF9vcHRpb25zOiB7IGNvbHVtbnM6IDYgfQogICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWdyb3VwLWNhcmQKICAgICAgdGl0bGU6IExhc3QgMjQgaG91cnMKICAgICAgaWNvbjogbWRpOmNoYXJ0LXRpbWVsaW5lCiAgICAgIGhvdXJzX3RvX3Nob3c6IDI0CiAgICAgIGJ1Y2tldF9taW51dGVzOiA2MAogICAgICBlbnRpdGllczoKICAgICAgICAtIGVudGl0eTogc2Vuc29yLm91dGRvb3JfdGVtcGVyYXR1cmUKICAgICAgICAgIG5hbWU6IFRlbXBlcmF0dXJlCiAgICAgICAgICBkZWNpbWFsczogMQogICAgICAgICAgdmlzdWFsOiBzdHJpcAogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBiZWxvdzogMCwgY29sb3I6IGluZGlnbyB9CiAgICAgICAgICAgIC0geyBiZWxvdzogMTYsIGNvbG9yOiBibHVlIH0KICAgICAgICAgICAgLSB7IGJlbG93OiAyNiwgY29sb3I6IGdyZWVuIH0KICAgICAgICAgICAgLSB7IGFib3ZlOiAyNiwgY29sb3I6IG9yYW5nZSB9CiAgICAgICAgLSBlbnRpdHk6IHNlbnNvci53aW5kX3NwZWVkCiAgICAgICAgICBuYW1lOiBXaW5kCiAgICAgICAgICBkZWNpbWFsczogMAogICAgICAgICAgdmlzdWFsOiBzdHJpcAogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBiZWxvdzogMTAsIGNvbG9yOiBncmVlbiB9CiAgICAgICAgICAgIC0geyBiZWxvdzogMjAsIGNvbG9yOiBhbWJlciB9CiAgICAgICAgICAgIC0geyBiZWxvdzogMzUsIGNvbG9yOiBvcmFuZ2UgfQogICAgICAgICAgICAtIHsgYWJvdmU6IDM1LCBjb2xvcjogcmVkIH0KICAgICAgICAtIGVudGl0eTogc2Vuc29yLmlsbHVtaW5hbmNlCiAgICAgICAgICBuYW1lOiBEYXlsaWdodAogICAgICAgICAgZGVjaW1hbHM6IDAKICAgICAgICAgIHZpc3VhbDogc3RyaXAKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgYmVsb3c6IDEsIGNvbG9yOiBpbmRpZ28gfQogICAgICAgICAgICAtIHsgYmVsb3c6IDEwMCwgY29sb3I6IGJsdWUgfQogICAgICAgICAgICAtIHsgYmVsb3c6IDEwMDAwLCBjb2xvcjogYmx1ZS1ncmV5IH0KICAgICAgICAgICAgLSB7IGJlbG93OiAzMDAwMCwgY29sb3I6IGFtYmVyIH0KICAgICAgICAgICAgLSB7IGFib3ZlOiAzMDAwMCwgY29sb3I6IG9yYW5nZSB9CiAgICAgICAgLSBlbnRpdHk6IHNlbnNvci5vdXRkb29yX2h1bWlkaXR5CiAgICAgICAgICBuYW1lOiBIdW1pZGl0eQogICAgICAgICAgZGVjaW1hbHM6IDAKICAgICAgICAgIHZpc3VhbDogc3RyaXAKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgYmVsb3c6IDQwLCBjb2xvcjogYW1iZXIgfQogICAgICAgICAgICAtIHsgYmVsb3c6IDcwLCBjb2xvcjogZ3JlZW4gfQogICAgICAgICAgICAtIHsgYWJvdmU6IDcwLCBjb2xvcjogYmx1ZSB9Ci0gY29sdW1uX3NwYW46IDEKICBjYXJkczoKICAgIC0geyB0eXBlOiBoZWFkaW5nLCBoZWFkaW5nOiBGb3JlY2FzdCwgaWNvbjogbWRpOndlYXRoZXItcGFydGx5LWNsb3VkeSB9CiAgICAtIHR5cGU6IGN1c3RvbTp3ZWF0aGVyLWNhcmQKICAgICAgZW50aXR5OiB3ZWF0aGVyLmhvbWUKICAgICAgdGl0bGU6IFdlYXRoZXIKICAgICAgcnVsZXM6CiAgICAgICAgLSB7IHN0YXRlOiBsaWdodG5pbmctcmFpbnksIGNvbG9yOiByZWQsIGxhYmVsOiBTdG9ybSB3YXJuaW5nLCB0aW50X2NhcmQ6IHRydWUgfQogICAgICB0ZW1wZXJhdHVyZV9ydWxlczoKICAgICAgICAtIHsgYmVsb3c6IDEyLCBjb2xvcjogYmx1ZSwgbGFiZWw6IENvb2wgfQogICAgICAgIC0geyBiZWxvdzogMjAsIGNvbG9yOiBncmVlbiwgbGFiZWw6IE1pbGQgfQogICAgICAgIC0geyBhYm92ZTogMjAsIGNvbG9yOiBhbWJlciwgbGFiZWw6IFdhcm0gfQogICAgICBzZWN0aW9uczoKICAgICAgICAtIHR5cGU6IGhlcm8KICAgICAgICAtIHsgdHlwZTogcm93LCBlbnRpdGllczogW2h1bWlkaXR5LCB3aW5kX3NwZWVkLCBwcmVzc3VyZV0gfQogICAgICAgIC0gdHlwZTogZ3JpZAogICAgICAgICAgY29sdW1uczogMgogICAgICAgICAgZGl2aWRlcjogdHJ1ZQogICAgICAgICAgZW50aXRpZXM6CiAgICAgICAgICAgIC0gZW50aXR5OiBzZW5zb3IudXZfaW5kZXgKICAgICAgICAgICAgICBuYW1lOiBVViBpbmRleAogICAgICAgICAgICAgIHVuaXQ6ICIiCiAgICAgICAgICAgICAgdmlzdWFsOiBiYXIKICAgICAgICAgICAgICBtaW46IDAKICAgICAgICAgICAgICBtYXg6IDExCiAgICAgICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgICAgICAtIHsgYmVsb3c6IDMsIGNvbG9yOiBncmVlbiwgbGFiZWw6IExvdyB9CiAgICAgICAgICAgICAgICAtIHsgYmVsb3c6IDYsIGNvbG9yOiBhbWJlciwgbGFiZWw6IE1vZGVyYXRlIH0KICAgICAgICAgICAgICAgIC0geyBiZWxvdzogOCwgY29sb3I6IG9yYW5nZSwgbGFiZWw6IEhpZ2ggfQogICAgICAgICAgICAgICAgLSB7IGFib3ZlOiA4LCBjb2xvcjogcmVkLCBsYWJlbDogVmVyeSBoaWdoIH0KICAgICAgICAgICAgLSBlbnRpdHk6IHNlbnNvci5vdXRkb29yX2h1bWlkaXR5CiAgICAgICAgICAgICAgbmFtZTogSHVtaWRpdHkKICAgICAgICAgICAgICB2aXN1YWw6IGJhcgogICAgICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAgICAgLSB7IGJlbG93OiA0MCwgY29sb3I6IGFtYmVyLCBsYWJlbDogRHJ5IH0KICAgICAgICAgICAgICAgIC0geyBiZWxvdzogNzAsIGNvbG9yOiBncmVlbiwgbGFiZWw6IENvbWZvcnRhYmxlIH0KICAgICAgICAgICAgICAgIC0geyBhYm92ZTogNzAsIGNvbG9yOiBibHVlLCBsYWJlbDogSHVtaWQgfQogICAgICAgIC0geyB0eXBlOiB0cmVuZCwgbW9kZTogaG91cmx5LCBob3VyczogMTIsIHNob3c6IFt0ZW1wZXJhdHVyZSwgcHJlY2lwaXRhdGlvbl0sIGRpdmlkZXI6IHRydWUgfQogICAgICAgIC0geyB0eXBlOiBmb3JlY2FzdCwgbW9kZTogZGFpbHksIGRheXM6IDUsIGRpdmlkZXI6IHRydWUgfQogICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWdyb3VwLWNhcmQKICAgICAgdGl0bGU6IFN0YXRpb24KICAgICAgaWNvbjogbWRpOmFjY2Vzcy1wb2ludAogICAgICBsYXlvdXQ6IGdyaWQKICAgICAgY29sdW1uczogMgogICAgICBlbnRpdGllczoKICAgICAgICAtIGVudGl0eTogc2Vuc29yLndlYXRoZXJfc3RhdGlvbl9iYXR0ZXJ5CiAgICAgICAgICBuYW1lOiBCYXR0ZXJ5CiAgICAgICAgICB2aXN1YWw6IHJpbmcKICAgICAgICAgIHJ1bGVzOgogICAgICAgICAgICAtIHsgYmVsb3c6IDIwLCBjb2xvcjogcmVkIH0KICAgICAgICAgICAgLSB7IGJlbG93OiA1MCwgY29sb3I6IGFtYmVyIH0KICAgICAgICAgICAgLSB7IGFib3ZlOiA1MCwgY29sb3I6IGdyZWVuIH0KICAgICAgICAtIGVudGl0eTogc2Vuc29yLnJhaW5fcmF0ZQogICAgICAgICAgbmFtZTogUmFpbiByYXRlCiAgICAgICAgICBpY29uOiBtZGk6d2VhdGhlci1wb3VyaW5nCiAgICAgICAgICBkZWNpbWFsczogMQogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBiZWxvdzogMC4xLCBjb2xvcjogZ3JleSwgbGFiZWw6IERyeSB9CiAgICAgICAgICAgIC0geyBhYm92ZTogMC4xLCBjb2xvcjogYmx1ZSwgbGFiZWw6IFJhaW4gfQogICAgICAgIC0geyBlbnRpdHk6IHNlbnNvci5kZXdfcG9pbnQsIG5hbWU6IERldyBwb2ludCwgY29sb3I6IHRlYWwsIGRlY2ltYWxzOiAxIH0KICAgICAgICAtIGVudGl0eTogYmluYXJ5X3NlbnNvci5yYWluCiAgICAgICAgICBuYW1lOiBSYWluIHNlbnNvcgogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBzdGF0ZTogIm9uIiwgY29sb3I6IGJsdWUsIGljb246IG1kaTp3ZWF0aGVyLXJhaW55LCBsYWJlbDogV2V0IH0KICAgICAgICAgICAgLSB7IHN0YXRlOiAib2ZmIiwgY29sb3I6IGdyZXksIGljb246IG1kaTp3ZWF0aGVyLWNsb3VkeSwgbGFiZWw6IERyeSB9Ci0gY29sdW1uX3NwYW46IDMKICBjYXJkczoKICAgIC0geyB0eXBlOiBoZWFkaW5nLCBoZWFkaW5nOiBEYXlsaWdodCwgaWNvbjogbWRpOndoaXRlLWJhbGFuY2Utc3VubnkgfQogICAgLSB0eXBlOiBjdXN0b206ZW50aXR5LWdyb3VwLWNhcmQKICAgICAgdGl0bGU6IFN1biAmIGxpZ2h0CiAgICAgIGljb246IG1kaTpzdW4tYW5nbGUKICAgICAgZW50aXRpZXM6CiAgICAgICAgLSBlbnRpdHk6IHN1bi5zdW4KICAgICAgICAgIG5hbWU6IFN1bgogICAgICAgICAgdmlzdWFsOiBiYWRnZQogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBzdGF0ZTogYWJvdmVfaG9yaXpvbiwgY29sb3I6IGFtYmVyLCBpY29uOiBtZGk6d2hpdGUtYmFsYW5jZS1zdW5ueSwgbGFiZWw6IFVwIH0KICAgICAgICAgICAgLSB7IHN0YXRlOiBiZWxvd19ob3Jpem9uLCBjb2xvcjogaW5kaWdvLCBpY29uOiBtZGk6d2VhdGhlci1uaWdodCwgbGFiZWw6IERvd24gfQogICAgICAgIC0geyBlbnRpdHk6IHN1bi5zdW4sIG5hbWU6IEVsZXZhdGlvbiwgaWNvbjogbWRpOmFuZ2xlLWFjdXRlLCBhdHRyaWJ1dGU6IGVsZXZhdGlvbiwgdW5pdDogwrAsIGRlY2ltYWxzOiAwIH0KICAgICAgICAtIHsgZW50aXR5OiBzdW4uc3VuLCBuYW1lOiBBemltdXRoLCBpY29uOiBtZGk6Y29tcGFzcy1vdXRsaW5lLCBhdHRyaWJ1dGU6IGF6aW11dGgsIHVuaXQ6IMKwLCBkZWNpbWFsczogMCB9CiAgICAgICAgLSBlbnRpdHk6IHNlbnNvci5pbGx1bWluYW5jZQogICAgICAgICAgbmFtZTogSWxsdW1pbmFuY2UKICAgICAgICAgIGRlY2ltYWxzOiAwCiAgICAgICAgICBydWxlczoKICAgICAgICAgICAgLSB7IGJlbG93OiAxMCwgY29sb3I6IGluZGlnbywgbGFiZWw6IE5pZ2h0IH0KICAgICAgICAgICAgLSB7IGJlbG93OiAxMDAwLCBjb2xvcjogYmx1ZS1ncmV5LCBsYWJlbDogRGltIH0KICAgICAgICAgICAgLSB7IGJlbG93OiAyNTAwMCwgY29sb3I6IGFtYmVyLCBsYWJlbDogRGF5bGlnaHQgfQogICAgICAgICAgICAtIHsgYWJvdmU6IDI1MDAwLCBjb2xvcjogb3JhbmdlLCBsYWJlbDogQnJpZ2h0IHN1biB9CiAgICAgICAgLSBlbnRpdHk6IHNlbnNvci51dl9pbmRleAogICAgICAgICAgbmFtZTogVVYgaW5kZXgKICAgICAgICAgIHVuaXQ6ICIiCiAgICAgICAgICBkZWNpbWFsczogMQogICAgICAgICAgcnVsZXM6CiAgICAgICAgICAgIC0geyBiZWxvdzogMywgY29sb3I6IGdyZWVuLCBsYWJlbDogTG93IH0KICAgICAgICAgICAgLSB7IGJlbG93OiA2LCBjb2xvcjogYW1iZXIsIGxhYmVsOiBNb2RlcmF0ZSB9CiAgICAgICAgICAgIC0geyBiZWxvdzogOCwgY29sb3I6IG9yYW5nZSwgbGFiZWw6IEhpZ2ggfQogICAgICAgICAgICAtIHsgYWJvdmU6IDgsIGNvbG9yOiByZWQsIGxhYmVsOiBWZXJ5IGhpZ2ggfQogICAgICBncmlkX29wdGlvbnM6IHsgY29sdW1uczogNCB9CiAgICAtIHsgdHlwZTogY3VzdG9tOnN1bi1wYXRoLWNhcmQsIHRpdGxlOiBTdW4gdG9kYXksIGdyaWRfb3B0aW9uczogeyBjb2x1bW5zOiA0IH0gfQogICAgLSB0eXBlOiBjdXN0b206bXVsdGktdHJlbmQtY2FyZAogICAgICB0aXRsZTogVVYgaW5kZXgKICAgICAgaWNvbjogbWRpOnN1bi13aXJlbGVzcwogICAgICBjb2xvcjogYW1iZXIKICAgICAgaG91cnNfdG9fc2hvdzogMTIKICAgICAgeV9heGlzOiB0cnVlCiAgICAgIHhfYXhpczogdHJ1ZQogICAgICBlbnRpdGllczoKICAgICAgICAtIHsgZW50aXR5OiBzZW5zb3IudXZfaW5kZXgsIG5hbWU6IFVWIGluZGV4LCBjb2xvcjogYW1iZXIgfQogICAgICBncmlkX29wdGlvbnM6IHsgY29sdW1uczogNCwgcm93czogMSB9CiAgICAtIHR5cGU6IGN1c3RvbTppbGx1bWluYW5jZS1jYXJkCiAgICAgIGVudGl0eTogc2Vuc29yLmlsbHVtaW5hbmNlCiAgICAgIG5hbWU6IERheWxpZ2h0CiAgICAgIG1vZGU6IHRyZW5kCiAgICAgIHpvbmVzOgogICAgICAgIG5pZ2h0OiB7IGxhYmVsOiBOaWdodCB9CiAgICAgICAgdHdpbGlnaHQ6IHsgbGFiZWw6IFR3aWxpZ2h0IH0KICAgICAgICBvdmVyY2FzdDogeyBsYWJlbDogT3ZlcmNhc3QgfQogICAgICAgIGRheTogeyBsYWJlbDogRGF5IH0KICAgICAgICBzdW46IHsgbGFiZWw6IFN1biB9Cg==">

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
    - type: custom:multi-trend-card
      title: Wind
      icon: mdi:weather-windy
      color: teal
      hours_to_show: 12
      entities:
        - { entity: sensor.wind_speed, name: Speed, color: teal }
        - { entity: sensor.wind_gust, name: Gusts, color: orange }
      grid_options: { columns: 6 }
    - type: custom:multi-trend-card
      title: Pressure
      icon: mdi:gauge
      color: purple
      hours_to_show: 48
      y_axis: true
      entities:
        - { entity: sensor.pressure, name: Pressure, color: purple }
      grid_options: { columns: 6 }
    - type: custom:entity-group-card
      title: Last 24 hours
      icon: mdi:chart-timeline
      hours_to_show: 24
      bucket_minutes: 60
      entities:
        - entity: sensor.outdoor_temperature
          name: Temperature
          decimals: 1
          visual: strip
          rules:
            - { below: 0, color: indigo }
            - { below: 16, color: blue }
            - { below: 26, color: green }
            - { above: 26, color: orange }
        - entity: sensor.wind_speed
          name: Wind
          decimals: 0
          visual: strip
          rules:
            - { below: 10, color: green }
            - { below: 20, color: amber }
            - { below: 35, color: orange }
            - { above: 35, color: red }
        - entity: sensor.illuminance
          name: Daylight
          decimals: 0
          visual: strip
          rules:
            - { below: 1, color: indigo }
            - { below: 100, color: blue }
            - { below: 10000, color: blue-grey }
            - { below: 30000, color: amber }
            - { above: 30000, color: orange }
        - entity: sensor.outdoor_humidity
          name: Humidity
          decimals: 0
          visual: strip
          rules:
            - { below: 40, color: amber }
            - { below: 70, color: green }
            - { above: 70, color: blue }
- column_span: 1
  cards:
    - { type: heading, heading: Forecast, icon: mdi:weather-partly-cloudy }
    - type: custom:weather-card
      entity: weather.home
      title: Weather
      rules:
        - { state: lightning-rainy, color: red, label: Storm warning, tint_card: true }
      temperature_rules:
        - { below: 12, color: blue, label: Cool }
        - { below: 20, color: green, label: Mild }
        - { above: 20, color: amber, label: Warm }
      sections:
        - type: hero
        - { type: row, entities: [humidity, wind_speed, pressure] }
        - type: grid
          columns: 2
          divider: true
          entities:
            - entity: sensor.uv_index
              name: UV index
              unit: ""
              visual: bar
              min: 0
              max: 11
              rules:
                - { below: 3, color: green, label: Low }
                - { below: 6, color: amber, label: Moderate }
                - { below: 8, color: orange, label: High }
                - { above: 8, color: red, label: Very high }
            - entity: sensor.outdoor_humidity
              name: Humidity
              visual: bar
              rules:
                - { below: 40, color: amber, label: Dry }
                - { below: 70, color: green, label: Comfortable }
                - { above: 70, color: blue, label: Humid }
        - { type: trend, mode: hourly, hours: 12, show: [temperature, precipitation], divider: true }
        - { type: forecast, mode: daily, days: 5, divider: true }
    - type: custom:entity-group-card
      title: Station
      icon: mdi:access-point
      layout: grid
      columns: 2
      entities:
        - entity: sensor.weather_station_battery
          name: Battery
          visual: ring
          rules:
            - { below: 20, color: red }
            - { below: 50, color: amber }
            - { above: 50, color: green }
        - entity: sensor.rain_rate
          name: Rain rate
          icon: mdi:weather-pouring
          decimals: 1
          rules:
            - { below: 0.1, color: grey, label: Dry }
            - { above: 0.1, color: blue, label: Rain }
        - { entity: sensor.dew_point, name: Dew point, color: teal, decimals: 1 }
        - entity: binary_sensor.rain
          name: Rain sensor
          rules:
            - { state: "on", color: blue, icon: mdi:weather-rainy, label: Wet }
            - { state: "off", color: grey, icon: mdi:weather-cloudy, label: Dry }
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
    - type: custom:illuminance-card
      entity: sensor.illuminance
      name: Daylight
      mode: trend
      zones:
        night: { label: Night }
        twilight: { label: Twilight }
        overcast: { label: Overcast }
        day: { label: Day }
        sun: { label: Sun }
```

</DashboardGrid>
