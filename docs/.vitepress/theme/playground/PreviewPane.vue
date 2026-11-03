<script setup lang="ts">
// The Playground's preview: the cards in a section of a sections view, at a width you pick (which
// is also the view columns a layout or swipe card counts for its breakpoints), its 12 columns and
// rows as guides, the theme, the picked card's grid size (written into its YAML) and the states of
// what it names.
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { loadRuntime, mountGrid, type MountHandle } from "../mount.ts";
import { THEMES, useExampleTheme, nextMode, type Mode } from "../exampleTheme.ts";
import StatePanel from "./StatePanel.vue";

const props = defineProps<{ cards: unknown[]; pick: number }>();
const emit = defineEmits<{
  grid: [value: { columns?: number; rows?: number | "auto" }];
  error: [message: string | null];
}>();

// the widths: a phone, one to three sections (the view columns they span), the whole pane
const WIDTHS = [
  { id: "phone", label: "Phone", px: 360, span: 1 },
  { id: "1", label: "1 section", px: 400, span: 1 },
  { id: "2", label: "2 sections", px: 824, span: 2 },
  { id: "3", label: "3 sections", px: 1248, span: 3 },
  { id: "full", label: "Full", px: 0, span: 4 },
] as const;
type WidthId = (typeof WIDTHS)[number]["id"];

// what the pane remembers in this browser
const PREFS = "pro-cards:playground:preview";
const prefs = ref<{ width: WidthId; mode: Mode; guides: boolean; states: boolean }>({
  width: "1",
  mode: "auto",
  guides: true,
  states: false,
});
onMounted(() => {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS) ?? "null");
    if (p && typeof p === "object") prefs.value = { ...prefs.value, ...p };
  } catch {
    // none, or refused: the defaults
  }
});
watch(
  prefs,
  (p) => {
    try {
      localStorage.setItem(PREFS, JSON.stringify(p));
    } catch {
      // refused: not remembered
    }
  },
  { deep: true },
);
const width = computed(() => WIDTHS.find((w) => w.id === prefs.value.width) ?? WIDTHS[1]);
const theme = useExampleTheme();

// the cards, mounted again for every change of them
const host = ref<HTMLDivElement | null>(null);
const error = ref("");
let handle: MountHandle | null = null;
const render = async () => {
  if (!host.value) return;
  handle?.dispose();
  handle = null;
  error.value = "";
  try {
    if (!props.cards.length) throw new Error("No card yet: pick an example or write one");
    handle = await mountGrid(host.value, props.cards, { fullWidth: false });
    emit("error", null);
  } catch (e) {
    host.value.textContent = "";
    error.value = e instanceof Error ? e.message : String(e);
    emit("error", error.value);
  }
};
onMounted(() => {
  void loadRuntime().then(render);
});
onBeforeUnmount(() => handle?.dispose());
watch(() => props.cards, render, { deep: true });

// the picked card's grid size, as its YAML has it
const card = computed(
  () => (props.cards[props.pick] ?? {}) as { grid_options?: { columns?: unknown; rows?: unknown } },
);
const columns = computed(() => String(card.value.grid_options?.columns ?? ""));
const rows = computed(() => String(card.value.grid_options?.rows ?? ""));
const setColumns = (v: string) => emit("grid", { columns: v ? Number(v) : undefined });
const setRows = (v: string) =>
  emit("grid", { rows: v === "auto" ? "auto" : v ? Number(v) : undefined });
</script>

<template>
  <div class="preview">
    <div class="pv-bar">
      <div class="seg" role="group" aria-label="Width">
        <button
          v-for="w in WIDTHS"
          :key="w.id"
          type="button"
          :class="{ on: prefs.width === w.id }"
          :title="w.px ? `${w.px} px, ${w.span} view column${w.span > 1 ? 's' : ''}` : 'The whole pane'"
          @click="prefs.width = w.id"
        >
          {{ w.label }}
        </button>
      </div>
      <span class="grow"></span>
      <label class="field" title="The card's columns in the section's 12 (grid_options)">
        Columns
        <select :value="columns" @change="setColumns(($event.target as HTMLSelectElement).value)">
          <option value="">Default</option>
          <option v-for="n in 12" :key="n" :value="String(n)">{{ n }}</option>
        </select>
      </label>
      <label class="field" title="The card's rows of 56 px (grid_options)">
        Rows
        <select :value="rows" @change="setRows(($event.target as HTMLSelectElement).value)">
          <option value="">Default</option>
          <option value="auto">auto</option>
          <option v-for="n in 8" :key="n" :value="String(n)">{{ n }}</option>
        </select>
      </label>
    </div>
    <div class="pv-bar sub">
      <button
        type="button"
        class="tb-btn small"
        :title="'Light or dark: ' + prefs.mode"
        @click="prefs.mode = nextMode(prefs.mode)"
      >
        {{ prefs.mode === "auto" ? "Auto" : prefs.mode === "light" ? "Light" : "Dark" }}
      </button>
      <select v-model="theme" class="theme" title="Home Assistant theme">
        <option v-for="t in THEMES" :key="t.id" :value="t.id">{{ t.label }}</option>
      </select>
      <span class="grow"></span>
      <label class="check"><input v-model="prefs.guides" type="checkbox" /> Grid</label>
    </div>

    <div
      class="stage frame-wrap ha-theme"
      :class="prefs.mode === 'auto' ? '' : prefs.mode"
      :data-theme="theme"
    >
      <div
        class="section"
        :class="{ guides: prefs.guides }"
        :style="{ width: width.px ? `${width.px}px` : '100%', '--column-span': String(width.span) }"
      >
        <div ref="host" class="ha-grid"></div>
        <div v-if="error" class="error">{{ error }}</div>
      </div>
    </div>

    <div class="drawer" :class="{ open: prefs.states }">
      <button
        type="button"
        class="drawer-head"
        :aria-expanded="prefs.states"
        @click="prefs.states = !prefs.states"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5z" /></svg>
        States
      </button>
      <div v-if="prefs.states" class="drawer-body"><StatePanel :cards="cards" /></div>
    </div>
  </div>
</template>

<style scoped>
.preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.pv-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 13px;
}
.pv-bar.sub {
  padding-top: 6px;
  padding-bottom: 6px;
}
.grow {
  flex: 1;
}
.seg {
  display: inline-flex;
  max-width: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  /* a phone: the wider presets scroll into view */
  overflow-x: auto;
  scrollbar-width: none;
}
.seg button {
  font: 12px var(--vp-font-family-base);
  padding: 5px 10px;
  border: 0;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  white-space: nowrap;
}
.seg button + button {
  border-left: 1px solid var(--vp-c-divider);
}
.seg button.on {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}
.field {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--vp-c-text-2);
}
select {
  font: 12px var(--vp-font-family-base);
  padding: 4px 6px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}
.check {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.stage {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 24px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: var(--primary-background-color, var(--vp-c-bg-soft));
}
.section {
  position: relative;
  max-width: 100%;
  flex: none;
}
/* the section's 12 columns and its rows (56 px, 8 px gaps), faint, behind the cards */
.section.guides::before {
  content: "";
  position: absolute;
  inset: 0;
  min-height: 248px;
  pointer-events: none;
  border-radius: 4px;
  background-image:
    repeating-linear-gradient(
      to right,
      color-mix(in srgb, var(--primary-text-color) 4%, transparent) 0 calc((100% - 88px) / 12),
      transparent calc((100% - 88px) / 12) calc((100% - 88px) / 12 + 8px)
    ),
    repeating-linear-gradient(
      to bottom,
      transparent 0 56px,
      var(--primary-background-color, var(--vp-c-bg-soft)) 56px 64px
    );
}
.section > .ha-grid {
  position: relative;
}
.error {
  position: relative;
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--vp-c-danger-1);
  background: var(--vp-c-danger-soft);
}
.drawer {
  border-top: 1px solid var(--vp-c-divider);
  flex: none;
}
.drawer.open {
  max-height: 45%;
  display: flex;
  flex-direction: column;
}
.drawer-head {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 8px 12px;
  border: 0;
  background: none;
  color: var(--vp-c-text-1);
  font: 600 13px var(--vp-font-family-base);
  cursor: pointer;
  text-align: left;
}
.drawer-head svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
  transform: rotate(-90deg);
  transition: transform 0.15s;
}
.drawer.open .drawer-head svg {
  transform: none;
}
.drawer-body {
  overflow-y: auto;
  padding: 0 12px 8px;
}
</style>
