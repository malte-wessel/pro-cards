// CSS of the wind card: the entity layer's tile and group styles, the flow engine's and the
// wind animation's (src/shared/wind/styles.ts).
import { STYLE_GROUP_CARD, STYLE_TILE } from "../shared/entity/render/styles.ts";
import { STYLE_FLOW, STYLE_FLOW_MOTION } from "../shared/flow/styles.ts";
import { STYLE_WIND } from "../shared/wind/styles.ts";

export const STYLE_WIND_CARD =
  STYLE_GROUP_CARD + STYLE_TILE + STYLE_FLOW + STYLE_WIND + STYLE_FLOW_MOTION;
