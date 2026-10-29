// Power in watts (pure): a sensor's value in W whatever power unit it reports, and W / kW
// formatting (the power flow card, the poster's grid, solar and battery kinds).
import type { EntityItem } from "./entity/config.ts";
import { unitOf, type EntityModel } from "./entity/model.ts";
import { fmtNumber } from "./format.ts";
import type { HomeAssistant } from "./ha.ts";

export const UNIT_TO_W: Record<string, number> = { W: 1, kW: 1000, MW: 1e6, mW: 1e-3 };
// a power unit converted to W (any other is shown as written)
export const isPowerUnit = (u: string) => u in UNIT_TO_W;

// the model's value in watts, null when unavailable
export const wattsOf = (ent: EntityItem, m: EntityModel | undefined): number | null => {
  if (!m || m.model.num === null) return null;
  return m.model.num * (UNIT_TO_W[unitOf(ent, m.st)] ?? 1);
};

// W below `kwAbove`, kW from it on (0: always kW), with their decimals
export interface Units {
  kwAbove: number;
  decW: number;
  decKw: number;
}
export const DEFAULT_UNITS: Units = { kwAbove: 1000, decW: 0, decKw: 2 };

// "850 W" or "1.23 kW" (magnitudes; the direction is told by colour and motion); an entity's own
// decimals win over the card's
export const fmtPower = (
  hass: HomeAssistant | undefined,
  w: number | null,
  units: Units = DEFAULT_UNITS,
  dec: number | null = null,
): string => {
  if (w === null || !Number.isFinite(w)) return "–";
  const v = Math.abs(w);
  if (units.kwAbove <= 0 || v >= units.kwAbove)
    return `${fmtNumber(hass, v / 1000, dec ?? units.decKw)} kW`;
  return `${fmtNumber(hass, v, dec ?? units.decW)} W`;
};
