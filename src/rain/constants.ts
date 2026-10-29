// Constants of the rain card (the animation's live in src/shared/rain/constants.ts).

export const CARD_TYPE = "rain-card-pro";

export const LEADS = ["animated", "icon"] as const;
export type Lead = (typeof LEADS)[number];
