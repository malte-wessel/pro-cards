// The Home Assistant theme the live examples render in. One choice for the whole site,
// remembered in localStorage; the auto / light / dark mode stays per example.
import { ref, watch, onMounted } from "vue";

export const THEMES = [
  { id: "default", label: "Home Assistant" },
  { id: "graphite", label: "Graphite" },
] as const;
export type ThemeId = (typeof THEMES)[number]["id"];

export type Mode = "auto" | "light" | "dark";
export const nextMode = (m: Mode): Mode =>
  m === "auto" ? "light" : m === "light" ? "dark" : "auto";

const KEY = "pro-cards:example-theme";
const isTheme = (v: unknown): v is ThemeId => THEMES.some((t) => t.id === v);

// module-level, so every frame on the page shares it
const theme = ref<ThemeId>("default");
let restored = false;

const restore = () => {
  if (restored) return;
  restored = true;
  try {
    const v = localStorage.getItem(KEY);
    if (isTheme(v)) theme.value = v;
  } catch {
    // private mode or storage blocked: keep the default
  }
  watch(theme, (v) => {
    try {
      localStorage.setItem(KEY, v);
    } catch {
      // ignore
    }
  });
};

// Restores the stored choice on the client after mount (never during SSR, so the markup
// hydrates without a mismatch) and returns the shared ref.
export function useExampleTheme() {
  onMounted(restore);
  return theme;
}
