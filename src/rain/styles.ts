// CSS of the rain card: the entity layer's tile and group styles, the flow engine's and the
// rain animation's (src/shared/rain/styles.ts).
import { STYLE_GROUP_CARD, STYLE_TILE } from "../shared/entity/render/styles.ts";
import { STYLE_FLOW, STYLE_FLOW_MOTION } from "../shared/flow/styles.ts";
import { STYLE_RAIN } from "../shared/rain/styles.ts";

export const STYLE_RAIN_CARD =
  STYLE_GROUP_CARD + STYLE_TILE + STYLE_FLOW + STYLE_RAIN + STYLE_FLOW_MOTION;
