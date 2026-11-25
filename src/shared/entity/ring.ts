// A ring around an icon that reads another entity (pure): what it reads, and how far it is filled.
// The v3 cards write it as `ring: …` on an icon place (kinds/ring.ts parses it).
import type { HassEntity } from "../ha.ts";
import { isNum } from "../util.ts";

export interface RingSource {
  entity: string;
  attribute: string | null;
  min: number | null;
  max: number | null;
}

// how far the ring is filled from the other entity: its value on its scale (the ring's min and max,
// else the entity's own min and max attributes, else 0 to 100); null where it has no number
export const ringProgressOf = (src: RingSource, st: HassEntity | undefined): number | null => {
  if (!st) return null;
  const raw = src.attribute ? st.attributes?.[src.attribute] : st.state;
  if (!isNum(raw)) return null;
  const num = (k: string) => {
    const v = st.attributes?.[k];
    return isNum(v) ? Number(v) : null;
  };
  // (as the bar's scale reads an entity's own: min, else min_value)
  const min = src.min ?? num("min") ?? num("min_value") ?? 0,
    max = src.max ?? num("max") ?? num("max_value") ?? 100;
  if (!(max > min)) return null;
  return Math.min(1, Math.max(0, (Number(raw) - min) / (max - min)));
};
