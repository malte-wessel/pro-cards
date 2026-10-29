// Constants of the wind card (the animation's live in src/shared/wind/constants.ts).

export const CARD_TYPE = "wind-card-pro";

export const LEADS = ["animated", "arrow"] as const;
export type Lead = (typeof LEADS)[number];
