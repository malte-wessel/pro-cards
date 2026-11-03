// Ambient declarations: the build-time version define and the card registry Home Assistant reads.
declare const __VERSION__: string;

interface Window {
  customCards?: {
    type: string;
    name: string;
    description: string;
    preview?: boolean;
    // the card's suggestion for an entity picked in the card picker (null: none)
    getEntitySuggestion?: (
      hass: import("./ha.ts").HomeAssistant,
      entityId: string,
    ) => { config: import("./ha.ts").CardConfigBase } | null;
  }[];
  // set by the dashboard: the factory for core cards (it also defines hui-card)
  loadCardHelpers?: () => Promise<import("./ha.ts").CardHelpers>;
}
