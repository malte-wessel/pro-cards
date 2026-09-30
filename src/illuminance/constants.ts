// Defaults of the illuminance card.
export const MODES = ["arc", "trend", "band"] as const;
export type IlluminanceMode = (typeof MODES)[number];
export const DEFAULTS: {
  mode: IlluminanceMode;
  hours_to_show: number;
  bucket_minutes: number;
  min_lx: number;
  max_lx: number;
} = {
  mode: "band",
  hours_to_show: 24,
  bucket_minutes: 30,
  min_lx: 0.1,
  max_lx: 100000,
};
