// A schedule's lane: a day (or the next 24 hours) as a track with its blocks, a dashed line every
// six hours, the block that runs outlined and a line at now; the axis under it. Shared by the
// schedule card's week and the schedule kind's visual on a poster and a tile.
import { fmtDayMinutes } from "../format.ts";
import type { HomeAssistant } from "../ha.ts";
import { t } from "../i18n.ts";
import { escapeHtml } from "../util.ts";
import { DAY_MIN } from "./model.ts";

export interface LaneBlock {
  from: number;
  to: number;
  cur?: boolean;
}

// a position along the lane, in % of its span
export const pct = (m: number, span = DAY_MIN) => `${((m / span) * 100).toFixed(3)}%`;

// the lane's blocks, its six-hour lines (`grid`) and the line at now (minutes from its start)
export const laneHtml = (
  blocks: readonly LaneBlock[],
  now: number | null,
  grid: boolean,
  span = DAY_MIN,
) =>
  (grid
    ? [0.25, 0.5, 0.75].map((f) => `<i class="sgrid" style="left:${f * 100}%"></i>`).join("")
    : "") +
  blocks
    .map(
      (b) =>
        `<i class="sb${b.cur ? " cur" : ""}" style="left:${pct(b.from, span)};width:${pct(b.to - b.from, span)}"></i>`,
    )
    .join("") +
  (now === null ? "" : `<i class="snow" style="left:${pct(now, span)}"></i>`);

// the axis of a day: 00:00 to 24:00 every six hours (the quarters leave a narrow lane)
export const dayAxisHtml = (hass: HomeAssistant | undefined) =>
  [0, 360, 720, 1080, 1440]
    .map((m, i) => axisLabel(fmtDayMinutes(hass, m, true), i, m / DAY_MIN))
    .join("");
// the axis of the next 24 hours: now, +6 h … +24 h
export const aheadAxisHtml = (hass: HomeAssistant | undefined) =>
  [0, 6, 12, 18, 24]
    .map((h, i) =>
      axisLabel(h ? t(hass, "common.plus_hours", { n: h }) : t(hass, "common.now"), i, h / 24),
    )
    .join("");
const axisLabel = (text: string, i: number, f: number) =>
  `<span class="slbl${i === 0 ? " l" : i === 4 ? " r" : ""}${i % 2 ? " q" : ""}" style="left:${f * 100}%">${escapeHtml(text)}</span>`;
