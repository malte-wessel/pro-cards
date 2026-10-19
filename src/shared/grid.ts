// The sections grid's fixed height. Home Assistant gives a card with a numeric `rows` the height
// of its cell (rows × 56 px plus the gaps), but on its wrapper div, not on the card: the card sits
// in an inline <hui-card>, so `ha-card { height: 100% }` reaches the wrapper only through a host
// that is inline too. Ours are blocks (`:host { display: block }`), so they take that height
// themselves: HA hands every card in a sections grid `layout = "grid"`, and the card works out
// as HA does (hui-card's getGridOptions, computeCardGridSize) whether its cell has fixed rows.
// Masonry and panel views and the cards of a stack never get `layout = "grid"`. The element side
// is GridCardElement (card.ts), the host rule STYLE_FIT_ROWS (constants.ts).
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
