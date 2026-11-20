// The schedule card's week as markup, from what the card shows now: seven lanes in the order the
// card shows the days, the axis under them; in edit mode the blocks are buttons, the selected
// ones with their handles, the dots above and below the selection, the bubble of a drag.
import type { HomeAssistant } from "../shared/ha.ts";
import { t } from "../shared/i18n.ts";
import type { EBlock } from "../shared/schedule/edit.ts";
import { dayAxisHtml, laneHtml, pct } from "../shared/schedule/lane.ts";
import type { Block } from "../shared/schedule/model.ts";
import { dataText, rangeText, type DataSpec } from "../shared/schedule/text.ts";
import { fmtDayMinutes } from "../shared/format.ts";
import { escapeHtml } from "../shared/util.ts";

export interface DayNames {
  short: string;
  narrow: string;
  long: string;
}
export interface EditView {
  sel: ReadonlySet<number>;
  bubble: { day: number; at: number; text: string } | null;
  // the dots above the selection's first row and below its last: dragged over other days, they
  // copy that row's selected blocks there
  fills: readonly { day: number; at: number; side: "top" | "bottom" }[];
  // the handles show only while no drag runs
  dragging: boolean;
  // the lanes' width in px and a text's width on a block (what text fits on it)
  laneW: number;
  textW: (text: string) => number;
}
export interface WeekView {
  hass: HomeAssistant | undefined;
  days: readonly (readonly (Block | EBlock)[])[];
  names: readonly DayNames[];
  // the row of today, and where now is on it (null: not shown)
  today: number | null;
  now: number;
  specs: readonly DataSpec[];
  loading: boolean;
  edit: EditView | null;
}

const esc = escapeHtml;

// "Monday, 06:00 to 08:30, 21 °C"
export const blockLabel = (
  hass: HomeAssistant | undefined,
  b: Block,
  day: string,
  specs: readonly DataSpec[],
) =>
  [
    t(hass, "schedule.block", {
      day,
      from: fmtDayMinutes(hass, b.from),
      to: fmtDayMinutes(hass, b.to),
    }),
    dataText(hass, b, specs),
  ]
    .filter(Boolean)
    .join(", ");

const dayKey = (n: DayNames, today: boolean) =>
  `<span class="key${today ? " today" : ""}"><span class="s">${esc(n.short)}</span><span class="n">${esc(n.narrow)}</span></span>`;

// what a block in edit mode says on itself: its times and data where they fit, else its data
const blockInner = (v: WeekView, e: EditView, b: Block) => {
  const px = ((b.to - b.from) / 1440) * e.laneW - 8;
  const data = dataText(v.hass, b, v.specs);
  const long = [rangeText(v.hass, b.from, b.to), data].filter(Boolean).join(" · ");
  const text = e.textW(long) <= px ? long : data && e.textW(data) <= px ? data : "";
  return text ? `<span class="st">${esc(text)}</span>` : "";
};

const viewRow = (v: WeekView, d: number) => {
  const blocks = v.days[d];
  const isToday = v.today === d;
  const cur = isToday ? blocks.find((b) => b.from <= v.now && v.now < b.to) : undefined;
  const label = blocks.length
    ? `${v.names[d].long}: ${blocks.map((b) => [rangeText(v.hass, b.from, b.to), dataText(v.hass, b, v.specs)].filter(Boolean).join(" ")).join("; ")}`
    : t(v.hass, "schedule.empty_day", { day: v.names[d].long });
  const ph =
    v.loading && isToday ? `<span class="sph">${esc(t(v.hass, "common.loading"))}</span>` : "";
  return `<div class="wrow"><span class="sdn">${dayKey(v.names[d], isToday)}</span><div class="slane" data-day="${d}" role="img" aria-label="${esc(label)}">${laneHtml(
    blocks.map((b) => ({ from: b.from, to: b.to, cur: b === cur })),
    isToday ? v.now : null,
    true,
  )}${ph}</div></div>`;
};

const editRow = (v: WeekView, e: EditView, d: number) => {
  const blocks = v.days[d] as readonly EBlock[];
  const isToday = v.today === d;
  const all = blocks.length > 0 && blocks.every((b) => e.sel.has(b.id));
  const name = v.names[d];
  let html = `<div class="wrow"><button class="sday" data-day="${d}" aria-pressed="${all}" aria-label="${esc(t(v.hass, "schedule.select_day", { day: name.long }))}">${dayKey(name, isToday)}</button><div class="slane e" data-day="${d}">`;
  html += laneHtml([], null, true);
  for (const b of blocks) {
    const on = e.sel.has(b.id);
    html += `<button class="sb${on ? " sel" : ""}" data-id="${b.id}" data-day="${d}" style="left:${pct(b.from)};width:${pct(b.to - b.from)}" aria-pressed="${on}" aria-label="${esc(blockLabel(v.hass, b, name.long, v.specs))}">${blockInner(v, e, b)}</button>`;
  }
  if (!e.dragging)
    for (const b of blocks)
      if (e.sel.has(b.id))
        for (const [edge, at] of [
          ["from", b.from],
          ["to", b.to],
        ] as const)
          html += `<button class="sknob" tabindex="-1" data-act="${edge}" data-id="${b.id}" style="left:${pct(at)}" aria-label="${esc(t(v.hass, edge === "from" ? "schedule.start" : "schedule.end", { time: fmtDayMinutes(v.hass, at) }))}"></button>`;
  for (const f of e.fills)
    if (f.day === d)
      html += `<button class="sfill ${f.side}" tabindex="-1" data-act="fill" data-day="${d}" data-side="${f.side}" style="left:${pct(f.at)}" aria-label="${esc(t(v.hass, "schedule.fill"))}"></button>`;
  if (isToday) html += `<i class="snow" style="left:${pct(v.now)}"></i>`;
  if (e.bubble?.day === d)
    html += `<span class="sbubble" style="left:${pct(e.bubble.at)}">${esc(e.bubble.text)}</span>`;
  return `${html}</div></div>`;
};

export const weekHtml = (v: WeekView) =>
  v.days.map((_, d) => (v.edit ? editRow(v, v.edit, d) : viewRow(v, d))).join("") +
  `<div class="saxisrow"><i></i><div class="saxis">${dayAxisHtml(v.hass)}</div></div>` +
  `<div class="tip"></div>`;
