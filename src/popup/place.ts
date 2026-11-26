// Pop-up Card Pro: where a card sits in the pop-up (pure). The pop-up's body is Home Assistant's
// section grid: 12 columns, a card spans what its grid options ask for (a tile half, a heading
// all of it), a card with rows gets that many rows of the section's row height and fills them.
import { rowsHeight } from "../shared/cards/units.ts";
import type { GridOptions } from "../shared/ha.ts";

export const GRID_COLUMNS = 12;

export interface Cell {
  style: Record<string, string>;
  gridLayout: boolean; // hui-card.layout = "grid": the card has fixed rows and fills them
}

// the columns a card spans: its own count, all of them for "full" or none given
export const spanOf = (grid: GridOptions | undefined): number => {
  const c = grid?.columns;
  if (typeof c !== "number" || !Number.isFinite(c)) return GRID_COLUMNS;
  return Math.max(1, Math.min(GRID_COLUMNS, Math.round(c)));
};

// a card's cell, `rowGap` the grid's row gap (a fixed card's height covers the gaps it spans)
export const cellOf = (grid: GridOptions | undefined, rowGap: string): Cell => {
  const style: Record<string, string> = { "grid-column": `span ${spanOf(grid)}` };
  const rows = typeof grid?.rows === "number" && grid.rows > 0 ? Math.round(grid.rows) : 0;
  if (rows) {
    style["grid-row"] = `span ${rows}`;
    style.height = rowsHeight(rows, rowGap);
  }
  return { style, gridLayout: rows > 0 };
};
