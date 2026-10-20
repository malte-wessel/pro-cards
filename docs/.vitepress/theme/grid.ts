// The size of a card's cell in Home Assistant's sections grid, as hui-card and
// computeCardGridSize work it out: the card's own grid options, overridden by the config's
// `grid_options` (or the older `layout_options`), the columns and a numeric row count clamped to
// the card's min / max. Shared by the docs grid (mount.ts) and the test harness.
import type { CardConfigBase, GridOptions } from "../../../src/shared/ha.ts";

// the pre-2024.11 `layout_options` (columns in quarters of a section), as HA migrates them
export interface LayoutOptions {
  grid_columns?: number | "full";
  grid_max_columns?: number;
  grid_min_columns?: number;
  grid_rows?: number | "auto";
  grid_max_rows?: number;
  grid_min_rows?: number;
}
const times3 = <T>(v: T) => (typeof v === "number" ? v * 3 : v);
export const migrateLayoutOptions = (o: LayoutOptions): GridOptions => {
  const g: GridOptions = {
    columns: times3(o.grid_columns),
    max_columns: times3(o.grid_max_columns),
    min_columns: times3(o.grid_min_columns),
    rows: o.grid_rows,
    max_rows: o.grid_max_rows,
    min_rows: o.grid_min_rows,
  };
  for (const k of Object.keys(g) as (keyof GridOptions)[]) if (g[k] === undefined) delete g[k];
  return g;
};

// the options a config gives: `grid_options` wins over the old `layout_options`
export const configGridOptions = (cfg: CardConfigBase): GridOptions => {
  if (cfg.grid_options && typeof cfg.grid_options === "object") return cfg.grid_options;
  const lo = cfg.layout_options;
  if (lo && typeof lo === "object") return migrateLayoutOptions(lo as LayoutOptions);
  return {};
};

// the cell: columns within 1..12 and the card's min / max; a numeric row count within its min /
// max, anything else "auto" (the card sizes to its content, or to its grid row)
export const cellSize = (own: GridOptions | undefined, cfg: CardConfigBase) => {
  const g: GridOptions = { ...(own || {}), ...configGridOptions(cfg) };
  let columns = Number(g.columns) || 12;
  if (typeof g.min_columns === "number") columns = Math.max(columns, g.min_columns);
  if (typeof g.max_columns === "number") columns = Math.min(columns, g.max_columns);
  columns = Math.min(12, Math.max(1, columns));
  if (typeof g.rows !== "number") return { columns, rows: "auto" as const };
  let rows = g.rows;
  if (typeof g.min_rows === "number") rows = Math.max(rows, g.min_rows);
  if (typeof g.max_rows === "number") rows = Math.min(rows, g.max_rows);
  return { columns, rows: Math.max(1, rows) };
};
