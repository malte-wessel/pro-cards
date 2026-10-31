// The tile card, case by case from what its code draws: every poster type on a tile in the states
// it draws differently (`tt-`), the tile's own options (`to-`), and the sizes, widths and themes it
// fits itself to (`ts-`). A case sets the states it needs (`states`: a copy of an entity under a new
// id, so one case shows a type at several levels side by side).
import type { CardConfigBase, GridOptions } from "../../src/shared/ha.ts";
import type { StateOverride } from "../harness/harness.ts";
import { shoot, type Shot } from "./shoot.ts";

const T = "custom:tile-card-pro";
type Opts = Record<string, unknown>;
const t = (entity: string | null, o: Opts = {}): CardConfigBase => ({
  type: T,
  ...(entity ? { entity } : {}),
  ...o,
});
// a copy of `base` under a new id, in another state
const like = (base: string, state?: string | number, attributes?: Opts): StateOverride => ({
  like: base,
  state,
  attributes,
});

const cases: Record<string, Shot> = {};
const add = (name: string, cards: CardConfigBase[], o: Omit<Shot, "cards"> = {}) => {
  cases[name] = { cards, ...o };
};

// ----- the types -----

add(
  "tt-sensors",
  [
    t("sensor.living_room_temperature"),
    t("binary_sensor.door_front"),
    t("sensor.living_room_co2"),
    t("sensor.tt_co2_high"),
    t("sensor.outdoor_aqi"),
    t("sensor.living_room_pm25"),
    t("sensor.robot_battery"),
    t("sensor.tt_battery_low"),
  ],
  {
    states: {
      "sensor.tt_co2_high": like("sensor.living_room_co2", 2600),
      "sensor.tt_battery_low": like("sensor.robot_battery", 6),
    },
  },
);
add(
  "tt-weather",
  [
    t("weather.home"),
    t("weather.tt_rainy"),
    t("sun.sun"),
    t("sensor.wind_speed"),
    t("sensor.coast_wind_speed"),
    t("sensor.rain_rate"),
    t("sensor.tt_rain_heavy"),
    t(null, {
      poster: "trend",
      name: "Temperatures",
      series: ["sensor.living_room_temperature", "sensor.outdoor_temperature"],
    }),
  ],
  {
    states: {
      "weather.tt_rainy": like("weather.home", "rainy"),
      "sensor.tt_rain_heavy": like("sensor.rain_rate", 12),
    },
  },
);
add("tt-devices", [
  t("light.living_room"),
  t("light.office"),
  t("fan.living_room"),
  t("fan.bedroom"),
  t("climate.living_room"),
  t("climate.bedroom"),
  t("cover.living_room_blinds"),
  t("cover.garage_door"),
]);
add(
  "tt-devices-more",
  [
    t("lock.front_door"),
    t("lock.tt_jammed"),
    t("alarm_control_panel.home"),
    t("alarm_control_panel.tt_triggered"),
    t("vacuum.robot"),
    t("vacuum.basement"),
    t("media_player.living_room_speaker"),
    t("person.malte"),
  ],
  {
    states: {
      "lock.tt_jammed": like("lock.front_door", "jammed"),
      "alarm_control_panel.tt_triggered": like("alarm_control_panel.home", "triggered"),
    },
  },
);
add("tt-energy", [
  t("sensor.grid_power", { poster: "grid" }),
  t(null, {
    poster: "grid",
    name: "Grid",
    import: "sensor.grid_import_power",
    export: "sensor.grid_export_power",
  }),
  t("sensor.solar_power", { poster: "solar", today: "sensor.energy_today" }),
  t("sensor.battery_soc", { power: "sensor.battery_power" }),
  t("sensor.ev_battery", { poster: "car" }),
  t("sensor.washer_power", { poster: "appliance", variant: "washer" }),
]);
// unavailable, and an entity that does not exist
add("tt-unavailable", [
  t("light.shed"),
  t("climate.shed"),
  t("cover.shed_door"),
  t("lock.shed"),
  t("sensor.not_in_this_home"),
  t(null, { name: "Note", icon: "mdi:note-outline", value: "Bins out" }),
]);

// ----- the tile's own options -----

const CO2 = "sensor.living_room_co2";
add("to-line", [
  t(CO2, { secondary: "Upstairs" }),
  t(CO2, { status: false }),
  t(CO2, { status: "{{ 'Open a window' }}" }),
  t(CO2, { show_value: false }),
  t(CO2, { show_name: false }),
  t(CO2, { show_icon: false }),
  t(CO2, { name: "{{ 'Air' }}", value: "{{ 'Fine' }}", status: false }),
  t("sensor.living_room_temperature", {
    rules: [{ above: 20, color: "orange", label: "Warm", tint_card: true }],
  }),
]);
add("to-icon", [
  t("sensor.living_room_humidity", { icon_ring: true }),
  t("sensor.living_room_humidity", { icon_style: "plain" }),
  t("sensor.wind_speed", { icon: "mdi:weather-windy" }),
  t(null, { name: "Malte", value: "Home", icon_image: "person.malte" }),
  t("light.desk_lamp", { icon_tap_action: { action: "toggle" }, control: false }),
  t("media_player.living_room_speaker", { show_entity_picture: false }),
]);
add("to-picture", [
  t("weather.home", { show_picture: true }),
  t("sun.sun", { show_picture: true }),
  t("sensor.solar_power", { poster: "solar", show_picture: true }),
  t("sensor.outdoor_temperature", { visual: "sparkline" }),
  t("sensor.power_consumption", { visual: "columns" }),
  t("binary_sensor.door_front", { visual: "strip" }),
  t("sensor.living_room_humidity", { visual: "bar" }),
  t("sensor.living_room_humidity", { visual: "gauge" }),
]);
add("to-controls", [
  t("light.living_room", { control: "slider" }),
  t("light.living_room", { visual: "none" }),
  t("light.living_room", { control: false }),
  t("cover.living_room_blinds", { control: "slider" }),
  t("fan.living_room", { control: "toggle" }),
  t("media_player.living_room_speaker", { control: false }),
]);

// vertical: the icon on top, the name and the line centred, the controls below; each at the
// columns it asks for
const v = (entity: string | null, o: Opts = {}) => t(entity, { vertical: true, ...o });
add("to-vertical", [
  v("sensor.living_room_temperature"),
  v("sensor.living_room_co2"),
  v("light.desk_lamp"),
  v("fan.living_room"),
  v("climate.living_room"),
  v("cover.living_room_blinds"),
  v("vacuum.robot"),
  v("media_player.living_room_speaker"),
  v("sensor.wind_speed"),
  v("weather.home", { show_picture: true }),
  v("lock.front_door"),
  v("person.malte"),
]);

// ----- sizes, widths and themes -----

// half a section, a quarter, the whole width; and given one row with a second row's content (a
// card around it may give it less than it asks for: it fits into that)
const SIZES: GridOptions[] = [
  { columns: 6, rows: "auto" },
  { columns: 3, rows: "auto" },
  { columns: 12, rows: "auto" },
  { columns: 6, rows: 1 },
];
const SIZED: Record<string, CardConfigBase> = {
  entity: t("sensor.outdoor_temperature"),
  light: t("light.living_room"),
  climate: t("climate.living_room"),
  cover: t("cover.living_room_blinds"),
  vacuum: t("vacuum.robot"),
  media: t("media_player.living_room_speaker"),
  sparkline: t("sensor.outdoor_temperature", { visual: "sparkline" }),
  weather: t("weather.home", { show_picture: true }),
};
for (const [name, card] of Object.entries(SIZED))
  add(
    `ts-${name}`,
    SIZES.map((grid_options) => ({ ...card, grid_options })),
  );

// a vertical tile at its least, half a section and the whole, and given a second row
add("ts-vertical", [
  v("sensor.outdoor_temperature", { grid_options: { columns: 3, rows: "auto" } }),
  v("sensor.outdoor_temperature", { grid_options: { columns: 6, rows: "auto" } }),
  v("sensor.outdoor_temperature", { visual: "sparkline", grid_options: { columns: 3 } }),
  v("fan.living_room", { grid_options: { columns: 12, rows: "auto" } }),
  v("light.living_room", { control: "slider", grid_options: { columns: 6, rows: "auto" } }),
  v("light.living_room", { grid_options: { columns: 3, rows: 3 } }),
]);
add(
  "ts-vertical-phone",
  [
    v("sensor.living_room_co2"),
    v("light.living_room"),
    v("fan.living_room"),
    v("cover.living_room_blinds"),
    v("media_player.living_room_speaker"),
    v("vacuum.robot"),
  ],
  { width: 358 },
);

const FEW = [
  t("light.living_room"),
  t("climate.living_room"),
  t("media_player.living_room_speaker"),
  t("sensor.wind_speed"),
  t("vacuum.robot"),
  t("weather.home"),
];
// a phone 390 px wide: its section 358 px, half of it 175
add("ts-phone", FEW, { width: 358 });
add("ts-wide", FEW, { width: 760 });
add("ts-large-text", FEW, { skin: "large" });
add("ts-graphite", FEW, { skin: "graphite" });
add("ts-masonry", FEW, { layout: null });

shoot(cases);
