// The height a card is given. Home Assistant sets it on the wrapper div around an inline
// <hui-card>: fixed for a numeric `rows` (rows × 56 px plus the gaps), stretched to the grid row
// for `rows: auto`; a horizontal stack stretches its cards too. Our hosts are blocks, so they take
// that height themselves (`:host([fill-height])`, STYLE_HOST): by default always, with
// `fill_height: false` only in a cell with fixed rows, which has that height whatever the card
// wants. HA hands every card in a sections grid `layout = "grid"`, and the card works out as HA
// does (hui-card's getGridOptions, computeCardGridSize) whether its cell has fixed rows. Masonry
// and panel views and the cards of a stack never get `layout = "grid"`. The element side is
// GridCardElement (card.ts). Pure: the docs grid and the test harness use it too.
import type { CardConfigBase, GridOptions } from "./ha.ts";

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

// whether HA gives the card a fixed height: in a sections grid (`layout` "grid") with a numeric
// row count once the card's own options and the config's are merged (min / max only clamp it)
export const fitRows = (layout: string | undefined, own: GridOptions, cfg: CardConfigBase) =>
  layout === "grid" && typeof { ...own, ...configGridOptions(cfg) }.rows === "number";

// whether the card takes the height it is given: unless `fill_height: false`, and then only in
// a cell with fixed rows
export const fillsHeight = (layout: string | undefined, own: GridOptions, cfg: CardConfigBase) =>
  cfg.fill_height !== false || fitRows(layout, own, cfg);
