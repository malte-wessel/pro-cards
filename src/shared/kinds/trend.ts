// The trend kind: several entities (`poster: trend`, `series: [...]`), never detected. The
// first series' value large (the card's entity, when it has none of its own), the time window
// as the status, the lines overlaid along the bottom on one scale, their values under the pointer.
// A series takes its `color` (a template allowed), else its first matching rule's, else the
// palette's; its `visibility` hides it.
import { fmtNumber } from "../format.ts";
import { t } from "../i18n.ts";
import {
  drawTrend,
  showTrendHover,
  trendPlotEl,
  trendTimeAt,
  type TrendPlotEl,
} from "../trend/plot.ts";
import { seriesColor } from "../trend/color.ts";
import { normalizeSeries, type TrendSeries } from "../trend/series.ts";
import { decimalsOf, isTemplate } from "../util.ts";
import { partOf } from "./dom.ts";
import type { Kind, KindCtx } from "./types.ts";

const HOURS = 6;

// the series as written: ids or { entity, name, color, rules, visibility }; one without an entity
// is left out
const seriesOf = (opts: Record<string, unknown>): TrendSeries[] => {
  const list = Array.isArray(opts.series) ? opts.series : [];
  return list.flatMap((e, i) => normalizeSeries(e, i, "poster-card-pro", `series[${i}]`) ?? []);
};
const shownOf = (c: KindCtx) => seriesOf(c.opts).filter((s) => c.host.shown(s.visibility));

const specOf = (c: KindCtx, shown: TrendSeries[]) => {
  const hass = c.ctx.hass,
    hours = c.hours ?? HOURS;
  const tplGet = (t: string) => c.ctx.tplResult.get(t) ?? null;
  return {
    hass,
    t0: c.ctx.now - hours * 3600e3,
    t1: c.ctx.now,
    layout: "overlay" as const,
    // the visual's axes (visual: { axis: true })
    xAxis: !!(c.place.visual && c.place.visual.axis),
    yAxis: !!(c.place.visual && c.place.visual.axis),
    smoothing: { minutes: null },
    text: c.ctx.text,
    fill: true,
    series: shown.map((s) => {
      const st = hass?.states[s.entity];
      const unit = st?.attributes?.unit_of_measurement;
      return {
        pts: (c.ctx.series.get(s.entity) ?? []).flatMap((p) =>
          p.v === null ? [] : [{ t: p.t, v: p.v }],
        ),
        color: seriesColor(s, st, tplGet),
        name: s.name || String(st?.attributes?.friendly_name ?? s.entity),
        fmt: (v: number) => {
          const n = fmtNumber(hass, v, decimalsOf(st?.state ?? ""));
          return typeof unit === "string" && unit ? `${n} ${unit}` : n;
        },
      };
    }),
  };
};

export const TREND: Kind = {
  name: "trend",
  reads: "any",
  readsText: "its own entities",
  entityless: true,
  keys: ["series"],
  // its series' lines below the texts: the sparkline is its own
  visual: { type: "sparkline" },
  draws: ["sparkline"],
  // the first series is the card's entity when it has none
  main: (entity, _raw, opts) => {
    const first = seriesOf(opts)[0];
    return entity || !first ? {} : { entity: first.entity, name: first.name };
  },
  history: (opts) => seriesOf(opts).map((s) => s.entity),
  templates: (opts) =>
    seriesOf(opts).flatMap((s) => (s.color && isTemplate(s.color) ? [s.color] : [])),
  visibility: (opts) => seriesOf(opts).map((s) => s.visibility),
  // its window: the hours, or Today since midnight
  status: (c) =>
    c.place.visual && c.place.visual.hours === "today"
      ? t(c.ctx.hass, "weather.today")
      : t(c.ctx.hass, "common.hours", { n: c.hours ?? HOURS }),
  slots: (c) => {
    const plot = trendPlotEl("pcurve trend ptrend");
    c.host.hover(
      plot,
      (ev) => trendTimeAt(plot, ev),
      (t) => showTrendHover(plot, t),
    );
    return { picture: plot };
  },
  live: (c, row) => {
    const plot = partOf<TrendPlotEl>(row, ".ptrend");
    if (!plot) return;
    const shown = shownOf(c);
    const spec = specOf(c, shown);
    const key = JSON.stringify([
      plot.clientWidth,
      plot.clientHeight,
      Math.floor(c.ctx.now / 60e3),
      c.ctx.fetched,
      spec.series.map((s) => [s.pts.length, s.pts[s.pts.length - 1]?.v, s.color]),
    ]);
    if (plot.dataset.key === key) return;
    plot.dataset.key = key;
    drawTrend(plot, spec);
    if (c.host.hoverT !== null) showTrendHover(plot, c.host.hoverT);
  },
  extra: (c) => [
    !!(c.place.visual && c.place.visual.axis),
    shownOf(c)
      .map((s) => s.entity)
      .join(),
    c.place.visual ? (c.place.visual.hours ?? null) : null,
  ],
};
