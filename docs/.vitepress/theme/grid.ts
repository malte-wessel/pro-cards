// The size of a card's cell in Home Assistant's sections grid, as hui-card and
// computeCardGridSize work it out: the card's own grid options, overridden by the config's
// `grid_options` (or the older `layout_options`), the columns and a numeric row count clamped to
// the card's min / max (src/shared/grid.ts reads the config the same way). Shared by the docs
// grid (mount.ts) and the test harness.
import { configGridOptions } from "../../../src/shared/grid.ts";
import type { CardConfigBase, GridOptions } from "../../../src/shared/ha.ts";

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
