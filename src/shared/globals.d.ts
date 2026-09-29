// Ambient declarations: the build-time version define and the card registry Home Assistant reads.
declare const __VERSION__: string;

interface Window {
  customCards?: { type: string; name: string; description: string; preview?: boolean }[];
}
