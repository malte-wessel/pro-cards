// The demo home's dashboards, as `lovelace/config` answers them: what a pop-up's `section:` reads.
// One dashboard, "dashboard-rooms", with a sections view "rooms": a section per room, each under
// a heading of its room's name.
const tile = (entity: string, extra: Record<string, unknown> = {}) => ({
  type: "custom:tile-card-pro",
  entity,
  ...extra,
});
const heading = (text: string, icon: string) => ({ type: "heading", heading: text, icon });
const full = { grid_options: { columns: 12 } };

export const DASHBOARDS: Record<string, unknown> = {
  "dashboard-rooms": {
    title: "Rooms",
    views: [
      {
        title: "Rooms",
        path: "rooms",
        type: "sections",
        sections: [
          {
            type: "grid",
            cards: [
              heading("Living room", "mdi:sofa"),
              tile("light.living_room"),
              tile("fan.living_room"),
              tile("climate.living_room", full),
              tile("cover.living_room_blinds", full),
              tile("media_player.living_room_speaker", full),
            ],
          },
          {
            type: "grid",
            cards: [
              heading("Kitchen", "mdi:countertop"),
              tile("light.kitchen"),
              tile("sensor.kitchen_temperature"),
              tile("climate.kitchen", full),
              tile("media_player.kitchen_speaker", full),
            ],
          },
          {
            type: "grid",
            cards: [
              heading("Bedroom", "mdi:bed"),
              tile("light.bedroom"),
              tile("fan.bedroom"),
              tile("climate.bedroom", full),
              tile("cover.bedroom_blinds", full),
            ],
          },
        ],
      },
    ],
  },
};
