// Ambient declarations: the build-time version define and the card registry Home Assistant reads.
declare const __VERSION__: string;

interface Window {
  customCards?: { type: string; name: string; description: string; preview?: boolean }[];
  // set by the dashboard: the factory for core cards (it also defines hui-card)
  loadCardHelpers?: () => Promise<import("./ha.ts").CardHelpers>;
}
